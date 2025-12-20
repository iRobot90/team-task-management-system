import { notificationsAPI } from '../api/notifications';
import api from '../api/axios';

// Mock axios for testing
jest.mock('../api/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../utils/constants', () => ({
  API_ENDPOINTS: {
    NOTIFICATIONS: '/api/notifications/'
  }
}));

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should fetch notifications list successfully', async () => {
      const mockNotifications = [
        { id: 1, message: 'Test notification 1', type: 'task_assigned' },
        { id: 2, message: 'Test notification 2', type: 'task_done' }
      ];

      api.get.mockResolvedValue({ data: mockNotifications });

      const result = await notificationsAPI.list();

      expect(api.get).toHaveBeenCalledWith('/api/notifications/');
      expect(result).toEqual(mockNotifications);
    });

    it('should handle notifications with results property', async () => {
      const mockNotifications = [
        { id: 1, message: 'Test notification', type: 'task_assigned' }
      ];

      api.get.mockResolvedValue({ data: { results: mockNotifications } });

      const result = await notificationsAPI.list();

      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array on error', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      const result = await notificationsAPI.list();

      expect(result).toEqual([]);
    });
  });

  describe('createTaskAssignedNotification', () => {
    it('should create task assigned notification successfully', async () => {
      const mockNotification = { id: 1, message: 'You have been assigned task "Test Task"' };

      api.post.mockResolvedValue({ data: mockNotification });

      const result = await notificationsAPI.createTaskAssignedNotification(1, 'Test Task', 123);

      expect(api.post).toHaveBeenCalledWith('/api/notifications/', {
        type: 'task_assigned',
        message: 'You have been assigned task "Test Task"',
        task_id: 1,
        recipient_id: 123
      });
      expect(result).toEqual(mockNotification);
    });

    it('should return null when no assignee ID provided', async () => {
      api.post.mockResolvedValue({ data: null });

      const result = await notificationsAPI.createTaskAssignedNotification(1, 'Test Task', null);

      expect(api.post).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      api.post.mockRejectedValue(new Error('API error'));

      const result = await notificationsAPI.createTaskAssignedNotification(1, 'Test Task', 123);

      expect(result).toBeNull();
    });
  });

  describe('createTaskDoneNotification', () => {
    it('should create task done notification successfully', async () => {
      const mockNotification = { id: 1, message: 'Task "Test Task" has been marked as done' };

      api.post.mockResolvedValue({ data: mockNotification });

      const result = await notificationsAPI.createTaskDoneNotification(1, 'Test Task', 123);

      expect(api.post).toHaveBeenCalledWith('/api/notifications/', {
        type: 'task_done',
        message: 'Task "Test Task" has been marked as done',
        task_id: 1,
        recipient_type: 'managers',
        exclude_user: 123
      });
      expect(result).toEqual(mockNotification);
    });

    it('should return null on error', async () => {
      api.post.mockRejectedValue(new Error('API error'));

      const result = await notificationsAPI.createTaskDoneNotification(1, 'Test Task', 123);

      expect(result).toBeNull();
    });
  });
});
