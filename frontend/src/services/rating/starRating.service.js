import { apiClient } from '../core/api.client.js';

export const starRatingService = {
  /**
   * Rate an item from 1 to 5 stars (0 to remove).
   */
  rate: async (itemType, itemId, score) => {
    const { data } = await apiClient.post(`/api/ratings/stars/${itemType}/${itemId}`, {
      score,
    });
    return data.data;
  },

  /**
   * Get 1-5 star rating data for a single item.
   */
  get: async (itemType, itemId) => {
    const { data } = await apiClient.get(`/api/ratings/stars/${itemType}/${itemId}`);
    return data.data;
  },

  /**
   * Bulk get 1-5 star ratings for multiple items.
   */
  getBulk: async (itemType, itemIds) => {
    if (!itemIds || !itemIds.length) return {};
    const { data } = await apiClient.get(
      `/api/ratings/stars/bulk/${itemType}?ids=${itemIds.join(',')}`,
    );
    return data.data;
  },
};
