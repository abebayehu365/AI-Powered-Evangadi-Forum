import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { safeExecute } from '../../../../db/config.js';
import { ServiceUnavailableError, NotFoundError } from '../../../utils/errors/index.js';

const RECOMMEND_K = parseInt(process.env.RECOMMEND_K || '5', 10);
const RECOMMEND_THRESHOLD = parseFloat(process.env.RECOMMEND_THRESHOLD || '0.75');
const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI for vector service:', err.message);
  }
}

function normalizeWhiteSpaces(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeQuestionText({ title }) {
  return normalizeWhiteSpaces(`${title || ''}`.normalize('NFKC').toLowerCase());
}

export async function generateQuestionEmbedding(sourceText, options = {}) {
  const { taskType = 'RETRIEVAL_DOCUMENT' } = options;

  if (!genAI) {
    throw new ServiceUnavailableError('Gemini API key is not configured for embeddings');
  }

  try {
    const response = await genAI.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: sourceText,
      config: {
        taskType: taskType,
        outputDimensionality: 1536,
      },
    });

    const values = response.embedding?.values || response.embeddings?.[0]?.values;

    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Gemini embedding response does not contain values');
    }

    return { embedding: values };
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

function validateEmbedding(embedding) {
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding must be an array');
  }
  if (embedding.length === 0) {
    throw new Error('Embedding cannot be empty');
  }
  if (!embedding.every(v => typeof v === 'number' && !isNaN(v))) {
    throw new Error('Embedding must contain only numbers');
  }
  return true;
}

export async function startQuestionVector({
  questionId,
  sourceText,
  embedding,
  status = 'ready',
}) {
  if (status === 'failed' || !embedding || embedding.length === 0) {
    const sql = `
      INSERT INTO question_vectors (question_id, source_text, embedding, status)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        source_text = VALUES(source_text),
        embedding = VALUES(embedding),
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP
    `;
    await safeExecute(sql, [questionId, sourceText, JSON.stringify([]), 'failed']);
    return;
  }

  validateEmbedding(embedding);
  const embeddingJson = JSON.stringify(embedding);

  const sql = `
    INSERT INTO question_vectors (question_id, source_text, embedding, status)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      source_text = VALUES(source_text),
      embedding = VALUES(embedding),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP
  `;

  await safeExecute(sql, [questionId, sourceText, embeddingJson, status]);
}

// Alias for consistency
export const storeQuestionVector = startQuestionVector;

async function retrieveReadyEmbeddings(excludeQuestionId = null) {
  let sql = `SELECT question_id, embedding FROM question_vectors WHERE status = ?`;
  const params = ['ready'];
  if (excludeQuestionId) {
    sql += ` AND question_id != ?`;
    params.push(excludeQuestionId);
  }

  const rows = await safeExecute(sql, params);
  const embeddings = [];

  for (const row of rows) {
    try {
      const embedding =
        typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
      if (Array.isArray(embedding) && embedding.length > 0) {
        embeddings.push({
          questionId: row.question_id,
          embedding: embedding,
        });
      }
    } catch (parseError) {
      console.warn(`Skipping question ${row.question_id}: invalid embedding JSON`);
    }
  }
  return embeddings;
}

export function getVectorConfig() {
  return {
    recommendThreshold: RECOMMEND_THRESHOLD,
    recommendK: RECOMMEND_K,
  };
}

function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

async function hydrateQuestionsWithDetails(topResults) {
  if (!topResults || topResults.length === 0) {
    return [];
  }

  const questionIds = topResults.map(r => r.questionId);
  const placeholders = questionIds.map(() => '?').join(',');

  const sql = `
    SELECT 
      q.question_id AS questionId,
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
    WHERE q.question_id IN (${placeholders})
    GROUP BY q.question_id, u.user_id
  `;

  const rows = await safeExecute(sql, questionIds);

  const questionMap = {};
  rows.forEach(row => {
    questionMap[String(row.questionId)] = {
      id: row.questionId,
      questionHash: row.questionHash,
      title: row.title,
      content: row.content,
      answerCount: row.answerCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
      },
    };
  });

  return topResults
    .filter(result => questionMap[String(result.questionId)])
    .map(result => ({
      score: Number(result.score.toFixed(6)),
      ...questionMap[String(result.questionId)],
    }));
}

async function fallbackKeywordSearch(sourceText, normalizedK, excludeQuestionId = null) {
  const words = sourceText
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z0-9]/g, '').trim())
    .filter(w => w.length >= 3)
    .slice(0, 5);

  if (words.length === 0) {
    // If no specific words >= 3 chars, do a broad match
    let broadSql = `
      SELECT 
        q.question_id AS questionId,
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
    `;
    const params = [];
    if (excludeQuestionId) {
      broadSql += ` WHERE q.question_id != ? `;
      params.push(excludeQuestionId);
    }
    broadSql += `
      GROUP BY q.question_id, u.user_id
      ORDER BY q.created_at DESC
      LIMIT ${normalizedK}
    `;
    const broadRows = await safeExecute(broadSql, params);
    return broadRows.map((row, idx) => ({
      score: Number((0.80 - idx * 0.05).toFixed(4)),
      id: row.questionId,
      questionHash: row.questionHash,
      title: row.title,
      content: row.content,
      answerCount: row.answerCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
      },
    }));
  }

  const conditions = words.map(() => '(q.title LIKE ? OR q.content LIKE ?)').join(' OR ');
  const params = [];
  words.forEach(w => {
    params.push(`%${w}%`, `%${w}%`);
  });

  let sql = `
    SELECT 
      q.question_id AS questionId,
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
    WHERE (${conditions})
  `;

  if (excludeQuestionId) {
    sql += ` AND q.question_id != ? `;
    params.push(excludeQuestionId);
  }

  sql += `
    GROUP BY q.question_id, u.user_id
    ORDER BY q.created_at DESC
    LIMIT ${normalizedK}
  `;

  const rows = await safeExecute(sql, params);

  return rows.map((row, idx) => ({
    score: Number((0.85 - idx * 0.04).toFixed(4)),
    id: row.questionId,
    questionHash: row.questionHash,
    title: row.title,
    content: row.content,
    answerCount: row.answerCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.userId,
      firstName: row.firstName,
      lastName: row.lastName,
    },
  }));
}

