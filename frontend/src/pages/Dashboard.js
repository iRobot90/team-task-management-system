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
  Star,
  Briefcase,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import { tasksAPI, usersAPI, notificationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import { computeTeamMetrics, computeTopPerformer, getStatusColor, getUserDisplayName } from '../utils/teamMetrics';
import { TASK_STATUS, TASK_STATUS_LABELS } from '../utils/constants';
import { storage } from '../utils/storage';
import './Dashboard.css';
import './Dashboard-calendar.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTasks, setRecentTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  
  // Filter state
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
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

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is authenticated
      const token = storage.getToken();
      if (!token) {
        setError('Please log in to access the dashboard');
        return;
      }
      
      // Fetch tasks and users data in parallel
      const [tasksData, usersData] = await Promise.all([
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
      const allUsers = usersData.results || usersData || [];
      
      console.log('Dashboard data loaded:', {
        allTasks: allTasks,
        allUsers: allUsers,
        tasksCount: allTasks.length,
        usersCount: allUsers.length,
        isManager,
        isMember
      });
      
      setTasks(allTasks);
      setUsers(allUsers);
      
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
  }, [user, isManager, isMember]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const data = await notificationsAPI.list();
      console.log('Notifications API response:', data);
      
      const notificationsArray = Array.isArray(data) ? data : (data.results || []);
      console.log('Processed notifications array:', notificationsArray);
      
      setNotifications(notificationsArray.slice(0, 5));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Calculate metrics with robust fallbacks
  const calculateMetrics = useCallback(() => {
    if (!tasks.length || !users.length) {
      return {
        totalTasks: 0,
        statusCounts: {
          [TASK_STATUS.TODO]: 0,
          [TASK_STATUS.IN_PROGRESS]: 0,
          [TASK_STATUS.DONE]: 0
        },
        completionRate: 0,
        tasksPerMember: 0,
        activeMembers: users.length || 0,
        overdueTasks: 0,
        perUser: {}
      };
    }

    try {
      const metrics = computeTeamMetrics(tasks, users);
      console.log('Computed metrics:', metrics);
      return metrics;
    } catch (err) {
      console.error('Error computing metrics:', err);
      return {
        totalTasks: tasks.length,
        statusCounts: {
          [TASK_STATUS.TODO]: tasks.filter(t => t.status === TASK_STATUS.TODO).length,
          [TASK_STATUS.IN_PROGRESS]: tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
          [TASK_STATUS.DONE]: tasks.filter(t => t.status === TASK_STATUS.DONE).length
        },
        completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === TASK_STATUS.DONE).length / tasks.length) * 100 : 0,
        tasksPerMember: users.length > 0 ? tasks.length / users.length : 0,
        activeMembers: users.length,
        overdueTasks: overdueTasks.length,
        perUser: {}
      };
    }
  }, [tasks, users, overdueTasks]);

  const metrics = calculateMetrics();
  const topPerformer = metrics && Object.keys(metrics.perUser || {}).length > 0 ? computeTopPerformer(metrics.perUser) : null;
  
  // Debug metrics calculation
  console.log('Dashboard metrics debug:', {
    tasksLength: tasks.length,
    usersLength: users.length,
    isManager,
    isMember,
    metrics: metrics,
    topPerformer: topPerformer,
    statusCounts: metrics?.statusCounts,
    completionRate: metrics?.completionRate,
    tasksPerMember: metrics?.tasksPerMember,
    perUser: metrics?.perUser
  });

  // Filter functions
  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  const applyFilters = (taskList) => {
    return taskList.filter(task => {
      const statusMatch = filterStatus === 'all' || task.status === filterStatus;
      const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
      return statusMatch && priorityMatch;
    });
  };

  const filteredTasks = applyFilters(tasks);
  const filteredRecentTasks = applyFilters(recentTasks);
  
  // Calculate filtered stats for member dashboard
  const filteredStats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === TASK_STATUS.TODO).length,
    inProgress: filteredTasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
    done: filteredTasks.filter(t => t.status === TASK_STATUS.DONE).length
  };

  // Download function
  const handleDownload = () => {
    const csvContent = [
      ['Title', 'Status', 'Priority', 'Assignee', 'Deadline'],
      ...filteredTasks.map(task => [
        task.title,
        TASK_STATUS_LABELS[task.status] || task.status,
        task.priority,
        getUserDisplayName(users.find(u => u.id === task.assignee) || { email: 'Unassigned' }),
        task.deadline || 'No deadline'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setSuccess('Tasks downloaded successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Calendar function
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

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
            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn btn-outline modern" onClick={toggleCalendar} title="Calendar View">
                <Calendar size={16} />
              </button>
              <button className="btn btn-outline modern" onClick={handleFilter} title="Filter Tasks">
                <Filter size={16} />
              </button>
              <button className="btn btn-outline modern" onClick={handleDownload} title="Download Tasks">
                <Download size={16} />
              </button>
              <button className="btn btn-outline modern" onClick={handleRefresh} disabled={refreshing} title="Refresh">
                <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              </button>
            </div>
            
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

      {/* Error State */}
      {error && (
        <div className="dashboard-error">
          <AlertCircle size={48} />
          <h3>Unable to load dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}

      {/* Main Content */}
      {!error && (
        <div className="dashboard-content">
            <div className="stat-card-modern primary">
              <div className="stat-icon">
                <Briefcase size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{filteredStats.total}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
            </div>
            
            <div className="stat-card-modern todo">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{filteredStats.todo}</div>
                <div className="stat-label">To Do</div>
              </div>
            </div>
            
            <div className="stat-card-modern progress">
              <div className="stat-icon">
                <Activity size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{filteredStats.inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>
            
            <div className="stat-card-modern completed">
              <div className="stat-icon">
                <CheckCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{filteredStats.done}</div>
                <div className="stat-label">Completed</div>
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
                <h3>{users.length || 0}</h3>
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
                {filteredRecentTasks.length === 0 ? (
                  <div className="empty-state">
                    <p>No recent tasks{showFilters ? ' matching filters' : ''}</p>
                  </div>
                ) : (
                  filteredRecentTasks.map(task => (
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
                          <span className="task-date">
                            {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
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

      {/* Filter Modal */}
      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Filter size={20} /> Filter Tasks</h3>
              <button className="btn-close" onClick={() => setShowFilters(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-select">
                  <option value="all">All Status</option>
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="form-select">
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => {
                setFilterStatus('all');
                setFilterPriority('all');
              }}>
                Clear Filters
              </button>
              <button className="btn btn-primary" onClick={() => {
                // Filters are already applied in real-time, just close modal and show feedback
                setShowFilters(false);
                if (filterStatus !== 'all' || filterPriority !== 'all') {
                  setSuccess('Filters applied successfully!');
                  setTimeout(() => setSuccess(''), 2000);
                }
              }}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="modal-overlay" onClick={() => setShowCalendar(false)}>
          <div className="modal-content calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Calendar size={20} /> Calendar View</h3>
              <button className="btn-close" onClick={() => setShowCalendar(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="calendar-controls">
                <button className="btn btn-outline" onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}>
                  <ArrowUp size={16} className="rotate-90" />
                  Previous
                </button>
                <h4>{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                <button className="btn btn-outline" onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}>
                  Next
                  <ArrowDown size={16} className="rotate-90" />
                </button>
              </div>
              <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-day-header">{day}</div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i - selectedDate.getDay() + 1);
                  const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dayTasks = tasks.filter(task => {
                    const taskDate = new Date(task.deadline);
                    return taskDate.toDateString() === date.toDateString();
                  });
                  
                  return (
                    <div
                      key={i}
                      className={`calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
                      onClick={() => dayTasks.length > 0 && console.log('Tasks for', date.toDateString(), ':', dayTasks)}
                    >
                      <div className="calendar-day-content">
                        <span className="day-number">{date.getDate()}</span>
                        {dayTasks.length > 0 && (
                          <div className="task-indicators">
                            <div className="task-count">{dayTasks.length}</div>
                            <div className="task-dots">
                              {dayTasks.slice(0, 3).map((task, idx) => (
                                <div 
                                  key={idx} 
                                  className="task-dot" 
                                  style={{ backgroundColor: getStatusColor(task.status) }}
                                  title={task.title}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-dot today-dot"></div>
                  <span>Today</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot task-dot"></div>
                  <span>Has Tasks</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedDate(new Date())}>
                Go to Today
              </button>
              <button className="btn btn-primary" onClick={() => setShowCalendar(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="success-toast">
          <Star size={16} />
          {success}
        </div>
      )}

      </div>
  );
};

export default Dashboard;

