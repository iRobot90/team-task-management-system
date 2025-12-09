import api from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export const authAPI = {
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post(API_ENDPOINTS.LOGOUT, {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post(API_ENDPOINTS.REFRESH, {
      refresh: refreshToken,
    });
    return response.data;
  },
};

