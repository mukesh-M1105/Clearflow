import api from './api';

export const aiService = {
  askAssistant(message, context = {}) {
    return api.post('/ai/assistant', { message, context });
  }
};
