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

  const now = new Date();
  let totalCompletionTime = 0;
  let completedTasksCount = 0;
  const memberTaskCounts = {};
  const memberCompletionTimes = {};

  // Initialize member stats
  users.forEach(user => {
    memberTaskCounts[user.id] = 0;
    memberCompletionTimes[user.id] = [];
    metrics.member_stats[user.id] = {
      user,
      total: 0,
      todo: 0,
      in_progress: 0,
      done: 0,
      completion_rate: 0,
      avg_completion_time: 0,
      is_active: false
    };
  });

  // Process tasks
  tasks.forEach(task => {
    // Count by status
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
    }

    // Count overdue tasks
    if (task.deadline && task.status !== TASK_STATUS.DONE) {
      const deadline = new Date(task.deadline);
      if (deadline < now) {
        metrics.overdue++;
      }
    }

    // Calculate completion times
    if (task.status === TASK_STATUS.DONE && task.created_at) {
      const created = new Date(task.created_at);
      const completed = task.updated_at ? new Date(task.updated_at) : now;
      const completionTime = (completed - created) / (1000 * 60 * 60 * 24); // in days
      
      totalCompletionTime += completionTime;
      completedTasksCount++;

      if (task.assignee) {
        memberCompletionTimes[task.assignee] = memberCompletionTimes[task.assignee] || [];
        memberCompletionTimes[task.assignee].push(completionTime);
      }
    }

    // Track unassigned tasks
    if (!task.assignee) {
      metrics.unassigned_stats.total++;
      switch (task.status) {
        case TASK_STATUS.TODO:
          metrics.unassigned_stats.todo++;
          break;
        case TASK_STATUS.IN_PROGRESS:
          metrics.unassigned_stats.in_progress++;
          break;
        case TASK_STATUS.DONE:
          metrics.unassigned_stats.done++;
          break;
      }
    } else {
      // Track assigned tasks
      memberTaskCounts[task.assignee] = (memberTaskCounts[task.assignee] || 0) + 1;
      
      if (metrics.member_stats[task.assignee]) {
        metrics.member_stats[task.assignee].total++;
        
        switch (task.status) {
          case TASK_STATUS.TODO:
            metrics.member_stats[task.assignee].todo++;
            break;
          case TASK_STATUS.IN_PROGRESS:
            metrics.member_stats[task.assignee].in_progress++;
            break;
          case TASK_STATUS.DONE:
            metrics.member_stats[task.assignee].done++;
            break;
        }

        metrics.member_stats[task.assignee].is_active = true;
      }
    }
  });

  // Calculate derived metrics
  metrics.completion_rate = metrics.total > 0 ? (metrics.done / metrics.total) * 100 : 0;
  metrics.avg_completion_time = completedTasksCount > 0 ? totalCompletionTime / completedTasksCount : 0;
  metrics.tasks_per_member = users.length > 0 ? metrics.total / users.length : 0;

  // Count active members (members with at least one task)
  metrics.active_members = Object.values(metrics.member_stats).filter(stat => stat.is_active).length;

  // Calculate member-specific metrics
  Object.keys(metrics.member_stats).forEach(userId => {
    const stat = metrics.member_stats[userId];
    stat.completion_rate = stat.total > 0 ? (stat.done / stat.total) * 100 : 0;
    
    const completionTimes = memberCompletionTimes[userId];
    if (completionTimes && completionTimes.length > 0) {
      stat.avg_completion_time = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    }
  });

  // Update distribution
  metrics.distribution.todo = metrics.todo;
  metrics.distribution.in_progress = metrics.in_progress;
  metrics.distribution.done = metrics.done;

  return metrics;
};

