import apiClient from './client';

export const profileApi = {
  getProfile: async () => {
    const res = await apiClient.get('/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await apiClient.put('/profile', data);
    return res.data;
  },
};
