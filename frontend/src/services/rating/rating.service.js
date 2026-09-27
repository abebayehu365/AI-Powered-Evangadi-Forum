import { apiClient } from '../core/api.client.js';

/**
 * Rating service — answer upvote/downvote and ratings.
 */
export const ratingService = {
  /**
   * Rate an answer. value: 1 (upvote), -1 (downvote), 0 (remove).
   */
  rate: async (answerId, value) => {
    const { data } = await apiClient.post(`/api/ratings/answers/${answerId}`, { value });
    return data.data;
  },

  /**
   * Get rating data for a single answer.
   */
  get: async answerId => {
    const { data } = await apiClient.get(`/api/ratings/answers/${answerId}`);
    return data.data;
  },

  /**
   * Get ratings for multiple answers at once.
   * @param {number[]} answerIds
   */
  getBulk: async answerIds => {
    if (!answerIds || !answerIds.length) return {};
    const { data } = await apiClient.get(
      `/api/ratings/bulk?ids=${answerIds.join(',')}`,
    );
    return data.data;
  },
};
