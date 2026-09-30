import apiClient from './client';

export const advisorApi = {
  chat: async (message) => {
    const res = await apiClient.post('/advisor/chat', { message });
    return res.data;
  },
  getHistory: async () => {
    const res = await apiClient.get('/advisor/history');
    return res.data;
  },
};
