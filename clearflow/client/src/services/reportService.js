import api from './api';

export const reportService = {
  getPaymentsReport(filters = {}, format = 'json') {
    if (format === 'csv') {
      const query = new URLSearchParams({ ...filters, format: 'csv' }).toString();
      window.open(`/api/reports/payments?${query}`, '_blank');
      return;
    }
    return api.get('/reports/payments', { params: { ...filters, format } });
  },

  getRecoveryReport(filters = {}, format = 'json') {
    if (format === 'csv') {
      const query = new URLSearchParams({ ...filters, format: 'csv' }).toString();
      window.open(`/api/reports/recovery?${query}`, '_blank');
      return;
    }
    return api.get('/reports/recovery', { params: { ...filters, format } });
  },

  getMerchantsReport(filters = {}, format = 'json') {
    if (format === 'csv') {
      const query = new URLSearchParams({ ...filters, format: 'csv' }).toString();
      window.open(`/api/reports/merchants?${query}`, '_blank');
      return;
    }
    return api.get('/reports/merchants', { params: { ...filters, format } });
  }
};
