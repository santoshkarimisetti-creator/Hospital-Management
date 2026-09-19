import axiosClient from './axiosClient';

export const staffApi = {
  getStaff: async () => {
    const response = await axiosClient.get('/staff/');
    return response.data;
  },

  createStaff: async (data) => {
    const response = await axiosClient.post('/staff/', data);
    return response.data;
  },

  updateStaff: async (id, data) => {
    const response = await axiosClient.put(`/staff/${id}/`, data);
    return response.data;
  },

  deleteStaff: async (id) => {
    const response = await axiosClient.delete(`/staff/${id}/`);
    return response.data;
  },
};
