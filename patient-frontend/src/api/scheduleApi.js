import axiosClient from './axiosClient';

export const scheduleApi = {
  getSchedules: async () => {
    const response = await axiosClient.get('/schedules/');
    return response.data;
  },

  createSchedule: async (data) => {
    const response = await axiosClient.post('/schedules/', data);
    return response.data;
  },

  getTodayCapacity: async (doctorId = null) => {
    const params = doctorId ? { doctor_id: doctorId } : {};
    const response = await axiosClient.get('/capacities/today_doctor_capacity/', { params });
    return response.data;
  },
};
