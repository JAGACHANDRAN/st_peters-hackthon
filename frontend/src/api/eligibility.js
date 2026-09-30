import apiClient from './client';

export const eligibilityApi = {
  check: async (requested_amount, tenure_months, scheme_id = null) => {
    const payload = { requested_amount, tenure_months };
    if (scheme_id) {
      payload.scheme_id = scheme_id;
    }
    const res = await apiClient.post('/eligibility/check', payload);
    return res.data;
  },
  getHistory: async () => {
    const res = await apiClient.get('/eligibility/history');
    return res.data;
  },
};
