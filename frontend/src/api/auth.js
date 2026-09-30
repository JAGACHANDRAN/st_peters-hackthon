import apiClient from './client';

export const authApi = {
  register: async (data) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  login: async (identifier, password) => {
    const res = await apiClient.post('/auth/login', { identifier, password });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};
