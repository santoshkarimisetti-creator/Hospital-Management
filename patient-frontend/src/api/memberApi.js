import axiosClient from './axiosClient';

export const memberApi = {
  getMembers: async () => {
    const response = await axiosClient.get('/members/');
    return response.data;
  },

  createMember: async (data) => {
    const response = await axiosClient.post('/members/', data);
    return response.data;
  },

  updateMember: async (id, data) => {
    const response = await axiosClient.put(`/members/${id}/`, data);
    return response.data;
  },

  deleteMember: async (id) => {
    const response = await axiosClient.delete(`/members/${id}/`);
    return response.data;
  },
};
