import apiClient from './client';

export const budgetApi = {
  getLatest: async () => {
    const res = await apiClient.get('/budget');
    return res.data;
  },
  save: async (data) => {
    const res = await apiClient.post('/budget', data);
    return res.data;
  },
  calculate: async (income, expenses) => {
    const res = await apiClient.post('/budget/calculate', { income, expenses });
    return res.data;
  },
};
