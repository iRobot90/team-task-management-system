// Sample API Responses for TTMS Testing
// This file contains mock data that matches the expected API structure

export const sampleUsers = [
  {
    id: 1,
    email: "admin@ttms.com",
    username: "admin",
    first_name: "Admin",
    last_name: "User",
    role: "admin",
    role_display: "Administrator",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    email: "manager@ttms.com",
    username: "manager",
    first_name: "John",
    last_name: "Manager",
    role: "manager",
    role_display: "Manager",
    is_active: true,
    created_at: "2024-01-02T00:00:00Z"
  },
  {
    id: 3,
    email: "member1@ttms.com",
    username: "member1",
    first_name: "Alice",
    last_name: "Johnson",
    role: "member",
    role_display: "Team Member",
    is_active: true,
    created_at: "2024-01-03T00:00:00Z"
  },
  {
    id: 4,
    email: "member2@ttms.com",
    username: "member2",
    first_name: "Bob",
    last_name: "Smith",
    role: "member",
    role_display: "Team Member",
    is_active: true,
    created_at: "2024-01-04T00:00:00Z"
  },
  {
    id: 5,
    email: "member3@ttms.com",
    username: "member3",
    first_name: "Carol",
    last_name: "Williams",
    role: "member",
    role_display: "Team Member",
    is_active: true,
    created_at: "2024-01-05T00:00:00Z"
  }
];

export const sampleTasks = [
  {
    id: 1,
    title: "Design new landing page",
    description: "Create a modern, responsive landing page design that improves user engagement and conversion rates. Include hero section, features, testimonials, and call-to-action.",
    status: "done",
    deadline: "2024-12-10T23:59:59Z",
    assignee: 3,
    assignee_detail: sampleUsers[2],
    created_by: 2,
    created_by_detail: sampleUsers[1],
    created_at: "2024-12-01T09:00:00Z",
    updated_at: "2024-12-08T14:30:00Z",
    priority: "high",
    tags: ["design", "frontend", "urgent"]
  },
  {
    id: 2,
    title: "Implement user authentication",
    description: "Add JWT-based authentication system with login, logout, and token refresh functionality. Include password reset and email verification.",
    status: "in_progress",
    deadline: "2024-12-15T23:59:59Z",
    assignee: 4,
    assignee_detail: sampleUsers[3],
    created_by: 2,
    created_by_detail: sampleUsers[1],
    created_at: "2024-12-02T10:30:00Z",
    updated_at: "2024-12-10T16:45:00Z",
    priority: "high",
    tags: ["backend", "security", "authentication"]
  },
  {
    id: 3,
    title: "Write API documentation",
    description: "Create comprehensive API documentation using Swagger/OpenAPI. Include all endpoints, request/response schemas, and authentication examples.",
    status: "todo",
    deadline: "2024-12-20T23:59:59Z",
    assignee: 5,
    assignee_detail: sampleUsers[4],
    created_by: 2,
    created_by_detail: sampleUsers[1],
    created_at: "2024-12-03T11:15:00Z",
    updated_at: "2024-12-03T11:15:00Z",
    priority: "medium",
    tags: ["documentation", "api"]
  },
  {
    id: 4,
    title: "Optimize database queries",
    description: "Review and optimize slow database queries. Add proper indexing and implement query caching for better performance.",
    status: "in_progress",
    deadline: "2024-12-12T23:59:59Z",
    assignee: 4,
    assignee_detail: sampleUsers[3],
    created_by: 1,
    created_by_detail: sampleUsers[0],
    created_at: "2024-12-04T13:00:00Z",
    updated_at: "2024-12-09T09:20:00Z",
    priority: "medium",
    tags: ["backend", "performance", "database"]
  },
  {
    id: 5,
    title: "Setup CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing, building, and deployment. Include staging and production environments.",
    status: "todo",
    deadline: "2024-12-18T23:59:59Z",
    assignee: null,
    assignee_detail: null,
    created_by: 1,
    created_by_detail: sampleUsers[0],
    created_at: "2024-12-05T14:30:00Z",
    updated_at: "2024-12-05T14:30:00Z",
    priority: "low",
    tags: ["devops", "automation"]
  },
  {
    id: 6,
    title: "User testing and feedback",
    description: "Conduct user testing sessions and gather feedback on the new features. Create a report with actionable insights.",
    status: "todo",
    deadline: "2024-12-08T23:59:59Z",
    assignee: 3,
    assignee_detail: sampleUsers[2],
    created_by: 2,
    created_by_detail: sampleUsers[1],
    created_at: "2024-12-06T15:45:00Z",
    updated_at: "2024-12-06T15:45:00Z",
    priority: "high",
    tags: ["testing", "ux", "research"]
  },
  {
    id: 7,
    title: "Mobile app development",
    description: "Develop React Native mobile application for iOS and Android platforms. Include core features and offline support.",
    status: "todo",
    deadline: "2025-01-15T23:59:59Z",
    assignee: null,
    assignee_detail: null,
    created_by: 1,
    created_by_detail: sampleUsers[0],
    created_at: "2024-12-07T16:00:00Z",
    updated_at: "2024-12-07T16:00:00Z",
    priority: "low",
    tags: ["mobile", "react-native"]
  },
  {
    id: 8,
    title: "Security audit",
    description: "Perform comprehensive security audit of the application. Check for vulnerabilities and implement security best practices.",
    status: "done",
    deadline: "2024-12-05T23:59:59Z",
    assignee: 4,
    assignee_detail: sampleUsers[3],
    created_by: 1,
    created_by_detail: sampleUsers[0],
    created_at: "2024-12-01T08:00:00Z",
    updated_at: "2024-12-05T17:30:00Z",
    priority: "high",
    tags: ["security", "audit"]
  }
];