// Compute top performer (NEVER returns "Unassigned")
export const computeTopPerformer = (tasks = [], users = []) => {
  if (!tasks.length || !users.length) {
    return null;
  }

  // Calculate metrics for each user
  const userMetrics = {};
  
  users.forEach(user => {
    userMetrics[user.id] = {
      user,
      total_tasks: 0,
      completed_tasks: 0,
      completion_rate: 0,
      avg_completion_time: 0,
      completion_times: []
    };
  });

  // Process tasks to calculate user metrics
  tasks.forEach(task => {
    // Only consider assigned tasks for top performer calculation
    if (task.assignee && userMetrics[task.assignee]) {
      const metrics = userMetrics[task.assignee];
      metrics.total_tasks++;
      
      if (task.status === TASK_STATUS.DONE) {
        metrics.completed_tasks++;
        
        // Calculate completion time
        if (task.created_at) {
          const created = new Date(task.created_at);
          const completed = task.updated_at ? new Date(task.updated_at) : new Date();
          const completionTime = (completed - created) / (1000 * 60 * 60 * 24); // in days
          metrics.completion_times.push(completionTime);
        }
      }
    }
  });

  // Calculate completion rates and average times
  Object.keys(userMetrics).forEach(userId => {
    const metrics = userMetrics[userId];
    metrics.completion_rate = metrics.total_tasks > 0 ? (metrics.completed_tasks / metrics.total_tasks) * 100 : 0;
    
    if (metrics.completion_times.length > 0) {
      metrics.avg_completion_time = metrics.completion_times.reduce((sum, time) => sum + time, 0) / metrics.completion_times.length;
    }
  });

  // Find top performer based on completion rate, then by completed tasks count
  let topPerformer = null;
  let bestScore = -1;

  Object.values(userMetrics).forEach(metrics => {
    // Only consider users with at least one completed task
    if (metrics.completed_tasks > 0) {
      // Score is weighted by completion rate (70%) and number of completed tasks (30%)
      const score = (metrics.completion_rate * 0.7) + (metrics.completed_tasks * 0.3);
      
      if (score > bestScore) {
        bestScore = score;
        topPerformer = metrics;
      }
    }
  });

  // If no one has completed any tasks, find the user with the most tasks assigned
  if (!topPerformer) {
    Object.values(userMetrics).forEach(metrics => {
      if (metrics.total_tasks > 0 && metrics.total_tasks > bestScore) {
        bestScore = metrics.total_tasks;
        topPerformer = metrics;
      }
    });
  }

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

// Get task statistics for a specific user
export const getUserTaskStats = (tasks = [], userId) => {
  const userTasks = tasks.filter(task => task.assignee === userId);
  
  return {
    total: userTasks.length,
    todo: userTasks.filter(task => task.status === TASK_STATUS.TODO).length,
    in_progress: userTasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS).length,
    done: userTasks.filter(task => task.status === TASK_STATUS.DONE).length,
    overdue: userTasks.filter(task => {
      if (task.status === TASK_STATUS.DONE) return false;
      if (!task.deadline) return false;
      return new Date(task.deadline) < new Date();
    }).length,
    completion_rate: userTasks.length > 0 
      ? (userTasks.filter(task => task.status === TASK_STATUS.DONE).length / userTasks.length) * 100 
      : 0
  };
};

// Check if user can perform actions on a task
export const canUserPerformAction = (user, task, action) => {
  if (!user || !task) return false;

  const isAdmin = user.role === USER_ROLES.ADMIN;
  const isManager = user.role === USER_ROLES.MANAGER;
  const isMember = user.role === USER_ROLES.MEMBER;
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
      return isAdmin || isManager; // Only admins and managers can delete
    
    case 'assign':
      return isAdmin || isManager; // Only admins and managers can assign/unassign
    
    case 'update_status':
      return isAdmin || isManager || isAssignee; // Admins, managers, and assignees can update status
    
    case 'comment':
      return isAdmin || isManager || isAssignee; // Admins, managers, and assignees can comment
    
    default:
      return false;
  }
};

// Format date for display
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

// Get relative time for display
export const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateString);
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

// Calculate task priority score for sorting
export const getTaskPriorityScore = (task) => {
  let score = 0;
  
  // Overdue tasks get highest priority
  if (task.deadline && task.status !== TASK_STATUS.DONE) {
    const daysUntilDeadline = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysUntilDeadline < 0) score += 100; // Overdue
    else if (daysUntilDeadline <= 1) score += 50; // Due today or tomorrow
    else if (daysUntilDeadline <= 3) score += 25; // Due soon
  }
  
  // Status priority
  switch (task.status) {
    case TASK_STATUS.IN_PROGRESS:
      score += 20;
      break;
    case TASK_STATUS.TODO:
      score += 10;
      break;
  }
  
  return score;
};

// Utility to get role-based permissions
export const getRolePermissions = (role) => {
  const permissions = {
    [USER_ROLES.ADMIN]: {
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canAssignTasks: true,
      canViewAllTasks: true,
      canManageUsers: true,
      canViewAnalytics: true
    },
    [USER_ROLES.MANAGER]: {
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canAssignTasks: true,
      canViewAllTasks: true,
      canManageUsers: false,
      canViewAnalytics: true
    },
    [USER_ROLES.MEMBER]: {
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canAssignTasks: false,
      canViewAllTasks: false,
      canManageUsers: false,
      canViewAnalytics: false
    }
  };

  return permissions[role] || permissions[USER_ROLES.MEMBER];
};

// Utility to format completion time
export const formatCompletionTime = (days) => {
  if (days < 1) {
    return 'Same day';
  } else if (days < 7) {
    return `${days} days`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
};


