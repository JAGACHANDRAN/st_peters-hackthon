import apiClient from './client';

export const goalsApi = {
  list: async () => {
    const res = await apiClient.get('/goals');
    return res.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/goals', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiClient.patch(`/goals/${id}`, data);
    return res.data;
  },
};