export async function findSimilarQuestionByText({ sourceText, threshold, k }) {
  const normalizedK = k > 0 ? Math.min(k, 20) : RECOMMEND_K;
  const normalizedThreshold =
    threshold !== undefined && threshold >= 0 && threshold <= 1
      ? threshold
      : RECOMMEND_THRESHOLD;

  let embeddingResult = null;
  try {
    embeddingResult = await generateQuestionEmbedding(sourceText, {
      taskType: 'RETRIEVAL_QUERY',
    });
  } catch (error) {
    console.warn('Embedding generation unavailable for query, using keyword fallback:', error.message);
  }

  let similarQuestions = [];

  if (embeddingResult?.embedding) {
    const queryEmbedding = embeddingResult.embedding;
    const storedEmbeddings = await retrieveReadyEmbeddings();

    const similarities = [];
    for (const stored of storedEmbeddings) {
      const score = calculateCosineSimilarity(queryEmbedding, stored.embedding);
      if (score >= normalizedThreshold) {
        similarities.push({
          questionId: stored.questionId,
          score,
        });
      }
    }

    similarities.sort((a, b) => b.score - a.score);
    const topResults = similarities.slice(0, normalizedK);
    similarQuestions = await hydrateQuestionsWithDetails(topResults);
  }

  // Fallback to text/keyword matching if no vector results or embedding unavailable
  if (similarQuestions.length === 0) {
    similarQuestions = await fallbackKeywordSearch(sourceText, normalizedK);
  }

  return {
    ...embeddingResult,
    similarQuestions,
  };
}

export async function findSimilarQuestionsByQuestionHash({ questionHash, threshold, k }) {
  const normalizedK = k > 0 ? Math.min(k, 20) : RECOMMEND_K;
  const normalizedThreshold =
    threshold !== undefined && threshold >= 0 && threshold <= 1
      ? threshold
      : RECOMMEND_THRESHOLD;

  const questionRows = await safeExecute(
    `SELECT question_id, title FROM questions WHERE question_hash = ? LIMIT 1`,
    [questionHash],
  );

  if (!questionRows.length) {
    throw new NotFoundError('Question not found');
  }

  const sourceQuestionId = questionRows[0].question_id;
  const vectorRows = await safeExecute(
    `SELECT embedding FROM question_vectors WHERE question_id = ? AND status = 'ready' LIMIT 1`,
    [sourceQuestionId],
  );

  let sourceEmbedding = null;
  if (vectorRows.length > 0) {
    try {
      sourceEmbedding =
        typeof vectorRows[0].embedding === 'string'
          ? JSON.parse(vectorRows[0].embedding)
          : vectorRows[0].embedding;
    } catch (e) {
      sourceEmbedding = null;
    }
  }

  if (!Array.isArray(sourceEmbedding) || sourceEmbedding.length === 0) {
    // Try to generate on the fly
    try {
      const sourceText = normalizeQuestionText({ title: questionRows[0].title });
      const embRes = await generateQuestionEmbedding(sourceText, {
        taskType: 'RETRIEVAL_DOCUMENT',
        questionId: sourceQuestionId,
      });
      sourceEmbedding = embRes.embedding;
      await startQuestionVector({
        questionId: sourceQuestionId,
        sourceText,
        embedding: sourceEmbedding,
        status: 'ready',
      });
    } catch (err) {
      console.warn('Could not generate embedding for source question:', err.message);
    }
  }

  let similarQuestions = [];

  if (Array.isArray(sourceEmbedding) && sourceEmbedding.length > 0) {
    const storedEmbeddings = await retrieveReadyEmbeddings(sourceQuestionId);

    const similarities = [];
    for (const stored of storedEmbeddings) {
      const score = calculateCosineSimilarity(sourceEmbedding, stored.embedding);
      if (score >= normalizedThreshold) {
        similarities.push({
          questionId: stored.questionId,
          score,
        });
      }
    }

    similarities.sort((a, b) => b.score - a.score);
    const topResults = similarities.slice(0, normalizedK);
    similarQuestions = await hydrateQuestionsWithDetails(topResults);
  }

  // Fallback to keyword search if no vectors available
  if (similarQuestions.length === 0) {
    similarQuestions = await fallbackKeywordSearch(
      questionRows[0].title,
      normalizedK,
      sourceQuestionId,
    );
  }

  return {
    similarQuestions,
  };
}