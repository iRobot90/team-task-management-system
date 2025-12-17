import { 
  canUserPerformAction, 
  computeTeamMetrics, 
  computeTopPerformer, 
  filterTasks, 
  validateTask,
  getUserDisplayName,
  getStatusColor 
} from '../utils/teamMetrics';
import { TASK_STATUS, USER_ROLES } from '../utils/constants';

describe('Team Metrics Utilities', () => {
  const mockTasks = [
    { id: 1, title: 'Task 1', status: TASK_STATUS.TODO, assignee: 1, created_by: 1, deadline: '2024-12-31' },
    { id: 2, title: 'Task 2', status: TASK_STATUS.IN_PROGRESS, assignee: 2, created_by: 1, deadline: '2024-12-25' },
    { id: 3, title: 'Task 3', status: TASK_STATUS.DONE, assignee: 1, created_by: 2, deadline: '2024-12-20' },
    { id: 4, title: 'Task 4', status: TASK_STATUS.TODO, assignee: null, created_by: 1 },
  ];

  const mockUsers = [
    { id: 1, username: 'user1', first_name: 'John', last_name: 'Doe' },
    { id: 2, username: 'user2', first_name: 'Jane', last_name: 'Smith' },
  ];

  describe('canUserPerformAction', () => {
    const adminUser = { id: 1, role: USER_ROLES.ADMIN };
    const managerUser = { id: 2, role: USER_ROLES.MANAGER };
    const memberUser = { id: 3, role: USER_ROLES.MEMBER };
    const mockTask = { id: 1, assignee: 3, created_by: 1 };

    it('should allow admin to perform any action', () => {
      expect(canUserPerformAction(adminUser, mockTask, 'delete')).toBe(true);
      expect(canUserPerformAction(adminUser, mockTask, 'assign')).toBe(true);
      expect(canUserPerformAction(adminUser, mockTask, 'edit')).toBe(true);
    });

    it('should allow manager to create, assign, edit tasks', () => {
      expect(canUserPerformAction(managerUser, mockTask, 'create')).toBe(true);
      expect(canUserPerformAction(managerUser, mockTask, 'assign')).toBe(true);
      expect(canUserPerformAction(managerUser, mockTask, 'edit')).toBe(true);
    });

    it('should allow member to view and comment on tasks', () => {
      expect(canUserPerformAction(memberUser, mockTask, 'view')).toBe(true);
      expect(canUserPerformAction(memberUser, mockTask, 'comment')).toBe(true);
    });

    it('should allow assignee to edit and update status', () => {
      expect(canUserPerformAction(memberUser, mockTask, 'edit')).toBe(true);
      expect(canUserPerformAction(memberUser, mockTask, 'update_status')).toBe(true);
    });

    it('should allow creator to delete and comment on tasks', () => {
      expect(canUserPerformAction(adminUser, mockTask, 'delete')).toBe(true);
      expect(canUserPerformAction(adminUser, mockTask, 'comment')).toBe(true);
    });

    it('should return false for invalid inputs', () => {
      expect(canUserPerformAction(null, mockTask, 'view')).toBe(false);
      expect(canUserPerformAction(adminUser, null, 'view')).toBe(false);
      expect(canUserPerformAction(adminUser, mockTask, 'invalid_action')).toBe(false);
    });
  });

  describe('computeTeamMetrics', () => {
    it('should calculate team metrics correctly', () => {
      const metrics = computeTeamMetrics(mockTasks, mockUsers);

      expect(metrics.total).toBe(4);
      expect(metrics.todo).toBe(2);
      expect(metrics.in_progress).toBe(1);
      expect(metrics.done).toBe(1);
      expect(metrics.completion_rate).toBe(25);
      expect(metrics.tasks_per_member).toBe(2);
      expect(metrics.active_members).toBe(2);
    });

    it('should handle empty arrays', () => {
      const metrics = computeTeamMetrics([], []);

      expect(metrics.total).toBe(0);
      expect(metrics.todo).toBe(0);
      expect(metrics.in_progress).toBe(0);
      expect(metrics.done).toBe(0);
      expect(metrics.completion_rate).toBe(0);
      expect(metrics.tasks_per_member).toBe(0);
      expect(metrics.active_members).toBe(0);
    });

    it('should calculate member stats correctly', () => {
      const metrics = computeTeamMetrics(mockTasks, mockUsers);

      expect(metrics.member_stats[1].total).toBe(2);
      expect(metrics.member_stats[1].todo).toBe(1);
      expect(metrics.member_stats[1].done).toBe(1);
      expect(metrics.member_stats[2].total).toBe(1);
      expect(metrics.member_stats[2].in_progress).toBe(1);
    });

    it('should calculate unassigned stats correctly', () => {
      const metrics = computeTeamMetrics(mockTasks, mockUsers);

      expect(metrics.unassigned_stats.total).toBe(1);
      expect(metrics.unassigned_stats.todo).toBe(1);
    });
  });

  describe('computeTopPerformer', () => {
    const perUser = {
      1: {
        user: mockUsers[0],
        total: 5,
        completed: 4,
        in_progress: 1,
        todo: 0
      },
      2: {
        user: mockUsers[1],
        total: 3,
        completed: 2,
        in_progress: 1,
        todo: 0
      }
    };

    it('should return top performer by completion rate', () => {
      const topPerformer = computeTopPerformer(perUser);

      expect(topPerformer.user).toBe(mockUsers[0]);
      expect(topPerformer.completion_rate).toBe(80);
    });

    it('should return null for empty input', () => {
      expect(computeTopPerformer({})).toBeNull();
      expect(computeTopPerformer(null)).toBeNull();
    });
  });

  describe('filterTasks', () => {
    it('should filter tasks by status', () => {
      const filtered = filterTasks(mockTasks, TASK_STATUS.TODO, 'all');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(task => task.status === TASK_STATUS.TODO)).toBe(true);
    });

    it('should filter tasks by assignee (mine)', () => {
      const filtered = filterTasks(mockTasks, 'all', 'mine', 1);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(task => task.assignee === 1)).toBe(true);
    });

    it('should filter tasks by assignee (unassigned)', () => {
      const filtered = filterTasks(mockTasks, 'all', 'unassigned');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].assignee).toBeNull();
    });

    it('should filter tasks by assignee (assigned)', () => {
      const filtered = filterTasks(mockTasks, 'all', 'assigned');
      expect(filtered).toHaveLength(3);
      expect(filtered.every(task => task.assignee)).toBe(true);
    });
  });

  describe('validateTask', () => {
    it('should validate valid task', () => {
      const validTask = {
        title: 'Valid Task Title',
        description: 'Valid description',
        deadline: '2025-12-31'
      };

      const result = validateTask(validTask);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject short title', () => {
      const invalidTask = {
        title: 'Hi',
        description: 'Valid description'
      };

      const result = validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Title must be at least 3 characters long');
    });

    it('should reject long title', () => {
      const invalidTask = {
        title: 'a'.repeat(201),
        description: 'Valid description'
      };

      const result = validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Title must be less than 200 characters');
    });

    it('should reject long description', () => {
      const invalidTask = {
        title: 'Valid Title',
        description: 'a'.repeat(2001)
      };

      const result = validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('Description must be less than 2000 characters');
    });

    it('should reject past deadline', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invalidTask = {
        title: 'Valid Title',
        deadline: pastDate.toISOString().split('T')[0]
      };

      const result = validateTask(invalidTask);
      expect(result.isValid).toBe(false);
      expect(result.errors.deadline).toBe('Deadline must be in the future');
    });
  });

  describe('getUserDisplayName', () => {
    it('should return full name when available', () => {
      const user = { first_name: 'John', last_name: 'Doe' };
      expect(getUserDisplayName(user)).toBe('John Doe');
    });

    it('should fallback to username', () => {
      const user = { username: 'johndoe' };
      expect(getUserDisplayName(user)).toBe('johndoe');
    });

    it('should fallback to email', () => {
      const user = { email: 'john@example.com' };
      expect(getUserDisplayName(user)).toBe('john@example.com');
    });

    it('should return Unknown for null/undefined', () => {
      expect(getUserDisplayName(null)).toBe('Unknown');
      expect(getUserDisplayName(undefined)).toBe('Unknown');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for each status', () => {
      expect(getStatusColor(TASK_STATUS.DONE)).toBe('#10b981');
      expect(getStatusColor(TASK_STATUS.IN_PROGRESS)).toBe('#f59e0b');
      expect(getStatusColor(TASK_STATUS.TODO)).toBe('#6b7280');
    });

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('#6b7280');
    });
  });
});
