import axiosClient from './axiosClient';

export const authApi = {
  // Patient OTP flow
  sendOtp: async (mobileNumber) => {
    const response = await axiosClient.post('/auth/send-otp/', { mobile_number: mobileNumber });
    return response.data;
  },

  verifyOtp: async (mobileNumber, otp, username = '', name = '') => {
    const response = await axiosClient.post('/auth/verify-otp/', {
      mobile_number: mobileNumber,
      otp,
      username,
      name,
    });
    return response.data;
  },

  // Hospital Staff username+password flow
  loginWithPassword: async (username, password) => {
    const response = await axiosClient.post('/auth/token/', { username, password });
    return response.data; // { access, refresh }
  },

  // Fetch current user profile (both frontends)
  getMe: async () => {
    const response = await axiosClient.get('/auth/me/');
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await axiosClient.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },
};
