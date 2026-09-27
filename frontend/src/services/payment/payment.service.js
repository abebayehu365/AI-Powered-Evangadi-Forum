import { apiClient } from '../core/api.client.js';

export const paymentService = {
  /**
   * Check whether live Telebirr API credentials are set on the backend.
   */
  getTelebirrApiConfigStatus: async () => {
    const { data } = await apiClient.get('/api/payment/telebirr-api/config-status');
    return data.status;
  },

  /**
   * Option 1: Official Telebirr API Checkout gateway (telebirrjs).
   * Generates toPayUrl (live) or sandbox session.
   */
  checkoutWithTelebirrApi: async phoneNumber => {
    const { data } = await apiClient.post('/api/payment/telebirr-api/checkout', {
      phoneNumber,
    });
    return data;
  },

  /**
   * Complete sandbox test payment (when live credentials are not set).
   */
  completeSandboxPayment: async outTradeNo => {
    const { data } = await apiClient.post('/api/payment/telebirr-api/sandbox-complete', {
      outTradeNo,
    });
    return data;
  },

  /**
   * Option 2: Initiate manual 5 Birr Telebirr transfer with SMS receipt to 0941427950.
   * @param {string} phoneNumber - Ethiopian phone number (e.g. 0912345678)
   * @param {string} transactionCode - Telebirr transaction code from SMS
   */
  payWithTelebirr: async (phoneNumber, transactionCode) => {
    const { data } = await apiClient.post('/api/payment/telebirr-api', {
      phoneNumber,
      transactionCode,
    }).catch(async () => {
      // Fallback to legacy endpoint if needed
      const res = await apiClient.post('/api/payment/telebirr', {
        phoneNumber,
        transactionCode,
      });
      return res;
    });
    return data;
  },

  /**
   * Get user subscription status and payment records.
   */
  getSubscription: async () => {
    const { data } = await apiClient.get('/api/payment/subscription');
    return data.subscription;
  },
};
