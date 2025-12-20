// Enhanced team metrics utilities for TTMS
import { TASK_STATUS, USER_ROLES } from './constants';

// Helper function to get user display name
export const getUserDisplayName = (user) => {
  if (!user) return 'Unknown';
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.username || user.email || 'Unknown';
};

// Helper function to get status color
export const getStatusColor = (status) => {
  switch (status) {
    case TASK_STATUS.DONE:
      return '#10b981';
    case TASK_STATUS.IN_PROGRESS:
      return '#f59e0b';
    case TASK_STATUS.TODO:
      return '#6b7280';
    default:
      return '#6b7280';
  }
};

// Compute comprehensive team metrics
export const computeTeamMetrics = (tasks = [], users = []) => {
  // Initialize metrics
  const metrics = {
    total: tasks.length,
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
    completion_rate: 0,
    avg_completion_time: 0,
    tasks_per_member: 0,
    active_members: 0,
    member_stats: {},
    unassigned_stats: {
      total: 0,
      todo: 0,
      in_progress: 0,
      done: 0
    },
    distribution: {
      todo: 0,
      in_progress: 0,
      done: 0
    }
  };

  // Process tasks
  const now = new Date();
  tasks.forEach(task => {
    // Status counts
    switch (task.status) {
      case TASK_STATUS.TODO:
        metrics.todo++;
        break;
      case TASK_STATUS.IN_PROGRESS:
        metrics.in_progress++;
        break;
      case TASK_STATUS.DONE:
        metrics.done++;
        break;
      default:
        break;
    }

    // Overdue tasks
    if (task.deadline && new Date(task.deadline) < now && task.status !== TASK_STATUS.DONE) {
      metrics.overdue++;
    }

    // Member stats
    if (task.assignee) {
      if (!metrics.member_stats[task.assignee]) {
        metrics.member_stats[task.assignee] = {
          total: 0,
          todo: 0,
          in_progress: 0,
          done: 0,
          overdue: 0
        };
      }
      metrics.member_stats[task.assignee].total++;
      metrics.member_stats[task.assignee][task.status]++;
    } else {
      metrics.unassigned_stats.total++;
      metrics.unassigned_stats[task.status]++;
    }
  });

  // Calculate derived metrics
  metrics.completion_rate = metrics.total > 0 ? (metrics.done / metrics.total) * 100 : 0;
  metrics.tasks_per_member = users.length > 0 ? metrics.total / users.length : 0;
  metrics.active_members = Object.keys(metrics.member_stats).length;

  // Update distribution
  metrics.distribution.todo = metrics.todo;
  metrics.distribution.in_progress = metrics.in_progress;
  metrics.distribution.done = metrics.done;

  return metrics;
};

// Compute top performer
export const computeTopPerformer = (perUser = {}) => {
  if (!perUser || Object.keys(perUser).length === 0) {
    return null;
  }

  // Find top performer by completion rate
  let topPerformer = null;
  let bestScore = 0;

  Object.entries(perUser).forEach(([userId, metrics]) => {
    const completionRate = metrics.completed > 0 ? (metrics.completed / metrics.total) * 100 : 0;

    if (metrics.total > 0 && completionRate > bestScore) {
      bestScore = completionRate;
      topPerformer = {
        user: metrics.user,
        total_tasks: metrics.total,
        completed_tasks: metrics.completed,
        completion_rate: completionRate
      };
    }
  });

  return topPerformer;
};

// Filter tasks based on status and assignee
export const filterTasks = (tasks = [], statusFilter = 'all', assigneeFilter = 'all', currentUserId = null) => {
  let filtered = [...tasks];

  // Apply status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(task => task.status === statusFilter);
  }

  // Apply assignee filter
  if (assigneeFilter === 'mine') {
    filtered = filtered.filter(task => task.assignee === currentUserId);
  } else if (assigneeFilter === 'unassigned') {
    filtered = filtered.filter(task => !task.assignee);
  } else if (assigneeFilter === 'assigned') {
    filtered = filtered.filter(task => task.assignee);
  }

  return filtered;
};

// Validate task data
export const validateTask = (task) => {
  const errors = {};

  if (!task.title || task.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters long';
  }

  if (task.title && task.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }

  if (task.description && task.description.length > 2000) {
    errors.description = 'Description must be less than 2000 characters';
  }

  if (task.deadline && new Date(task.deadline) <= new Date()) {
    errors.deadline = 'Deadline must be in the future';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Check if user can perform actions on a task
export const canUserPerformAction = (user, task, action) => {
  if (!user || !task) return false;

  const isAdmin = user.role === USER_ROLES.ADMIN;
  const isManager = user.role === USER_ROLES.MANAGER;
  const isAssignee = task.assignee === user.id;
  const isCreator = task.created_by === user.id;

  switch (action) {
    case 'view':
      return true; // Everyone can view tasks

    case 'create':
      return isAdmin || isManager; // Only admins and managers can create tasks

    case 'edit':
      return isAdmin || isManager || isAssignee; // Admins, managers, and assignees can edit

    case 'delete':
      return isAdmin || isCreator; // Only admins and creators can delete

    case 'assign':
      return isAdmin || isManager; // Only admins and managers can assign tasks

    case 'update_status':
      return isAdmin || isManager || isAssignee; // Admins, managers, and assignees can update status

    case 'comment':
      return isAdmin || isManager || isAssignee || isCreator; // Admins, managers, assignees, and creators can comment

    default:
      return false;
  }
};
