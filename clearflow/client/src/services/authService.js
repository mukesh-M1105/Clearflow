import api from './api';

export const authService = {
  async login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  async register(data) {
    return api.post('/auth/register', data);
  },

  async getMe() {
    return api.get('/auth/me');
  }
};
