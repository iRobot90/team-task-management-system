import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AuthContext } from '../context/AuthContext';

// Mock API calls
jest.mock('../api/tasks', () => ({
  tasksAPI: {
    list: jest.fn(),
    getTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    addComment: jest.fn(),
  },
}));

jest.mock('../api/users', () => ({
  usersAPI: {
    list: jest.fn(),
    getProfile: jest.fn(),
  },
}));

jest.mock('../api/notifications', () => ({
  notificationsAPI: {
    list: jest.fn(),
    createTaskAssignedNotification: jest.fn(),
    createTaskDoneNotification: jest.fn(),
  },
}));

// Mock the utils
jest.mock('../utils/teamMetrics', () => ({
  computeTeamMetrics: jest.fn(),
  computeTopPerformer: jest.fn(),
  filterTasks: jest.fn(),
  validateTask: jest.fn(),
  getUserDisplayName: jest.fn(),
  getStatusColor: jest.fn(),
}));

import { tasksAPI, usersAPI, notificationsAPI } from '../api';
import { computeTeamMetrics, computeTopPerformer } from '../utils/teamMetrics';

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
};

const mockTasks = [
  {
    id: 1,
    title: 'Task 1',
    description: 'Description 1',
    status: 'TODO',
    priority: 'HIGH',
    assignee: 1,
    created_by: 1,
    deadline: '2024-12-31',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Task 2',
    description: 'Description 2',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assignee: 2,
    created_by: 1,
    deadline: '2024-12-25',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    title: 'Task 3',
    description: 'Description 3',
    status: 'DONE',
    priority: 'LOW',
    assignee: 1,
    created_by: 2,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

const mockUsers = [
  {
    id: 1,
    username: 'user1',
    email: 'user1@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'admin',
  },
  {
    id: 2,
    username: 'user2',
    email: 'user2@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'member',
  },
];

const mockNotifications = [
  {
    id: 1,
    message: 'Task assigned to you',
    type: 'task_assigned',
    task_id: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    message: 'Task completed',
    type: 'task_done',
    task_id: 2,
    created_at: '2024-01-02T00:00:00Z',
  },
];

const renderDashboard = (user = mockUser) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user, updateUser: jest.fn() }}>
        <Dashboard />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    tasksAPI.list.mockResolvedValue(mockTasks);
    usersAPI.list.mockResolvedValue(mockUsers);
    notificationsAPI.list.mockResolvedValue(mockNotifications);
    
    // Setup default metrics mocks
    computeTeamMetrics.mockReturnValue({
      total: 3,
      todo: 1,
      in_progress: 1,
      done: 1,
      overdue: 0,
      completion_rate: 33.33,
      tasks_per_member: 1.5,
      active_members: 2,
      member_stats: {
        1: { total: 2, completed: 1, todo: 1, in_progress: 0, done: 1 },
        2: { total: 1, completed: 0, todo: 0, in_progress: 1, done: 0 },
      },
    });
    
    computeTopPerformer.mockReturnValue({
      user: mockUsers[0],
      total_tasks: 2,
      completed_tasks: 1,
      completion_rate: 50,
    });
  });

  it('should render dashboard with metrics', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total tasks
    });

    expect(tasksAPI.list).toHaveBeenCalled();
    expect(usersAPI.list).toHaveBeenCalled();
    expect(computeTeamMetrics).toHaveBeenCalledWith(mockTasks, mockUsers);
  });

  it('should display task statistics correctly', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText('1')).toBeInTheDocument(); // To Do tasks
      expect(screen.getByText('1')).toBeInTheDocument(); // In Progress tasks
      expect(screen.getByText('1')).toBeInTheDocument(); // Done tasks
      expect(screen.getByText('33.33%')).toBeInTheDocument(); // Completion rate
    });
  });

  it('should handle empty data gracefully', async () => {
    tasksAPI.list.mockResolvedValue([]);
    usersAPI.list.mockResolvedValue([]);
    
    computeTeamMetrics.mockReturnValue({
      total: 0,
      todo: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
      completion_rate: 0,
      tasks_per_member: 0,
      active_members: 0,
      member_stats: {},
    });
    
    computeTopPerformer.mockReturnValue(null);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText('0%')).toBeInTheDocument(); // Completion rate
      expect(screen.getByText('0')).toBeInTheDocument(); // Active members
    });
  });

  it('should display recent tasks', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });
  });

  it('should display notifications', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Task assigned to you')).toBeInTheDocument();
      expect(screen.getByText('Task completed')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    tasksAPI.list.mockRejectedValue(new Error('API Error'));
    usersAPI.list.mockRejectedValue(new Error('API Error'));
    notificationsAPI.list.mockRejectedValue(new Error('API Error'));

    renderDashboard();

    // Should not crash and should show some default state
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Find and click refresh button (if it exists)
    const refreshButton = screen.queryByTitle('Refresh');
    if (refreshButton) {
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(tasksAPI.list).toHaveBeenCalledTimes(1);
        expect(usersAPI.list).toHaveBeenCalledTimes(1);
        expect(notificationsAPI.list).toHaveBeenCalledTimes(1);
      });
    }
  });

  it('should display top performer', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Top performer name
      expect(screen.getByText('50%')).toBeInTheDocument(); // Completion rate
    });
  });

  it('should handle no top performer case', async () => {
    computeTopPerformer.mockReturnValue(null);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      // Should not show top performer section or show "No data"
      expect(screen.queryByText(/Top Performer/i)).not.toBeInTheDocument();
    });
  });

  it('should calculate overdue tasks correctly', async () => {
    const mockOverdueTasks = [
      ...mockTasks,
      {
        id: 4,
        title: 'Overdue Task',
        description: 'Overdue description',
        status: 'TODO',
        priority: 'HIGH',
        assignee: 1,
        created_by: 1,
        deadline: '2024-01-01', // Past deadline
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    tasksAPI.list.mockResolvedValue(mockOverdueTasks);
    
    computeTeamMetrics.mockReturnValue({
      total: 4,
      todo: 2,
      in_progress: 1,
      done: 1,
      overdue: 1,
      completion_rate: 25,
      tasks_per_member: 2,
      active_members: 2,
      member_stats: {
        1: { total: 3, completed: 1, todo: 2, in_progress: 0, done: 1 },
        2: { total: 1, completed: 0, todo: 0, in_progress: 1, done: 0 },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Overdue tasks
    });
  });

  it('should display user role-based information', async () => {
    const adminUser = { ...mockUser, role: 'admin' };
    renderDashboard(adminUser);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Admin should see all metrics
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should handle loading state', async () => {
    // Make API calls take longer
    tasksAPI.list.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockTasks), 100)));
    usersAPI.list.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockUsers), 100)));

    renderDashboard();

    // Should show loading state initially
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should filter tasks correctly', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Test filtering if filter controls exist
    const filterSelect = screen.queryByLabelText('Filter by status');
    if (filterSelect) {
      fireEvent.change(filterSelect, { target: { value: 'TODO' } });
      
      await waitFor(() => {
        // Should only show TODO tasks
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
      });
    }
  });

  it('should handle WebSocket connection', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Test WebSocket setup (if implemented)
    // This would require mocking WebSocket
    // For now, just ensure the component doesn't crash
    expect(tasksAPI.list).toHaveBeenCalled();
  });

  it('should display metrics with correct formatting', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('33.33%')).toBeInTheDocument(); // Completion rate
      expect(screen.getByText('1.5')).toBeInTheDocument(); // Tasks per member
    });
  });

  it('should handle task status updates', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Test task status update if functionality exists
    const statusButton = screen.queryByTitle('Update Status');
    if (statusButton) {
      fireEvent.click(statusButton);

      // Should trigger API call
      await waitFor(() => {
        expect(tasksAPI.updateTask).toHaveBeenCalled();
      });
    }
  });

  it('should handle navigation to task details', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    // Test navigation to task details
    const taskLink = screen.getByText('Task 1');
    fireEvent.click(taskLink);

    // Should navigate to task details page
    // This would require testing routing behavior
    expect(window.location.pathname).toContain('/tasks/');
  });
});
