import crypto from 'crypto';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';
import { safeExecute } from '../../../../db/config.js';
import {
  findSimilarQuestionByText,
  findSimilarQuestionsByQuestionHash,
  generateQuestionEmbedding,
  getVectorConfig,
  normalizeQuestionText,
  startQuestionVector,
} from './vector.service.js';

const generateQuestionHash = () => crypto.randomBytes(8).toString('hex');

export const createQuestionWithVectorService = async payload => {
  const { userId, title, content } = payload;
  const insertQuestionSql = `
    INSERT INTO questions (question_hash, user_id, title, content) 
    VALUES (?, ?, ?, ?)
  `;
  const questionHash = generateQuestionHash();

  let questionResult;
  try {
    questionResult = await safeExecute(insertQuestionSql, [
      questionHash,
      userId,
      title,
      content,
    ]);
  } catch (error) {
    if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new BadRequestError('User does not exist');
    }
    throw error;
  }

  const questionId = questionResult.insertId;
  const creationResult = {
    id: questionId,
    questionHash,
    title,
    content,
    userId,
  };

  const sourceText = normalizeQuestionText({ title });

  try {
    const embeddingResult = await generateQuestionEmbedding(sourceText, {
      taskType: 'RETRIEVAL_DOCUMENT',
      questionId,
    });

    if (embeddingResult?.embedding && embeddingResult.embedding.length > 0) {
      await startQuestionVector({
        questionId,
        sourceText,
        embedding: embeddingResult.embedding,
        status: 'ready',
      });
    } else {
      await startQuestionVector({
        questionId,
        sourceText,
        embedding: [],
        status: 'failed',
      });
    }
  } catch (error) {
    console.error('=== FAILED TO STORE VECTOR FOR QUESTION ===');
    console.error('Question ID:', questionId);
    console.error('Error:', error.message);
    console.error('===========================================');

    await startQuestionVector({
      questionId,
      sourceText,
      embedding: [],
      status: 'failed',
    }).catch(e => console.error('Failed to save failed status:', e.message));
  }

  return {
    question: creationResult,
  };
};

const buildQuestionFilters = filters => {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push('(q.title LIKE ? OR q.content LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.mine && filters.userId) {
    conditions.push('q.user_id = ?');
    params.push(filters.userId);
  }

  if (conditions.length === 0) {
    return { whereClause: '', params };
  }

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    params,
  };
};

export const getQuestionService = async (filters = {}) => {
  const normalizedLimit = 100;
  const sortColumn = 'q.created_at';
  const normalizedSortOrder = 'DESC';
  const { whereClause, params } = buildQuestionFilters(filters);

  const listSql = `
    SELECT
      q.question_id AS id,
      q.question_hash AS questionHash,
      q.title,
      q.content,
      q.created_at AS createdAt,
      q.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName,
      COUNT(DISTINCT a.answer_id) AS answerCount
    FROM questions q
    JOIN users u ON u.user_id = q.user_id
    LEFT JOIN answers a ON a.question_id = q.question_id
    ${whereClause}
    GROUP BY q.question_id, u.user_id
    ORDER BY ${sortColumn} ${normalizedSortOrder}
    LIMIT ${normalizedLimit}
  `;

  const rows = await safeExecute(listSql, params);

  return {
    data: rows.map(question => ({
      id: question.id,
      questionHash: question.questionHash,
      title: question.title,
      content: question.content,
      answerCount: question.answerCount,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      author: {
        id: question.userId,
        firstName: question.firstName,
        lastName: question.lastName,
      },
    })),
    meta: {
      limit: normalizedLimit,
      total: rows.length,
      sortBy: 'newest',
      sortOrder: 'desc',
    },
  };
};

export const getSingleQuestionService = async ({ questionHash, includeAnswers = true }) => {
  const normalizedAnswerLimit = 100;
  const questionSql = `
    SELECT 
      q.question_id AS id,
      q.question_hash AS questionHash,
      q.title,
      q.content,
      q.created_at AS createdAt,
      q.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName,
      COUNT(DISTINCT a.answer_id) AS answerCount
    FROM questions q
    JOIN users u ON u.user_id = q.user_id
    LEFT JOIN answers a ON a.question_id = q.question_id
    WHERE q.question_hash = ?
    GROUP BY q.question_id, u.user_id
    LIMIT 1
  `;

  const questionRows = await safeExecute(questionSql, [questionHash]);
  if (!questionRows.length) {
    throw new NotFoundError('Question not found');
  }

  const question = questionRows[0];
  let answers = [];

  if (includeAnswers) {
    const answerSql = `
      SELECT
        a.answer_id AS id,
        a.question_id AS questionId,
        a.content,
        a.created_at AS createdAt,
        a.updated_at AS updatedAt,
        u.user_id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName
      FROM answers a
      JOIN users u ON u.user_id = a.user_id
      WHERE a.question_id = ?
      ORDER BY a.created_at ASC
      LIMIT ${normalizedAnswerLimit}
    `;
    answers = await safeExecute(answerSql, [question.id]);
  }

  return {
    question: {
      id: question.id,
      questionHash: question.questionHash,
      title: question.title,
      content: question.content,
      answerCount: question.answerCount,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      author: {
        id: question.userId,
        firstName: question.firstName,
        lastName: question.lastName,
      },
    },
    answers: answers.map(answer => ({
      id: answer.id,
      content: answer.content,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
      author: {
        id: answer.userId,
        firstName: answer.firstName,
        lastName: answer.lastName,
      },
    })),
    answersMeta: {
      limit: normalizedAnswerLimit,
      total: answers.length,
    },
  };
};

export const searchQuestionsSemanticService = async ({
  query,
  k = 5,
  threshold,
}) => {
  const sourceText = normalizeQuestionText({ title: query });
  const vectorConfig = getVectorConfig();
  const searchThreshold =
    threshold !== undefined ? threshold : vectorConfig.recommendThreshold;

  const result = await findSimilarQuestionByText({
    sourceText,
    threshold: searchThreshold,
    k,
  });

  return {
    data: result.similarQuestions,
    meta: {
      query,
      k,
      threshold: searchThreshold,
      total: result.similarQuestions.length,
      questionHash: null,
    },
  };
};

export const getSimilarQuestionsService = async ({
  questionHash,
  k = 5,
  threshold,
}) => {
  const vectorConfig = getVectorConfig();
  const searchThreshold =
    threshold !== undefined ? threshold : vectorConfig.recommendThreshold;

  const result = await findSimilarQuestionsByQuestionHash({
    questionHash,
    threshold: searchThreshold,
    k,
  });

  return {
    data: result.similarQuestions,
    meta: {
      total: result.similarQuestions.length,
      k,
      threshold: searchThreshold,
      query: null,
      questionHash,
    },
  };
};