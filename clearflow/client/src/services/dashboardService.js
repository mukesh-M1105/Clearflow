import api from './api';

export const dashboardService = {
  getSummary(period = '90d', merchantId = null) {
    const params = { period };
    if (merchantId) params.merchantId = merchantId;
    return api.get('/dashboard/summary', { params });
  },

  getPaymentTrend(period = '90d', merchantId = null) {
    const params = { period };
    if (merchantId) params.merchantId = merchantId;
    return api.get('/dashboard/payment-trend', { params });
  },

  getRecoveryTrend(period = '90d', merchantId = null) {
    const params = { period };
    if (merchantId) params.merchantId = merchantId;
    return api.get('/dashboard/recovery-trend', { params });
  },

  getFailureReasons(period = '90d', merchantId = null) {
    const params = { period };
    if (merchantId) params.merchantId = merchantId;
    return api.get('/dashboard/failure-reasons', { params });
  },

  getOpportunities(limit = 6, merchantId = null) {
    const params = { limit };
    if (merchantId) params.merchantId = merchantId;
    return api.get('/dashboard/opportunities', { params });
  }
};
