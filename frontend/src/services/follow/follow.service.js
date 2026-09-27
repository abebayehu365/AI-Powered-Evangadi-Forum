import { addonClient } from '../core/addon.client.js';

/**
 * Follow service — follow/unfollow users and get stats.
 */
export const followService = {
  /**
   * Toggle follow/unfollow for a user. Returns new state + counts.
   */
  toggle: async userId => {
    const { data } = await addonClient.post(`/api/addon/follows/${userId}`);
    return data.data; // { following: bool, followerCount, followingCount }
  },

  /**
   * Get follow stats for a user.
   */
  getStats: async userId => {
    const { data } = await addonClient.get(`/api/addon/follows/${userId}/stats`);
    return data.data;
  },

  /**
   * Get followers list for a user.
   */
  getFollowers: async (userId, { limit = 20, offset = 0 } = {}) => {
    const { data } = await addonClient.get(
      `/api/addon/follows/${userId}/followers?limit=${limit}&offset=${offset}`,
    );
    return data.data;
  },

  /**
   * Get following list for a user.
   */
  getFollowing: async (userId, { limit = 20, offset = 0 } = {}) => {
    const { data } = await addonClient.get(
      `/api/addon/follows/${userId}/following?limit=${limit}&offset=${offset}`,
    );
    return data.data;
  },
};
