import api from './api';

export const merchantService = {
  getMerchants(search = '') {
    return api.get('/merchants', { params: { search } });
  },

  getMerchantById(id) {
    return api.get(`/merchants/${id}`);
  },

  getMerchantRecovery(id) {
    return api.get(`/merchants/${id}/recovery`);
  }
};
