// Test utilities for TTMS - Sample API responses and testing helpers

// Sample user data
export const sampleUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@company.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
    date_joined: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    username: 'manager1',
    email: 'manager1@company.com',
    first_name: 'Manager',
    last_name: 'One',
    role: 'manager',
    is_active: true,
    date_joined: '2024-01-15T00:00:00Z'
  },
  {
    id: 3,
    username: 'member1',
    email: 'member1@company.com',
    first_name: 'Team',
    last_name: 'Member',
    role: 'member',
    is_active: true,
    date_joined: '2024-02-01T00:00:00Z'
  },
  {
    id: 4,
    username: 'member2',
    email: 'member2@company.com',
    first_name: 'Another',
    last_name: 'Member',
    role: 'member',
    is_active: true,
    date_joined: '2024-02-15T00:00:00Z'
  }
];

// Sample task data
export const sampleTasks = [
  {
    id: 1,
    title: 'Design new landing page',
    description: 'Create a modern, responsive landing page design for the new product launch',
    status: 'in_progress',
    deadline: '2024-12-15T00:00:00Z',
    assignee: 3,
    created_by: 2,
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-05T14:30:00Z',
    assignee_detail: sampleUsers[2],
    created_by_detail: sampleUsers[1]
  },
  {
    id: 2,
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication system with refresh tokens',
    status: 'done',
    deadline: '2024-12-10T00:00:00Z',
    assignee: 3,
    created_by: 1,
    created_at: '2024-11-20T09:00:00Z',
    updated_at: '2024-12-08T16:45:00Z',
    assignee_detail: sampleUsers[2],
    created_by_detail: sampleUsers[0]
  },
  {
    id: 3,
    title: 'Write API documentation',
    description: 'Document all REST API endpoints with examples and error codes',
    status: 'todo',
    deadline: '2024-12-20T00:00:00Z',
    assignee: null,
    created_by: 2,
    created_at: '2024-12-03T11:00:00Z',
    updated_at: '2024-12-03T11:00:00Z',
    assignee_detail: null,
    created_by_detail: sampleUsers[1]
  },
  {
    id: 4,
    title: 'Fix mobile navigation bug',
    description: 'Navigation menu not closing properly on mobile devices',
    status: 'in_progress',
    deadline: '2024-12-08T00:00:00Z', // Overdue
    assignee: 4,
    created_by: 2,
    created_at: '2024-12-01T15:30:00Z',
    updated_at: '2024-12-04T10:15:00Z',
    assignee_detail: sampleUsers[3],
    created_by_detail: sampleUsers[1]
  },
  {
    id: 5,
    title: 'Database optimization',
    description: 'Optimize slow queries and add proper indexing',
    status: 'todo',
    deadline: '2024-12-25T00:00:00Z',
    assignee: 4,
    created_by: 1,
    created_at: '2024-12-02T13:00:00Z',
    updated_at: '2024-12-02T13:00:00Z',
    assignee_detail: sampleUsers[3],
    created_by_detail: sampleUsers[0]
  },
  {
    id: 6,
    title: 'Setup CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: 'done',
    deadline: '2024-12-05T00:00:00Z',
    assignee: 2,
    created_by: 1,
    created_at: '2024-11-25T08:00:00Z',
    updated_at: '2024-12-04T17:20:00Z',
    assignee_detail: sampleUsers[1],
    created_by_detail: sampleUsers[0]
  }
];

// Sample comments data
export const sampleComments = [
  {
    id: 1,
    content: 'I\'ve started working on the design mockups. Should have something ready for review by tomorrow.',
    task: 1,
    author: 3,
    created_at: '2024-12-05T09:30:00Z',
    author_detail: sampleUsers[2]
  },
  {
    id: 2,
    content: 'Great! Make sure to follow the brand guidelines we discussed.',
    task: 1,
    author: 2,
    created_at: '2024-12-05T10:15:00Z',
    author_detail: sampleUsers[1]
  },
  {
    id: 3,
    content: 'Authentication system is complete and tested. All endpoints are working correctly.',
    task: 2,
    author: 3,
    created_at: '2024-12-08T16:45:00Z',
    author_detail: sampleUsers[2]
  },
  {
    id: 4,
    content: 'This task is overdue. Can we get an update on the progress?',
    task: 4,
    author: 2,
    created_at: '2024-12-07T14:00:00Z',
    author_detail: sampleUsers[1]
  }
];

