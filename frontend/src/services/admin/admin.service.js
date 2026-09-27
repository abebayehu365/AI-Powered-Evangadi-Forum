import { apiClient } from '../core/api.client.js';

export const adminService = {
  /**
   * Get overall forum & moderation stats
   */
  getStats: async () => {
    const { data } = await apiClient.get('/api/admin/stats');
    return data.stats;
  },

  /**
   * Get reports with optional status filter
   */
  getReports: async (status = 'all', limit = 50, offset = 0) => {
    const query = new URLSearchParams({
      status: status || 'all',
      limit: String(limit),
      offset: String(offset),
    });
    const { data } = await apiClient.get(`/api/admin/reports?${query.toString()}`);
    return data.data;
  },

  /**
   * Update report status: 'pending', 'reviewed', 'actioned', 'dismissed'
   */
  updateReportStatus: async (reportId, status) => {
    const { data } = await apiClient.patch(`/api/admin/reports/${reportId}/status`, {
      status,
    });
    return data.data;
  },

  /**
   * Delete reported content directly and resolve report
   */
  deleteReportedContent: async reportId => {
    const { data } = await apiClient.delete(`/api/admin/reports/${reportId}/content`);
    return data;
  },

  /**
   * Get users for admin management
   */
  getUsers: async (search = '', limit = 50, offset = 0) => {
    const query = new URLSearchParams({
      search,
      limit: String(limit),
      offset: String(offset),
    });
    const { data } = await apiClient.get(`/api/admin/users?${query.toString()}`);
    return data;
  },

  /**
   * Update user role (admin, co-admin, user)
   */
  updateUserRole: async (userId, role) => {
    const { data } = await apiClient.patch(`/api/admin/users/${userId}/role`, { role });
    return data;
  },

  /**
   * Get questions for admin moderation
   */
  getQuestions: async (search = '', limit = 50, offset = 0) => {
    const query = new URLSearchParams({
      search,
      limit: String(limit),
      offset: String(offset),
    });
    const { data } = await apiClient.get(`/api/admin/questions?${query.toString()}`);
    return data;
  },

  /**
   * Edit question by admin/co-admin
   */
  editQuestion: async (questionId, { title, content }) => {
    const { data } = await apiClient.patch(`/api/admin/questions/${questionId}`, { title, content });
    return data;
  },

  /**
   * Delete question directly by admin/co-admin
   */
  deleteQuestion: async questionId => {
    const { data } = await apiClient.delete(`/api/admin/questions/${questionId}`);
    return data;
  },

  /**
   * Get Telebirr payments for manual verification
   */
  getPayments: async (status = 'all', limit = 50, offset = 0) => {
    const query = new URLSearchParams({
      status: status || 'all',
      limit: String(limit),
      offset: String(offset),
    });
    const { data } = await apiClient.get(`/api/admin/payments?${query.toString()}`);
    return data.payments;
  },

  /**
   * Approve payment and unlock user Premium
   */
  approvePayment: async paymentId => {
    const { data } = await apiClient.patch(`/api/admin/payments/${paymentId}/approve`);
    return data;
  },

  /**
   * Reject fake or unpaid payment
   */
  rejectPayment: async paymentId => {
    const { data } = await apiClient.patch(`/api/admin/payments/${paymentId}/reject`);
    return data;
  },

  /**
   * Manually grant or revoke Premium for any user without DB access
   */
  setUserPremium: async (userId, isPremium) => {
    const { data } = await apiClient.patch(`/api/admin/users/${userId}/premium`, { isPremium });
    return data;
  },

  /**
   * Assign Admin or Co-Admin role by typing an email address in the frontend
   */
  assignRoleByEmail: async (email, role) => {
    const { data } = await apiClient.post('/api/admin/users/assign-by-email', { email, role });
    return data;
  },
};
