import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Bell,
  Plus,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Star,
  Briefcase,
  UserCheck,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  X
} from 'lucide-react';
import { tasksAPI, usersAPI, notificationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import { computeTeamMetrics, computeTopPerformer, getStatusColor, getUserDisplayName } from '../utils/teamMetrics';
import { TASK_STATUS, TASK_STATUS_LABELS } from '../utils/constants';
import { storage } from '../utils/storage';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTasks, setRecentTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  
  // Task creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: TASK_STATUS.TODO,
    priority: 'medium',
    deadline: '',
    assignee: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const isManager = user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN;
  const isMember = user?.role === USER_ROLES.MEMBER;
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is authenticated
      const token = storage.getToken();
      if (!token) {
        setError('Please log in to access the dashboard');
        return;
      }
      
      // Fetch all data in parallel
      const [statsData, tasksData, usersData] = await Promise.all([
        tasksAPI.getStatistics().catch(err => {
          console.error('Failed to fetch statistics:', err);
          return { total: 0, todo: 0, in_progress: 0, done: 0 };
        }),
        tasksAPI.getAll().catch(err => {
          console.error('Failed to fetch tasks:', err);
          return [];
        }),
        isManager ? usersAPI.getAll().catch(err => {
          console.error('Failed to fetch users:', err);
          return [];
        }) : Promise.resolve([])
      ]);

      const allTasks = tasksData.results || tasksData || [];
      setStatistics(statsData);
      setTasks(allTasks);
      setUsers(usersData.results || usersData || []);
      
      // Process recent and overdue tasks
      const now = new Date();
      const userTasks = isMember ? allTasks.filter(task => task.assignee === user?.id) : allTasks;
      
      // Recent tasks (last 7 days)
      const recent = userTasks
        .filter(task => new Date(task.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      // Overdue tasks
      const overdue = userTasks
        .filter(task => task.deadline && new Date(task.deadline) < now && task.status !== TASK_STATUS.DONE)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);
      
      setRecentTasks(recent);
      setOverdueTasks(overdue);
      
      await fetchNotifications();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        storage.clearAll();
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationsAPI.list();
      setNotifications(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Calculate metrics
  const metrics = tasks.length > 0 && users.length > 0 ? computeTeamMetrics(tasks, users) : null;
  const topPerformer = metrics ? computeTopPerformer(metrics.perUser) : null;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Task creation functions
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    // Validate title length
    if (!formData.title.trim()) {
      setFormErrors({ title: 'Title is required' });
      return;
    }
    
    if (formData.title.trim().length < 3) {
      setFormErrors({ title: 'Title must be at least 3 characters long' });
      return;
    }

    try {
      setUpdatingId('create');
      setError('');
      
      // Check if user is authenticated
      const token = storage.getToken();
      if (!token) {
        setError('Please log in to create tasks');
        return;
      }
      
      const taskData = {
        ...formData,
        status: formData.status, // Use the status from TASK_STATUS constants
        assignee: formData.assignee || null,
        created_by: user?.id, // Add current user as creator
        creator: user // Add user object for display
      };
      
      console.log('Creating task with data:', taskData);
      const newTask = await tasksAPI.create(taskData);
      console.log('Task created successfully:', newTask);
      
      setTasks(prev => [newTask, ...prev]);
      setShowCreateModal(false);
      setSuccess('Task created successfully');
      setFormData({
        title: '',
        description: '',
        status: TASK_STATUS.TODO,
        priority: 'medium',
        deadline: '',
        assignee: ''
      });
      setFormErrors({});
      
      // Refresh dashboard data to show new task
      await fetchDashboardData();
    } catch (err) {
      console.error('Error creating task:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        storage.clearAll();
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.data) {
        // Handle validation errors from backend
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join(', ');
          setError(`Failed to create task: ${errorMessages}`);
        } else {
          setError(`Failed to create task: ${errorData}`);
        }
      } else {
        setError('Failed to create task. Please try again.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: TASK_STATUS.TODO,
      priority: 'medium',
      deadline: '',
      assignee: ''
    });
    setFormErrors({});
  };

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertCircle size={48} />
        <h3>Unable to load dashboard</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard enhanced">
      {/* Modern Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="welcome-section">
              <h1 className="dashboard-title">
                {isManager ? 'Manager Dashboard' : 'My Dashboard'}
                <button 
                  onClick={handleRefresh} 
                  className="refresh-btn"
                  disabled={refreshing}
                >
                  <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
                </button>
              </h1>
              <div className="user-info">
                <span className="welcome-text">Welcome back, <strong>{user?.first_name || user?.username || user?.email?.split('@')[0]}</strong></span>
                <div className="role-badge modern">
                  <Briefcase size={14} />
                  {user?.role_display || user?.role}
                </div>
              </div>
            </div>
          </div>
          <div className="header-right">
            {isManager && (
              <div className="quick-actions">
                <button className="btn btn-primary modern" onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} />
                  Create Task
                </button>
                <button className="btn btn-secondary modern" onClick={() => window.location.href = '/team-performance'}>
                  <BarChart3 size={16} />
                  Analytics
                </button>
              </div>
            )}
            {isMember && (
              <div className="quick-actions">
                <button className="btn btn-primary modern" onClick={() => window.location.href = '/tasks'}>
                  <Eye size={16} />
                  My Tasks
                </button>
                <button className="btn btn-secondary modern" onClick={() => window.location.href = '/my-performance'}>
                  <TrendingUp size={16} />
                  Performance
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Stats - Integrated into Header */}
      {isMember && (
        <div className="member-stats-modern">
          <div className="stats-grid-modern">
            <div className="stat-card-modern primary">
              <div className="stat-icon">
                <Briefcase size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{tasks?.length || 0}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
            </div>
            
            <div className="stat-card-modern todo">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{tasks?.filter(t => t.status === 'todo').length || 0}</div>
                <div className="stat-label">To Do</div>
              </div>
            </div>
            
            <div className="stat-card-modern progress">
              <div className="stat-icon">
                <Activity size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{tasks?.filter(t => t.status === 'in_progress').length || 0}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>
            
            <div className="stat-card-modern completed">
              <div className="stat-icon">
                <CheckCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{tasks?.filter(t => t.status === 'done').length || 0}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager Specific Features */}
      {isManager && (
        <>
          {/* Key Metrics Row */}
          <div className="metrics-row">
            <div className="metric-card primary">
              <div className="metric-icon">
                <Target size={24} />
              </div>
              <div className="metric-content">
                <h3>{metrics?.totalTasks || 0}</h3>
                <p>Total Tasks</p>
                <div className="metric-change positive">
                  +{metrics?.statusCounts?.[TASK_STATUS.DONE] || 0} completed
                </div>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-icon">
                <CheckCircle size={24} />
              </div>
              <div className="metric-content">
                <h3>{metrics?.completionRate || 0}%</h3>
                <p>Completion Rate</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${metrics?.completionRate || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="metric-card info">
              <div className="metric-icon">
                <Users size={24} />
              </div>
              <div className="metric-content">
                <h3>{metrics?.activeMembers || 0}</h3>
                <p>Active Members</p>
                <div className="metric-detail">
                  {metrics?.tasksPerMember || 0} avg tasks/member
                </div>
              </div>
            </div>

            <div className="metric-card warning">
              <div className="metric-icon">
                <AlertCircle size={24} />
              </div>
              <div className="metric-content">
                <h3>{overdueTasks.length}</h3>
                <p>Overdue Tasks</p>
                <div className="metric-change negative">
                  Needs attention
                </div>
              </div>
            </div>
          </div>

          {/* Top Performer and Team Overview */}
          <div className="team-overview">
            <div className="top-performer-card">
              <div className="card-header">
                <Award size={20} />
                <h3>Top Performer</h3>
              </div>
              {topPerformer ? (
                <div className="performer-details">
                  <div className="performer-avatar">
                    {getUserDisplayName(topPerformer?.user || {}).charAt(0).toUpperCase()}
                  </div>
                  <div className="performer-info">
                    <h4>{getUserDisplayName(topPerformer?.user || {})}</h4>
                    <p className="performer-role">{topPerformer?.user?.role || 'Unknown'}</p>
                    <div className="performer-stats">
                      <span className="stat">
                        <strong>{topPerformer?.completed_tasks || 0}</strong> completed
                      </span>
                      <span className="stat">
                        <strong>{Math.round(topPerformer?.completion_rate || 0)}%</strong> rate
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-performer">
                  <AlertCircle size={24} />
                  <p>No completed tasks yet</p>
                </div>
              )}
            </div>

            <div className="team-distribution">
              <div className="card-header">
                <PieChart size={20} />
                <h3>Task Distribution</h3>
              </div>
              <div className="distribution-grid">
                {Object.entries(metrics?.statusCounts || {}).map(([status, count]) => (
                  <div key={status} className="dist-item">
                    <div 
                      className="dist-color" 
                      style={{ backgroundColor: getStatusColor(status) }}
                    />
                    <div className="dist-info">
                      <span className="dist-count">{count}</span>
                      <span className="dist-label">{TASK_STATUS_LABELS[status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-section">
            <div className="recent-tasks">
              <div className="card-header">
                <Clock size={20} />
                <h3>Recent Tasks</h3>
                <button 
                  className="view-all-btn"
                  onClick={() => window.location.href = '/tasks'}
                >
                  View All
                </button>
              </div>
              <div className="task-list">
                {recentTasks.length === 0 ? (
                  <div className="empty-state">
                    <p>No recent tasks</p>
                  </div>
                ) : (
                  recentTasks.map(task => (
                    <div key={task.id} className="task-item">
                      <div className="task-status">
                        <div 
                          className="status-dot" 
                          style={{ backgroundColor: getStatusColor(task.status) }}
                        />
                      </div>
                      <div className="task-info">
                        <h4>{task.title}</h4>
                        <div className="task-meta">
                          <span className="task-assignee">
                            {task.assignee ? 
                              (users.find(u => u.id === task.assignee) ? 
                                getUserDisplayName(users.find(u => u.id === task.assignee)) : 
                                'Unknown User'
                              ) : 
                              'Unassigned'
                            }
                          </span>
                          <span className="task-time">
                            {task.created_at ? 
                              (new Date(task.created_at).toLocaleDateString() !== 'Invalid Date' ? 
                                new Date(task.created_at).toLocaleDateString() : 
                                'Recent'
                              ) : 
                              'Recent'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="task-priority">
                        <span className={`priority-badge ${task.priority || 'medium'}`}>
                          {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                        </span>
                      </div>
                      <div className="task-actions">
                        <button 
                          className="btn-icon"
                          onClick={() => window.location.href = `/tasks`}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="notifications-panel">
              <div className="card-header">
                <Bell size={20} />
                <h3>Notifications</h3>
                <button 
                  className="view-all-btn"
                  onClick={() => window.location.href = '/dashboard#notifications'}
                >
                  View All
                </button>
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-icon">
                        <Bell size={16} />
                      </div>
                      <div className="notification-content">
                        <p>{notification.message}</p>
                        <span className="notification-time">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Task Creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`form-input ${formErrors.title ? 'error' : ''}`}
                  placeholder="Enter task title"
                />
                {formErrors.title && <span className="error-message">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input"
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="form-select"
                  >
                    <option value={TASK_STATUS.TODO}>To Do</option>
                    <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                    <option value={TASK_STATUS.DONE}>Done</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="form-input"
                />
              </div>

              {isManager && (
                <div className="form-group">
                  <label htmlFor="assignee">Assignee</label>
                  <select
                    id="assignee"
                    value={formData.assignee}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
                    className="form-select"
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {getUserDisplayName(user)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updatingId === 'create'}
                >
                  {updatingId === 'create' ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
  );
};

export default Dashboard;