// Sample API responses
export const sampleAPIResponses = {
  // Users API responses
  getUsers: {
    success: {
      status: 200,
      data: {
        count: sampleUsers.length,
        results: sampleUsers
      }
    },
    error: {
      status: 401,
      data: {
        error: 'Authentication required',
        detail: 'Authentication credentials were not provided.'
      }
    }
  },

  // Tasks API responses
  getTasks: {
    success: {
      status: 200,
      data: {
        count: sampleTasks.length,
        results: sampleTasks
      }
    },
    error: {
      status: 403,
      data: {
        error: 'Permission denied',
        detail: 'You do not have permission to view these tasks.'
      }
    }
  },

  createTask: {
    success: {
      status: 201,
      data: sampleTasks[0]
    },
    error: {
      status: 400,
      data: {
        error: 'Validation failed',
        details: {
          title: ['This field is required.'],
          deadline: ['Deadline must be in the future.']
        }
      }
    }
  },

  updateTask: {
    success: {
      status: 200,
      data: {
        ...sampleTasks[0],
        status: 'done',
        updated_at: '2024-12-10T15:30:00Z'
      }
    },
    error: {
      status: 404,
      data: {
        error: 'Not found',
        detail: 'Task not found.'
      }
    }
  },

  deleteTask: {
    success: {
      status: 204,
      data: null
    },
    error: {
      status: 403,
      data: {
        error: 'Permission denied',
        detail: 'You do not have permission to delete this task.'
      }
    }
  },

  // Comments API responses
  getComments: {
    success: {
      status: 200,
      data: sampleComments.filter(c => c.task === 1)
    },
    error: {
      status: 404,
      data: {
        error: 'Not found',
        detail: 'Task not found.'
      }
    }
  },

  addComment: {
    success: {
      status: 201,
      data: sampleComments[0]
    },
    error: {
      status: 400,
      data: {
        error: 'Validation failed',
        details: {
          content: ['This field is required.']
        }
      }
    }
  },

  // Metrics API responses
  getMetrics: {
    success: {
      status: 200,
      data: {
        total_tasks: 6,
        completed_tasks: 2,
        in_progress_tasks: 2,
        todo_tasks: 2,
        overdue_tasks: 1,
        completion_rate: 33.3,
        avg_completion_time: 5.2,
        top_performer: {
          user: sampleUsers[2],
          completed_tasks: 1,
          total_tasks: 2,
          completion_rate: 50.0
        },
        team_performance: [
          {
            user: sampleUsers[2],
            total_tasks: 2,
            completed_tasks: 1,
            completion_rate: 50.0
          },
          {
            user: sampleUsers[3],
            total_tasks: 2,
            completed_tasks: 0,
            completion_rate: 0.0
          },
          {
            user: sampleUsers[1],
            total_tasks: 1,
            completed_tasks: 1,
            completion_rate: 100.0
          }
        ]
      }
    }
  }
};

// Mock API functions for testing
export const mockAPI = {
  // Simulate API delay
  delay: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock fetch with responses
  mockFetch: async (endpoint, options = {}) => {
    await mockAPI.delay(300); // Simulate network delay

    // Parse endpoint to determine response
    if (endpoint.includes('/tasks/') && endpoint.endsWith('/comments/')) {
      const taskId = parseInt(endpoint.split('/tasks/')[1].split('/')[0]);
      return {
        ok: true,
        status: 200,
        json: async () => sampleComments.filter(c => c.task === taskId)
      };
    }

    if (endpoint.includes('/tasks/') && options.method === 'POST') {
      const taskId = parseInt(endpoint.split('/tasks/')[1].split('/')[0]);
      return {
        ok: true,
        status: 201,
        json: async () => sampleComments[0]
      };
    }

    if (endpoint.includes('/tasks/') && options.method === 'DELETE') {
      return {
        ok: true,
        status: 204,
        json: async () => null
      };
    }

    if (endpoint.includes('/tasks/') && options.method === 'PATCH') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ ...sampleTasks[0], status: 'done' })
      };
    }

    if (endpoint === '/tasks/' && options.method === 'POST') {
      return {
        ok: true,
        status: 201,
        json: async () => sampleTasks[0]
      };
    }

    if (endpoint === '/tasks/') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          count: sampleTasks.length,
          results: sampleTasks
        })
      };
    }

    if (endpoint === '/users/') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          count: sampleUsers.length,
          results: sampleUsers
        })
      };
    }

    // Default error response
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    };
  }
};

