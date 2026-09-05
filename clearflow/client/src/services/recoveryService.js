import api from './api';

export const recoveryService = {
  getRecoveryAttempts(filters = {}) {
    return api.get('/recovery', { params: filters });
  },

  getRecoveryCase(paymentId) {
    return api.get(`/recovery/${paymentId}`);
  },

  analyzePayment(paymentId) {
    return api.post(`/recovery/analyze/${paymentId}`);
  },

  startRecovery(paymentId, options = {}) {
    return api.post(`/recovery/start/${paymentId}`, options);
  }
};
