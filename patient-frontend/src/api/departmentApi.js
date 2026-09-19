import axiosClient from './axiosClient';

export const departmentApi = {
  getDepartments: async () => {
    const response = await axiosClient.get('/departments/');
    return response.data;
  },

  getDepartment: async (id) => {
    const response = await axiosClient.get(`/departments/${id}/`);
    return response.data;
  },

  createDepartment: async (data) => {
    const response = await axiosClient.post('/departments/', data);
    return response.data;
  },

  updateDepartment: async (id, data) => {
    const response = await axiosClient.patch(`/departments/${id}/`, data);
    return response.data;
  },

  deleteDepartment: async (id) => {
    await axiosClient.delete(`/departments/${id}/`);
  },
};