// Test helper functions
export const testHelpers = {
  // Test if metrics calculation is working correctly
  testMetricsCalculation: (tasks, users) => {
    const { computeTeamMetrics, computeTopPerformer } = require('./teamMetrics');
    
    const metrics = computeTeamMetrics(tasks, users);
    const topPerformer = computeTopPerformer(tasks, users);

    return {
      metrics,
      topPerformer,
      assertions: {
        hasMetrics: !!metrics,
        correctTotal: metrics.total === tasks.length,
        hasTopPerformer: !!topPerformer,
        topPerformerIsNotUnassigned: topPerformer && topPerformer.user
      }
    };
  },

  // Test role-based permissions
  testPermissions: (user, task, action) => {
    const { canUserPerformAction } = require('./teamMetrics');
    
    return {
      user,
      task,
      action,
      canPerform: canUserPerformAction(user, task, action)
    };
  },

  // Test task filtering
  testFiltering: (tasks, filters) => {
    const { filterTasks } = require('./teamMetrics');
    
    const filtered = filterTasks(
      tasks, 
      filters.status || 'all', 
      filters.assignee || 'all', 
      filters.currentUserId || null
    );

    return {
      originalCount: tasks.length,
      filteredCount: filtered.length,
      filters,
      results: filtered
    };
  },

  // Test date formatting
  testDateFormatting: () => {
    const { formatDate, getRelativeTime } = require('./teamMetrics');
    
    const testDate = new Date('2024-12-01T10:00:00Z');
    const now = new Date();
    
    return {
      formatDate: formatDate(testDate),
      getRelativeTime: getRelativeTime(testDate),
      testDate: testDate.toISOString(),
      now: now.toISOString()
    };
  },

  // Generate test data
  generateTestData: (numTasks = 10, numUsers = 5) => {
    const statuses = ['todo', 'in_progress', 'done'];
    const roles = ['admin', 'manager', 'member'];
    
    const users = Array.from({ length: numUsers }, (_, i) => ({
      id: i + 1,
      username: `user${i + 1}`,
      email: `user${i + 1}@company.com`,
      first_name: `User`,
      last_name: `${i + 1}`,
      role: roles[i % roles.length],
      is_active: true,
      date_joined: new Date(2024, 0, i + 1).toISOString()
    }));

    const tasks = Array.from({ length: numTasks }, (_, i) => {
      const createdDate = new Date(2024, 11, i + 1);
      const deadline = new Date(createdDate);
      deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 30) + 1);
      
      return {
        id: i + 1,
        title: `Test Task ${i + 1}`,
        description: `Description for test task ${i + 1}`,
        status: statuses[i % statuses.length],
        deadline: deadline.toISOString(),
        assignee: Math.random() > 0.3 ? (Math.floor(Math.random() * numUsers) + 1) : null,
        created_by: Math.floor(Math.random() * numUsers) + 1,
        created_at: createdDate.toISOString(),
        updated_at: createdDate.toISOString()
      };
    });

    return { users, tasks };
  }
};

// Performance testing utilities
export const performanceTests = {
  // Test metrics calculation performance
  testMetricsPerformance: (iterations = 1000) => {
    const { computeTeamMetrics } = require('./teamMetrics');
    const { tasks, users } = testHelpers.generateTestData(100, 10);
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      computeTeamMetrics(tasks, users);
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / iterations;
    
    return {
      iterations,
      totalTime: endTime - startTime,
      avgTime: avgTime.toFixed(2),
      tasksCount: tasks.length,
      usersCount: users.length
    };
  },

  // Test filtering performance
  testFilteringPerformance: (iterations = 1000) => {
    const { filterTasks } = require('./teamMetrics');
    const { tasks } = testHelpers.generateTestData(1000, 20);
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      filterTasks(tasks, 'in_progress', 'assigned', 1);
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / iterations;
    
    return {
      iterations,
      totalTime: endTime - startTime,
      avgTime: avgTime.toFixed(2),
      tasksCount: tasks.length
    };
  }
};

// WebSocket test utilities
export const webSocketTests = {
  // Mock WebSocket for testing
  createMockWebSocket: () => {
    const listeners = {};
    
    return {
      addEventListener: (event, callback) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(callback);
      },
      
      removeEventListener: (event, callback) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter(cb => cb !== callback);
        }
      },
      
      send: (data) => {
        console.log('WebSocket send:', data);
      },
      
      close: () => {
        console.log('WebSocket closed');
      },
      
      // Test helper to simulate receiving messages
      simulateMessage: (data) => {
        if (listeners.message) {
          listeners.message.forEach(callback => {
            callback({ data: typeof data === 'string' ? data : JSON.stringify(data) });
          });
        }
      },
      
      // Test helper to simulate connection
      simulateOpen: () => {
        if (listeners.open) {
          listeners.open.forEach(callback => callback());
        }
      },
      
      // Test helper to simulate errors
      simulateError: (error) => {
        if (listeners.error) {
          listeners.error.forEach(callback => callback(error));
        }
      }
    };
  },

  // Test WebSocket message handling
  testWebSocketMessages: () => {
    const mockWS = webSocketTests.createMockWebSocket();
    const messages = [];
    
    mockWS.addEventListener('message', (event) => {
      messages.push(JSON.parse(event.data));
    });
    
    // Simulate different message types
    mockWS.simulateMessage({ type: 'task_created', task: sampleTasks[0] });
    mockWS.simulateMessage({ type: 'task_updated', task: { ...sampleTasks[0], status: 'done' } });
    mockWS.simulateMessage({ type: 'task_deleted', task_id: 1 });
    
    return {
      messages,
      count: messages.length,
      types: messages.map(m => m.type)
    };
  }
};

export default {
  sampleUsers,
  sampleTasks,
  sampleComments,
  sampleAPIResponses,
  mockAPI,
  testHelpers,
  performanceTests,
  webSocketTests
};
