import axiosClient from './axiosClient';

export const appointmentApi = {
  getAppointments: async (params = {}) => {
    const response = await axiosClient.get('/appointments/', { params });
    return response.data;
  },

  getAppointmentsByDate: async (date) => {
    const response = await axiosClient.get('/appointments/', { params: { date } });
    return response.data;
  },

  getAppointmentsByMember: async (memberId) => {
    const response = await axiosClient.get('/appointments/', { params: { member_id: memberId } });
    return response.data;
  },

  createAppointment: async (data) => {
    const response = await axiosClient.post('/appointments/', data);
    return response.data;
  },

  markCompleted: async (id, notes = '') => {
    const response = await axiosClient.post(`/appointments/${id}/mark_completed/`, { visit_notes: notes });
    return response.data;
  },

  markRevisit: async (id, revisitDate, notes = '') => {
    const response = await axiosClient.post(`/appointments/${id}/mark_revisit/`, {
      revisit_date: revisitDate,
      visit_notes: notes,
    });
    return response.data;
  },
};
