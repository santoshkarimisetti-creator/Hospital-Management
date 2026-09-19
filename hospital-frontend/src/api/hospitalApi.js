import axiosClient from './axiosClient';

export const hospitalApi = {
  getHospitals: async () => {
    const response = await axiosClient.get('/hospitals/');
    return response.data;
  },

  getHospital: async (id) => {
    const response = await axiosClient.get(`/hospitals/${id}/`);
    return response.data;
  },

  createHospital: async (data) => {
    const response = await axiosClient.post('/hospitals/', data);
    return response.data;
  },

  updateHospital: async (id, data) => {
    const response = await axiosClient.put(`/hospitals/${id}/`, data);
    return response.data;
  },

  deleteHospital: async (id) => {
    const response = await axiosClient.delete(`/hospitals/${id}/`);
    return response.data;
  },
};
