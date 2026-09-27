import { apiClient } from '../core/api.client.js';

/**
 * Normalizes error responses from question endpoints.
 */
function handleQuestionError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. Please try again.');
    }
    return new Error('Unable to reach the server. Please check your network connection.');
  }

  const message =
    error.response.data?.message ||
    error.response.data?.msg ||
    error.response.data?.error ||
    'Failed to complete question request.';
  return new Error(message);
}

/**
 * Fetches questions list with optional search query or mine filter.
 * @param {Object} [options]
 * @param {string} [options.search] - Keyword search query
 * @param {boolean} [options.mine] - Filter for currently authenticated user's questions
 * @returns {Promise<{ questions: Array, meta: Object }>}
 */
async function getQuestions({ search = '', mine = false } = {}) {
  try {
    const params = {};
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (mine) {
      params.mine = 'true';
    }

    const response = await apiClient.get('/api/questions', { params });
    const payload = response.data;

    const questions = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.questions)
      ? payload.questions
      : Array.isArray(payload)
      ? payload
      : [];

    return {
      questions,
      meta: payload?.meta || { total: questions.length },
    };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Fetches a single question and its community answers by questionHash or ID.
 * @param {string} questionHash
 * @returns {Promise<{ question: Object, answers: Array }>}
 */
async function getSingleQuestion(questionHash) {
  try {
    const response = await apiClient.get(`/api/questions/${questionHash}`);
    const data = response.data;

    // Normalize question and answers structure
    const question = data.question || data.data?.question || data.data || data;
    const answers = Array.isArray(data.answers)
      ? data.answers
      : Array.isArray(data.data?.answers)
      ? data.data.answers
      : [];

    return {
      question,
      answers,
    };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Performs AI semantic similarity search for questions.
 * @param {string} query
 * @returns {Promise<{ questions: Array, meta: Object }>}
 */
async function searchQuestionsSemantic(query) {
  try {
    const response = await apiClient.get('/api/questions/search', {
      params: { query },
    });
    const payload = response.data;
    const questions = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.questions)
      ? payload.questions
      : Array.isArray(payload)
      ? payload
      : [];

    return {
      questions,
      meta: payload?.meta || { total: questions.length, query },
    };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Finds questions similar to a given question hash.
 * @param {string} questionHash
 * @param {string} [titleFallback]
 * @returns {Promise<Array>}
 */
async function findSimilarQuestions(questionHash, titleFallback = '') {
  try {
    const response = await apiClient.get(`/api/questions/${questionHash}/similar`);
    const payload = response.data;
    const questions = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.questions)
      ? payload.questions
      : Array.isArray(payload)
      ? payload
      : [];
    return questions;
  } catch (error) {
    // If /similar endpoint is not available, fall back to semantic search by title
    if (titleFallback && titleFallback.trim()) {
      try {
        const fallback = await searchQuestionsSemantic(titleFallback);
        return fallback.questions.filter(q => q.questionHash !== questionHash);
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Creates a new question.
 * @param {Object} data
 * @param {string} data.title
 * @param {string} data.content
 * @returns {Promise<Object>} The created question object
 */
async function createQuestion({ title, content }) {
  try {
    const response = await apiClient.post('/api/questions', { title, content });
    return response.data?.data || response.data?.question || response.data;
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Requests real-time AI suggestions on a question draft.
 * @param {Object} data
 * @param {string} data.title
 * @param {string} data.content
 * @returns {Promise<{ tips: string[] }>}
 */
async function generateQuestionDraftCoach({ title, content }) {
  try {
    const response = await apiClient.post('/api/questions/draft-coach', { title, content });
    const data = response.data?.data || response.data;
    const tips = Array.isArray(data?.tips) ? data.tips : [];
    return { tips };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Evaluates how well a draft answer fits a question.
 * @param {string} questionHash
 * @param {string} answerText
 * @returns {Promise<{ level: 'strong' | 'partial' | 'weak', note: string }>}
 */
async function assessAnswerFit(questionHash, answerText) {
  try {
    const response = await apiClient.post(`/api/questions/${questionHash}/answer-fit`, {
      answerText,
    });
    const data = response.data?.data || response.data;
    return {
      level: data?.level || 'partial',
      note: data?.note || 'Draft evaluated.',
    };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

export const questionService = {
  getQuestions,
  getSingleQuestion,
  searchQuestionsSemantic,
  findSimilarQuestions,
  createQuestion,
  generateQuestionDraftCoach,
  assessAnswerFit,
};
