import { addonClient } from '../core/addon.client.js';

/**
 * Support bot service — AI chat and FAQ.
 */
export const supportService = {
  /**
   * Send a chat message.
   * @param {{ message: string, messages: Array<{role:string, content:string}> }} param
   */
  chat: async ({ message, messages = [] }) => {
    const { data } = await addonClient.post('/api/addon/support/chat', { message, messages });
    return data.data; // { reply: string }
  },

  /**
   * Fetch suggested FAQ questions for the welcome state.
   */
  getFaqs: async () => {
    const { data } = await addonClient.get('/api/addon/support/faqs');
    return data.data; // { faqs: string[] }
  },
};
