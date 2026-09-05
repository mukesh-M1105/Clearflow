import api from './api';

export const analyticsService = {
  getRecoveryAnalytics(period = '90d', merchantId = null) {
    const params = { period };
    if (merchantId) params.merchantId = merchantId;
    return api.get('/analytics/recovery', { params });
  },

  getMerchantAnalytics() {
    return api.get('/analytics/merchants');
  }
};
