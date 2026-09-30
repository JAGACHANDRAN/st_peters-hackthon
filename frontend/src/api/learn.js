import apiClient from './client';

export const learnApi = {
  explainTopic: async (topic) => {
    const res = await apiClient.post('/learn/explain', { topic });
    return res.data;
  },
};
