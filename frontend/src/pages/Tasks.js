import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Filter, X, CheckCircle, AlertCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, usersAPI } from '../api';
import { TASK_STATUS, TASK_STATUS_LABELS, USER_ROLES } from '../utils/constants';
import { 
  computeTeamMetrics, 
  canUserPerformAction, 
  filterTasks,
  validateTask,
  getUserDisplayName 
} from '../utils/teamMetrics';
import { storage } from '../utils/storage';
import TaskCard from '../components/TaskCard';
import PerformanceAnalytics from '../components/PerformanceAnalytics';
import './Tasks.css';

const Tasks = () => {
  const { user } = useAuth();
  const wsRef = useRef(null);
  
  // State management
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  
  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Comments state
  const [commentsData, setCommentsData] = useState({});
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: TASK_STATUS.TODO,
    deadline: '',
    assignee: ''
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Role-based permissions
  const canCreateTasks = canUserPerformAction(user, null, 'create');
  const canViewAllTasks = canUserPerformAction(user, null, 'view');
  const canAssignTasks = canUserPerformAction(user, null, 'assign');
  const canViewAnalytics = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER;

  // Fetch data
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getAll();
      setTasks(response.results || response);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.results || response);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  // WebSocket setup for real-time updates
  const setupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Note: Replace with your actual WebSocket URL
    const wsUrl = `ws://localhost:8000/ws/tasks/`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'task_created':
          setTasks(prev => [data.task, ...prev]);
          setSuccess('New task created');
          break;
        case 'task_updated':
          setTasks(prev => prev.map(task => 
            task.id === data.task.id ? data.task : task
          ));
          break;
        case 'task_deleted':
          setTasks(prev => prev.filter(task => task.id !== data.task_id));
          setSuccess('Task deleted');
          break;
        case 'task_assigned':
          setTasks(prev => prev.map(task => 
            task.id === data.task_id ? { ...task, assignee: data.assignee } : task
          ));
          break;
        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    };
  }, []);

  useEffect(() => {
    fetchTasks();
    if (canViewAllTasks) {
      fetchUsers();
    }
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchTasks, fetchUsers, canViewAllTasks, setupWebSocket]);

  // Filter tasks using utility function
  const filteredTasks = filterTasks(tasks, statusFilter, assigneeFilter, user?.id).filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Calculate metrics for analytics
  const metrics = computeTeamMetrics(filteredTasks, users);

  // Form validation
  const validateFormData = () => {
    const validation = validateTask(formData);
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  // Task operations
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!validateFormData()) {
      return;
    }

    try {
      setUpdatingId('create');
      const taskData = {
        ...formData,
        assignee: formData.assignee || null
      };
      const newTask = await tasksAPI.create(taskData);
      setTasks(prev => [newTask, ...prev]);
      setShowCreateModal(false);
      setSuccess('Task created successfully');
      resetForm();
      setFormErrors({});
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!selectedTask || !validateFormData()) return;

    try {
      setUpdatingId(selectedTask.id);
      const taskData = {
        ...formData,
        assignee: formData.assignee || null
      };
      const updatedTask = await tasksAPI.update(selectedTask.id, taskData);
      setTasks(prev => prev.map(task => 
        task.id === selectedTask.id ? updatedTask : task
      ));
      setShowEditModal(false);
      setSuccess('Task updated successfully');
      resetForm();
      setFormErrors({});
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setShowDeleteConfirm(false);
      setSuccess('Task deleted successfully');
      setSelectedTask(null);
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Check if user can update status
    const task = tasks.find(t => t.id === taskId);
    if (!canUserPerformAction(user, task, 'update_status')) {
      setError('You do not have permission to update this task status');
      return;
    }

    try {
      setUpdatingId(taskId);
      setError('');
      
      // Check if user is authenticated
      const token = storage.getToken();
      if (!token) {
        setError('Please log in to update task status');
        return;
      }
      
      console.log('Updating task status:', { taskId, newStatus });
      const updatedTask = await tasksAPI.update(taskId, { status: newStatus });
      console.log('Task status updated successfully:', updatedTask);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      setSuccess('Task status updated');
    } catch (err) {
      console.error('Error updating task status:', err);
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
          setError(`Failed to update status: ${errorMessages}`);
        } else {
          setError(`Failed to update status: ${errorData}`);
        }
      } else {
        setError('Failed to update status. Please try again.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignTask = async (taskId, assigneeId) => {
    // Check if user can assign tasks
    if (!canAssignTasks) {
      setError('You do not have permission to assign tasks');
      return;
    }

    try {
      setUpdatingId(taskId);
      const updatedTask = await tasksAPI.update(taskId, { assignee: assigneeId || null });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      setSuccess('Task assigned successfully');
    } catch (err) {
      setError('Failed to assign task');
      console.error('Error assigning task:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Comments
  const handleToggleComments = async (taskId) => {
    const isOpen = commentsOpen[taskId];
    setCommentsOpen(prev => ({ ...prev, [taskId]: !isOpen }));

    if (!isOpen && !commentsData[taskId]) {
      try {
        const comments = await tasksAPI.listComments(taskId);
        setCommentsData(prev => ({ ...prev, [taskId]: comments }));
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    }
  };

  const handleAddComment = async (taskId) => {
    const content = commentDrafts[taskId];
    if (!content?.trim()) return;

    // Check if user can comment
    const task = tasks.find(t => t.id === taskId);
    if (!canUserPerformAction(user, task, 'comment')) {
      setError('You do not have permission to comment on this task');
      return;
    }

    try {
      const newComment = await tasksAPI.addComment(taskId, { content });
      setCommentsData(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), newComment]
      }));
      setCommentDrafts(prev => ({ ...prev, [taskId]: '' }));
      setSuccess('Comment added');
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };

  // Form helpers
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: TASK_STATUS.TODO,
      deadline: '',
      assignee: ''
    });
    setSelectedTask(null);
    setFormErrors({});
  };

  const openEditModal = (task) => {
    // Check if user can edit
    if (!canUserPerformAction(user, task, 'edit')) {
      setError('You do not have permission to edit this task');
      return;
    }

    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      assignee: task.assignee?.id || ''
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (task) => {
    // Check if user can delete
    if (!canUserPerformAction(user, task, 'delete')) {
      setError('You do not have permission to delete this task');
      return;
    }

    setSelectedTask(task);
    setShowDeleteConfirm(true);
  };

  // Clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="tasks-header">
        <div className="header-content">
          <div>
            <h1>{canViewAllTasks ? 'My Team Tasks' : 'My Tasks'}</h1>
            <p className="header-subtitle">
              {canViewAllTasks 
                ? 'Manage and monitor team tasks' 
                : 'View and update your assigned tasks'
              }
            </p>
          </div>
          
          <div className="header-actions">
            {canViewAnalytics && (
              <button
                className="btn btn-secondary"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                <TrendingUp size={18} />
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
            )}
            
            {canCreateTasks && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Create Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && canViewAnalytics && (
        <div className="analytics-panel">
          <PerformanceAnalytics 
            tasks={filteredTasks} 
            users={users}
            isLoading={loading}
          />
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <div className="search-input">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value={TASK_STATUS.TODO}>To Do</option>
              <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={TASK_STATUS.DONE}>Done</option>
            </select>
          </div>

          {canViewAllTasks && (
            <div className="filter-group">
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Assignees</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-stats">
            <span className="stat-item">
              <CheckCircle size={16} />
              {filteredTasks.filter(t => t.status === TASK_STATUS.DONE).length} done
            </span>
            <span className="stat-item">
              <Clock size={16} />
              {filteredTasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length} in progress
            </span>
            <span className="stat-item">
              <AlertCircle size={16} />
              {filteredTasks.filter(t => t.status === TASK_STATUS.TODO).length} to do
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tasks Grid */}
      <div className="tasks-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No tasks found</h3>
            <p>
              {searchQuery || statusFilter !== 'all' || assigneeFilter !== 'all'
                ? 'No tasks match your current filters.'
                : canCreateTasks
                ? 'Create your first task to get started.'
                : 'No tasks have been assigned to you yet.'
              }
            </p>
            {canCreateTasks && !searchQuery && statusFilter === 'all' && assigneeFilter === 'all' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={user?.id}
                isManagerOrAdmin={canViewAllTasks}
                onStatusChange={handleStatusChange}
                onEdit={openEditModal}
                onDelete={openDeleteConfirm}
                onAssign={handleAssignTask}
                onComment={handleToggleComments}
                comments={commentsData[task.id] || []}
                commentsOpen={commentsOpen[task.id]}
                commentDrafts={commentDrafts}
                setCommentDrafts={setCommentDrafts}
                onAddComment={handleAddComment}
                updatingId={updatingId}
                users={users}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <Modal
          title="Create Task"
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
            setFormErrors({});
          }}
        >
          <form onSubmit={handleCreateTask} className="task-form">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                required
                minLength={3}
                className={formErrors.title ? 'error' : ''}
              />
              {formErrors.title && <span className="error-text">{formErrors.title}</span>}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={4}
                className={formErrors.description ? 'error' : ''}
              />
              {formErrors.description && <span className="error-text">{formErrors.description}</span>}
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                {Object.values(TASK_STATUS).map(status => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className={formErrors.deadline ? 'error' : ''}
              />
              {formErrors.deadline && <span className="error-text">{formErrors.deadline}</span>}
            </div>

            {canAssignTasks && (
              <div className="form-group">
                <label>Assign To</label>
                <select
                  value={formData.assignee}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
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

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                  setFormErrors({});
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
        </Modal>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <Modal
          title="Edit Task"
          onClose={() => {
            setShowEditModal(false);
            resetForm();
            setFormErrors({});
          }}
        >
          <form onSubmit={handleUpdateTask} className="task-form">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                required
                minLength={3}
                className={formErrors.title ? 'error' : ''}
              />
              {formErrors.title && <span className="error-text">{formErrors.title}</span>}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={4}
                className={formErrors.description ? 'error' : ''}
              />
              {formErrors.description && <span className="error-text">{formErrors.description}</span>}
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                {Object.values(TASK_STATUS).map(status => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className={formErrors.deadline ? 'error' : ''}
              />
              {formErrors.deadline && <span className="error-text">{formErrors.deadline}</span>}
            </div>

            {canAssignTasks && (
              <div className="form-group">
                <label>Assign To</label>
                <select
                  value={formData.assignee}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
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

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                  setFormErrors({});
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updatingId === selectedTask.id}
              >
                {updatingId === selectedTask.id ? 'Updating...' : 'Update Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedTask && (
        <Modal
          title="Delete Task"
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedTask(null);
          }}
        >
          <div className="delete-confirm">
            <p>Are you sure you want to delete this task?</p>
            <div className="task-preview">
              <h4>{selectedTask.title}</h4>
              {selectedTask.description && (
                <p>{selectedTask.description.substring(0, 100)}...</p>
              )}
            </div>
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedTask(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteTask(selectedTask.id)}
                disabled={updatingId === selectedTask.id}
              >
                {updatingId === selectedTask.id ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ title, children, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
