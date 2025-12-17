import api from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export const tasksAPI = {
  getAll: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.TASKS, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.TASKS}${id}/`);
    return response.data;
  },

  create: async (taskData) => {
    const response = await api.post(API_ENDPOINTS.TASKS, taskData);
    return response.data;
  },

  update: async (id, taskData) => {
    const response = await api.patch(`${API_ENDPOINTS.TASKS}${id}/`, taskData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.TASKS}${id}/`);
    return response.data;
  },

  getMyTasks: async () => {
    const response = await api.get(API_ENDPOINTS.MY_TASKS);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get(API_ENDPOINTS.TASK_STATISTICS);
    return response.data;
  },

  assign: async (taskId, assigneeId) => {
    const response = await api.post(`${API_ENDPOINTS.TASKS}${taskId}/assign/`, {
      assignee_id: assigneeId,
    });
    return response.data;
  },

  unassign: async (taskId) => {
    const response = await api.post(`${API_ENDPOINTS.TASKS}${taskId}/unassign/`);
    return response.data;
  },

  addComment: async (taskId, contentOrObject) => {
    const payload = typeof contentOrObject === 'string' 
      ? { content: contentOrObject }
      : contentOrObject;
    const response = await api.post(`${API_ENDPOINTS.TASKS}${taskId}/comments/`, payload);
    return response.data;
  },

  listComments: async (taskId) => {
    const response = await api.get(`${API_ENDPOINTS.TASKS}${taskId}/comments/`);
    return response.data;
  },
};

