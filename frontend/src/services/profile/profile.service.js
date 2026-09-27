import { addonClient } from '../core/addon.client.js';

/**
 * Profile service — view and update user profiles.
 */
export const profileService = {
  /**
   * Get a user's public profile by ID.
   */
  get: async userId => {
    const { data } = await addonClient.get(`/api/addon/profiles/${userId}`);
    return data.data;
  },

  /**
   * Update the authenticated user's own profile.
   * @param {{ bio?: string, avatarUrl?: string }} updates
   */
  update: async updates => {
    const { data } = await addonClient.put('/api/addon/profiles/me', updates);
    return data.data;
  },
};
