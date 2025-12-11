import api from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export const notificationsAPI = {
  list: async () => {
    const response = await api.get(API_ENDPOINTS.NOTIFICATIONS);
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.post(`${API_ENDPOINTS.NOTIFICATIONS}mark_read/`, { id });
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.post(`${API_ENDPOINTS.NOTIFICATIONS}mark_all_read/`);
    return response.data;
  },
};

