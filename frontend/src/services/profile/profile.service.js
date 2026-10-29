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
   * @param {{ firstName: string, lastName: string, avatarFile?: File }} updates
   */
  update: async ({ firstName, lastName, avatarFile }) => {
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    if (avatarFile) formData.append('profilePicture', avatarFile);

    const { data } = await addonClient.put('/api/addon/profiles/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};
