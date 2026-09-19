import axiosClient from './axiosClient';

export const paymentApi = {
  // Process simulated demo payment & auto-confirm appointment + token
  demoCheckout: async (payload) => {
    const response = await axiosClient.post('/payments/demo-checkout/', payload);
    return response.data;
  },

  // Fetch payment records
  getPayments: async (params = {}) => {
    const response = await axiosClient.get('/payments/', { params });
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await axiosClient.get(`/payments/${id}/`);
    return response.data;
  },
};

export default paymentApi;
