import axiosClient from './axiosClient';

export const leaveApi = {
  getLeaves: async (doctorId = null) => {
    const params = doctorId ? { doctor_id: doctorId } : {};
    const response = await axiosClient.get('/leaves/', { params });
    return response.data;
  },

  createLeave: async (data) => {
    const response = await axiosClient.post('/leaves/', data);
    return response.data;
  },

  deleteLeave: async (id) => {
    const response = await axiosClient.delete(`/leaves/${id}/`);
    return response.data;
  },

  checkAvailability: async (doctorId, dateStr) => {
    const response = await axiosClient.get('/leaves/check_availability/', {
      params: { doctor_id: doctorId, date: dateStr }
    });
    return response.data;
  }
};
