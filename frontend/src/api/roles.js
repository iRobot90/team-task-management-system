import api from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export const rolesAPI = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.ROLES);
    return response.data;
  },
};

