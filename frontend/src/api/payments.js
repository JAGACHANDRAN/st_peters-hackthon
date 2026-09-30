import apiClient from './client';

export const paymentsApi = {
  initiate: async (data) => {
    const res = await apiClient.post('/payments/initiate', data);
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/payments/${id}`);
    return res.data;
  },
  list: async () => {
    const res = await apiClient.get('/payments');
    return res.data;
  },
};
