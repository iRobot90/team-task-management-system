// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register/',
  LOGIN: '/auth/login/',
  LOGOUT: '/auth/logout/',
  REFRESH: '/auth/refresh/',

  // Users
  USERS: '/users/',
  USER_PROFILE: '/users/profile/',
  UPDATE_PROFILE: '/users/update_profile/',

  // Tasks
  TASKS: '/tasks/',
  MY_TASKS: '/tasks/my_tasks/',
  TASK_STATISTICS: '/tasks/statistics/',
  NOTIFICATIONS: '/notifications/',
  PROJECTS: '/projects/',

  // Roles
  ROLES: '/roles/',
};

// Task Status Options (aligned with backend Task.STATUS_CHOICES)
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.TODO]: 'To Do',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.DONE]: 'Done',
};

// User Roles (mirror backend enums)
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.MEMBER]: 'Member',
};

