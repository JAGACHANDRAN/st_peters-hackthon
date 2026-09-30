import apiClient from './client';

export const adminApi = {
  getSchemes: async () => {
    const res = await apiClient.get('/admin/schemes');
    return res.data;
  },
  createScheme: async (data) => {
    const res = await apiClient.post('/admin/schemes', data);
    return res.data;
  },
  updateScheme: async (id, data) => {
    const res = await apiClient.put(`/admin/schemes/${id}`, data);
    return res.data;
  },
  deleteScheme: async (id) => {
    const res = await apiClient.delete(`/admin/schemes/${id}`);
    return res.data;
  },
};
