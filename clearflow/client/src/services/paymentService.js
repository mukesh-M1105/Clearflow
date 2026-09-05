import api from './api';

export const paymentService = {
  getPayments(filters = {}) {
    return api.get('/payments', { params: filters });
  },

  getPaymentById(id) {
    return api.get(`/payments/${id}`);
  },

  getFailedPayments(filters = {}) {
    return api.get('/failed-payments', { params: filters });
  }
};
