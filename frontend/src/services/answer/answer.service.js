import { apiClient } from '../core/api.client.js';

/**
 * Normalizes error responses from answer endpoints.
 */
function handleAnswerError(error) {
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
    'Failed to submit answer.';
  return new Error(message);
}

/**
 * Posts an answer to a question.
 * @param {Object} payload
 * @param {number|string} payload.questionId
 * @param {string} payload.content
 * @returns {Promise<Object>}
 */
async function postAnswer({ questionId, content }) {
  try {
    const response = await apiClient.post('/api/answers', {
      questionId,
      content,
    });
    return response.data?.data?.answer || response.data?.data || response.data;
  } catch (error) {
    throw handleAnswerError(error);
  }
}

export const answerService = {
  postAnswer,
};
