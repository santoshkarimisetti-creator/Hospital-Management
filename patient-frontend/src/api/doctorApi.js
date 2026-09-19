import axiosClient from './axiosClient';

export const doctorApi = {
  getDoctors: async (departmentId = null, hospitalId = null) => {
    const params = {};
    if (departmentId) params.department_id = departmentId;
    if (hospitalId) params.hospital_id = hospitalId;
    const response = await axiosClient.get('/doctors/', { params });
    return response.data;
  },

  getDoctor: async (id) => {
    const response = await axiosClient.get(`/doctors/${id}/`);
    return response.data;
  },

  createDoctor: async (data) => {
    const response = await axiosClient.post('/doctors/', data);
    return response.data;
  },

  updateDoctor: async (id, data) => {
    const response = await axiosClient.patch(`/doctors/${id}/`, data);
    return response.data;
  },

  deleteDoctor: async (id) => {
    await axiosClient.delete(`/doctors/${id}/`);
  },
};