export const sampleComments = [
  {
    id: 1,
    task: 1,
    author: 2,
    author_detail: sampleUsers[1],
    content: "Great work on the landing page design! The color scheme and layout look professional.",
    created_at: "2024-12-08T14:30:00Z",
    updated_at: "2024-12-08T14:30:00Z"
  },
  {
    id: 2,
    task: 1,
    author: 3,
    author_detail: sampleUsers[2],
    content: "Thanks! I've incorporated the feedback from the user testing session. The conversion rate should improve significantly.",
    created_at: "2024-12-08T15:45:00Z",
    updated_at: "2024-12-08T15:45:00Z"
  },
  {
    id: 3,
    task: 2,
    author: 4,
    author_detail: sampleUsers[3],
    content: "I've implemented the JWT authentication and added refresh token logic. Working on the password reset feature now.",
    created_at: "2024-12-10T16:45:00Z",
    updated_at: "2024-12-10T16:45:00Z"
  }
];

export const sampleNotifications = [
  {
    id: 1,
    type: "task_assigned",
    message: "You have been assigned to the task 'Design new landing page'",
    task: 1,
    task_title: "Design new landing page",
    recipient: 3,
    created_at: "2024-12-01T09:00:00Z",
    read: false
  },
  {
    id: 2,
    type: "task_completed",
    message: "Task 'Security audit' has been completed",
    task: 8,
    task_title: "Security audit",
    recipient: 2,
    created_at: "2024-12-05T17:30:00Z",
    read: true
  },
  {
    id: 3,
    type: "task_overdue",
    message: "Task 'User testing and feedback' is overdue",
    task: 6,
    task_title: "User testing and feedback",
    recipient: 2,
    created_at: "2024-12-09T00:00:00Z",
    read: false
  },
  {
    id: 4,
    type: "task_updated",
    message: "Task 'Implement user authentication' status changed to in_progress",
    task: 2,
    task_title: "Implement user authentication",
    recipient: 2,
    created_at: "2024-12-10T16:45:00Z",
    read: false
  }
];

export const sampleStatistics = {
  total: 8,
  todo: 3,
  in_progress: 2,
  done: 2,
  overdue: 1,
  my_total: 3,
  my_todo: 1,
  my_in_progress: 1,
  my_done: 1,
  completion_rate: 25,
  avg_completion_time: 5.2,
  tasks_per_member: 2.4
};

// API Response Templates
export const apiResponseTemplates = {
  // Tasks API
  tasksList: {
    count: 8,
    next: null,
    previous: null,
    results: sampleTasks
  },
  
  taskDetail: (taskId) => sampleTasks.find(task => task.id === taskId),
  
  createTask: {
    id: 9,
    title: "New task title",
    description: "New task description",
    status: "todo",
    deadline: "2024-12-25T23:59:59Z",
    assignee: 3,
    assignee_detail: sampleUsers[2],
    created_by: 2,
    created_by_detail: sampleUsers[1],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    priority: "medium",
    tags: []
  },
  
  updateTask: (taskId, updates) => ({
    ...sampleTasks.find(task => task.id === taskId),
    ...updates,
    updated_at: new Date().toISOString()
  }),
  
  // Users API
  usersList: {
    count: 5,
    next: null,
    previous: null,
    results: sampleUsers
  },
  
  userDetail: (userId) => sampleUsers.find(user => user.id === userId),
  
  // Comments API
  commentsList: (taskId) => sampleComments.filter(comment => comment.task === taskId),
  
  createComment: {
    id: 4,
    task: 1,
    author: 2,
    author_detail: sampleUsers[1],
    content: "New comment",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // Notifications API
  notificationsList: {
    count: 4,
    next: null,
    previous: null,
    results: sampleNotifications
  },
  
  // Statistics API
  statistics: sampleStatistics
};

// Helper functions for testing
export const mockApiCalls = {
  // Simulate API delay
  delay: (ms = 500) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Simulate API response
  simulateResponse: async (data, shouldFail = false, delay = 500) => {
    await mockApiCalls.delay(delay);
    if (shouldFail) {
      throw new Error('API request failed');
    }
    return data;
  },
  
  // Generate random task
  generateRandomTask: (userId = null) => ({
    id: Math.floor(Math.random() * 1000) + 100,
    title: `Random Task ${Math.floor(Math.random() * 100)}`,
    description: `This is a randomly generated task for testing purposes.`,
    status: ['todo', 'in_progress', 'done'][Math.floor(Math.random() * 3)],
    deadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: userId || (Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null),
    created_by: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    tags: ['testing', 'random']
  }),
  
  // Generate random notification
  generateRandomNotification: (userId) => ({
    id: Math.floor(Math.random() * 1000) + 100,
    type: ['task_assigned', 'task_completed', 'task_overdue', 'task_updated'][Math.floor(Math.random() * 4)],
    message: `Random notification for user ${userId}`,
    task: Math.floor(Math.random() * 8) + 1,
    recipient: userId,
    created_at: new Date().toISOString(),
    read: Math.random() > 0.5
  })
};

export default {
  sampleUsers,
  sampleTasks,
  sampleComments,
  sampleNotifications,
  sampleStatistics,
  apiResponseTemplates,
  mockApiCalls
};
