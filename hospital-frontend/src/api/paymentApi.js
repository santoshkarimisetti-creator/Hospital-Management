import axiosClient from './axiosClient';

export const paymentApi = {
  demoCheckout: async (payload) => {
    const response = await axiosClient.post('/payments/demo-checkout/', payload);
    return response.data;
  },

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
