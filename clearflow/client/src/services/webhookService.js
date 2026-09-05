import api from './api';

export const webhookService = {
  simulateWebhook(payload) {
    return api.post('/webhooks/simulate', payload);
  }
};
