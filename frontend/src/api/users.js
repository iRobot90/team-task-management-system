import api from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export const usersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.USERS, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.USERS}${id}/`);
    return response.data;
  },

  create: async (userData) => {
    const response = await api.post(API_ENDPOINTS.USERS, userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`${API_ENDPOINTS.USERS}${id}/`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.USERS}${id}/`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get(API_ENDPOINTS.USER_PROFILE);
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put(API_ENDPOINTS.UPDATE_PROFILE, userData);
    return response.data;
  },

  changeRole: async (userId, roleId) => {
    const response = await api.post(`${API_ENDPOINTS.USERS}${userId}/change_role/`, {
      role_id: roleId,
    });
    return response.data;
  },
};

