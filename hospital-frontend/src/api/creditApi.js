import axiosClient from './axiosClient';

export const creditApi = {
  getWallet: async () => {
    const response = await axiosClient.get('/credits/wallet/');
    return response.data;
  },
};

export default creditApi;
