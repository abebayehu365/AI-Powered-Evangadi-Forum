import { apiClient } from '../core/api.client.js';

export const likeService = {
  /**
   * Vote on an item: 1 for like, -1 for unlike, 0 to clear.
   */
  vote: async (itemType, itemId, vote) => {
    const { data } = await apiClient.post(`/api/likes/${itemType}/${itemId}`, {
      vote,
    });
    return data.data;
  },

  /**
   * Get like summary for an item.
   */
  get: async (itemType, itemId) => {
    const { data } = await apiClient.get(`/api/likes/${itemType}/${itemId}`);
    return data.data;
  },

  /**
   * Bulk get likes for multiple items.
   */
  getBulk: async (itemType, itemIds) => {
    if (!itemIds || !itemIds.length) return {};
    const { data } = await apiClient.get(
      `/api/likes/bulk/${itemType}?ids=${itemIds.join(',')}`,
    );
    return data.data;
  },
};
