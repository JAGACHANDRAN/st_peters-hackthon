import apiClient from './client';

export const schemesApi = {
  list: async (params = {}) => {
    const res = await apiClient.get('/schemes', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/schemes/${id}`);
    return res.data;
  },
};
