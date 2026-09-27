import { addonClient } from '../core/addon.client.js';

/**
 * Report service — submit content reports.
 */
export const reportService = {
  /**
   * Submit a report for a question or answer.
   * @param {{ targetType: 'question'|'answer', targetId: number, reason: string, description?: string }} data
   */
  submit: async ({ targetType, targetId, reason, description }) => {
    const { data } = await addonClient.post('/api/addon/reports', {
      targetType,
      targetId,
      reason,
      description,
    });
    return data.data;
  },
};

export const REPORT_REASONS = [
  { value: 'spam',            label: 'Spam' },
  { value: 'offensive',       label: 'Offensive / Harmful' },
  { value: 'misinformation',  label: 'Misinformation' },
  { value: 'off_topic',       label: 'Off Topic' },
  { value: 'plagiarism',      label: 'Plagiarism' },
  { value: 'other',           label: 'Other' },
];
