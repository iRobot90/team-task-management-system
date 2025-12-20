import api from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export const projectsAPI = {
    getAll: async (params = {}) => {
        const response = await api.get(API_ENDPOINTS.PROJECTS, { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`${API_ENDPOINTS.PROJECTS}${id}/`);
        return response.data;
    },

    create: async (projectData) => {
        const response = await api.post(API_ENDPOINTS.PROJECTS, projectData);
        return response.data;
    },

    update: async (id, projectData) => {
        const response = await api.patch(`${API_ENDPOINTS.PROJECTS}${id}/`, projectData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`${API_ENDPOINTS.PROJECTS}${id}/`);
        return response.data;
    },
};
