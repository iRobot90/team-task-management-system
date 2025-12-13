import api from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export const notificationsAPI = {
  list: async () => {
    console.log('Fetching notifications list...');
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS);
      console.log('Notifications list response:', response.data);
      
      // Handle different response formats
      const notifications = response.data?.results || response.data || [];
      console.log('Processed notifications:', notifications);
      
      return Array.isArray(notifications) ? notifications : [];
    } catch (err) {
      console.error('Error fetching notifications list:', err);
      console.error('Notifications error details:', err.response?.data);
      return []; // Return empty array on error
    }
  },

  markRead: async (id) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.NOTIFICATIONS}mark_read/`, { id });
      return response.data;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  },

  markAllRead: async () => {
    try {
      const response = await api.post(`${API_ENDPOINTS.NOTIFICATIONS}mark_all_read/`);
      return response.data;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  },

  create: async (notificationData) => {
    try {
      console.log('Creating notification:', notificationData);
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS, notificationData);
      console.log('Notification created successfully:', response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to create notification:', err);
      console.error('Notification error details:', err.response?.data);
      throw err;
    }
  },

  createTaskDoneNotification: async (taskId, taskTitle, assigneeId) => {
    try {
      console.log('Creating task done notification:', { taskId, taskTitle, assigneeId });
      
      const notificationData = {
        type: 'task_done',
        message: `Task "${taskTitle}" has been marked as done`,
        task_id: taskId,
        recipient_type: 'managers',
        exclude_user: assigneeId
      };
      
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS, notificationData);
      console.log('Task done notification created:', response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to create task done notification:', err);
      console.error('Task done notification error details:', err.response?.data);
      // Don't throw error to avoid breaking the main flow
      return null;
    }
  },

  createTaskAssignedNotification: async (taskId, taskTitle, assigneeId) => {
    try {
      console.log('Creating task assigned notification:', { taskId, taskTitle, assigneeId });
      
      if (!assigneeId) {
        console.log('No assignee ID provided, skipping notification');
        return null;
      }
      
      const notificationData = {
        type: 'task_assigned',
        message: `You have been assigned task "${taskTitle}"`,
        task_id: taskId,
        recipient_id: assigneeId
      };
      
      console.log('Notification payload:', notificationData);
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS, notificationData);
      console.log('Task assigned notification created:', response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to create task assigned notification:', err);
      console.error('Task assigned notification error details:', err.response?.data);
      // Don't throw error to avoid breaking the main flow
      return null;
    }
  },
};

