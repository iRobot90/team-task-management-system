import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../api/tasks';
import { usersAPI } from '../api/users';
import { notificationsAPI } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { webSocketService } from '../services/websocket';
import Modal from '../components/Modal';
import { TASK_STATUS, TASK_STATUS_LABELS, USER_ROLES } from '../utils/constants';
import { 
  Plus, 
  ListChecks, 
  Users, 
  Filter, 
  MessageSquare, 
  Calendar, 
  User, 
  Trash2, 
  Edit, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import './Tasks.css';

const Tasks = () => {
  // State declarations
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  // Notification state is now handled in NotificationBell component
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: TASK_STATUS.TODO,
    deadline: '',
    assignee: '',
  });
  const canManageTasks = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER;

  // Calculate task counts by status
  const taskCounts = tasks.reduce(
    (acc, task) => {
      acc.total++;
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    { total: 0, [TASK_STATUS.TODO]: 0, [TASK_STATUS.IN_PROGRESS]: 0, [TASK_STATUS.DONE]: 0 }
  );

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const assigneeMatch = filterAssignee === 'all' || task.assignee === filterAssignee;
    return statusMatch && assigneeMatch;
  });
  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const tasksData = await tasksAPI.getAll();
      setTasks(Array.isArray(tasksData.results) ? tasksData.results : tasksData);
      
      if (canManageTasks) {
        const [usersData, membersData] = await Promise.all([
          usersAPI.getAll(),
          usersAPI.getAll({ role: USER_ROLES.MEMBER })
        ]);
        
        setUsers(Array.isArray(usersData.results) ? usersData.results : usersData);
        setMembers(Array.isArray(membersData.results) ? membersData.results : membersData);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [canManageTasks]);
  // Fetch data on component mount
  // Setup WebSocket connection and notifications
  useEffect(() => {
    fetchData();
    
    // Connect to WebSocket
    if (user?.token) {
      webSocketService.connect(user.token);
      
      // Handle incoming notifications
      const handleNotification = (data) => {
        if (data.type === 'task_assigned' || data.type === 'task_updated') {
          // Show toast notification
          toast.info(data.message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
          // Refresh tasks if needed
          if (data.should_refresh) {
            fetchData();
          }
        }
      };
      
      const unsubscribe = webSocketService.onNotification(handleNotification);
      
      // Cleanup on unmount
      return () => {
        unsubscribe();
        webSocketService.disconnect();
      };
    }
  }, [fetchData, user?.token]);
  
  if (loading) return <Loading message="Loading tasks..." />;

  // Handle task status change
  const handleStatusChange = async (taskId, status) => {
    setUpdatingId(taskId);
    try {
      const task = tasks.find(t => t.id === taskId);
      await tasksAPI.update(taskId, { status });
      
      // Emit notification for status change
      if (task) {
        const message = `Task "${task.title}" status changed to ${TASK_STATUS_LABELS[status]}`;
        await notificationsAPI.create({
          type: 'task_updated',
          message,
          recipient: task.assignee,
          task: taskId,
        });
      }
      
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      ));
      setSuccess('Task status updated');
    } catch (err) {
      setError('Failed to update task status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle comments section
const toggleComments = async (taskId) => {
  const isOpen = !commentsOpen[taskId];
  setCommentsOpen({ ...commentsOpen, [taskId]: isOpen });
  
  if (isOpen && !commentsData[taskId]) {
    try {
      const comments = await tasksAPI.listComments(taskId);
      setCommentsData({ ...commentsData, [taskId]: comments });
    } catch (err) {
      setError('Failed to load comments');
    }
  }
};
// Add a new comment
const handleAddComment = async (taskId) => {
  const content = commentDrafts[taskId]?.trim();
  if (!content) return;
  try {
    await tasksAPI.addComment(taskId, content);
    const updatedComments = await tasksAPI.listComments(taskId);
    setCommentsData({ ...commentsData, [taskId]: updatedComments });
    setCommentDrafts({ ...commentDrafts, [taskId]: '' });
  } catch (err) {
    setError('Failed to add comment');
  }
};
// Handle form input changes
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

// Reset form data
const resetForm = () => {
  setFormData({
    title: '',
    description: '',
    status: TASK_STATUS.TODO,
    deadline: '',
    assignee: '',
  });
};

// Handle modal close
const handleCloseCreateModal = () => {
  resetForm();
  setShowCreateModal(false);
  setShowEditModal(false);
  setError('');
  setSuccess('');
};

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Basic validation
  if (!formData.title.trim()) {
    setError('Title is required');
    return;
  }

  try {
    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      deadline: formData.deadline || null,
      assignee: formData.assignee || null,
    };

    if (selectedTask) {
      const updatedTask = await tasksAPI.update(selectedTask.id, taskData);
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      setSuccess('Task updated successfully');
      setShowEditModal(false);
    } else {
      const newTask = await tasksAPI.create(taskData);
      setTasks([newTask, ...tasks]);
      setSuccess('Task created successfully');
      handleCloseCreateModal();
    }
  } catch (err) {
    console.error('Error submitting task:', err);
    setError(err.response?.data?.error || 'Failed to save task');
  }
};

// Handle task edit
const handleEdit = (task) => {
  setFormData({
    title: task.title,
    description: task.description || '',
    status: task.status,
    deadline: task.deadline ? task.deadline.split('T')[0] : '',
    assignee: task.assignee || '',
  });
  setSelectedTask(task);
  setShowEditModal(true);
};

// Handle task assignment
const handleAssign = async (taskId, assigneeId) => {
  try {
    const task = tasks.find(t => t.id === taskId);
    
    if (assigneeId) {
      await tasksAPI.assign(taskId, assigneeId);
      
      // Emit notification for assignment
      if (task) {
        const message = `You've been assigned to task: ${task.title}`;
        await notificationsAPI.create({
          type: 'task_assigned',
          message,
          recipient: assigneeId,
          task: taskId,
        });
      }
    } else {
      await tasksAPI.unassign(taskId);
    }
    setTasks(tasks.map(task => task.id === taskId ? { ...task, assignee: assigneeId } : task));
    setSuccess('Task assigned successfully');
  } catch (err) {
    setError('Failed to assign task');
  }
};

// Handle task deletion
const handleDelete = async (taskId) => {
  if (window.confirm('Are you sure you want to delete this task?')) {
    try {
      await tasksAPI.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      setSuccess('Task deleted successfully');
    } catch (err) {
      setError('Failed to delete task');
    }
  }
};


  return (
    <div className="tasks-page">
      <div className="tasks-container">
        {/* Sidebar */}
        <aside className="tasks-sidebar">
          <div className="sidebar-header">
            <h2>Task Manager</h2>
            {canManageTasks && (
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> New Task
              </button>
            )}
          </div>

          <nav className="sidenav">
            <div className="filter-section">
              <div className="filter-header">
                <Filter size={16} />
                <h4>Filters</h4>
              </div>
              
              <div className="filter-group">
                <div className="filter-label">
                  <ListChecks size={16} />
                  <span>Status</span>
                </div>
                <div className="filter-options">
                  {[
                    { 
                      key: 'all', 
                      label: 'All Tasks', 
                      icon: <ListChecks size={16} />,
                      count: taskCounts.total
                    },
                    { 
                      key: TASK_STATUS.TODO, 
                      label: 'To Do', 
                      icon: <ListChecks size={16} />,
                      count: taskCounts[TASK_STATUS.TODO] || 0
                    },
                    { 
                      key: TASK_STATUS.IN_PROGRESS, 
                      label: 'In Progress', 
                      icon: <ListChecks size={16} />,
                      count: taskCounts[TASK_STATUS.IN_PROGRESS] || 0
                    },
                    { 
                      key: TASK_STATUS.DONE, 
                      label: 'Completed', 
                      icon: <ListChecks size={16} />,
                      count: taskCounts[TASK_STATUS.DONE] || 0
                    },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      className={`filter-option ${filterStatus === btn.key ? 'active' : ''}`}
                      onClick={() => setFilterStatus(btn.key)}
                      type="button"
                    >
                      <span className="filter-icon">{btn.icon}</span>
                      <span className="filter-label">{btn.label}</span>
                      <span className="filter-count">{btn.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {canManageTasks && members.length > 0 && (
                <div className="filter-group">
                  <div className="filter-label">
                    <Users size={16} />
                    <span>Assignee</span>
                  </div>
                  <div className="select-wrapper">
                    <select
                      value={filterAssignee}
                      onChange={(e) => setFilterAssignee(e.target.value)}
                      className="select-input"
                    >
                      <option value="all">All Members</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.email}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="select-arrow" />
                  </div>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Tasks List */}
        <div className="tasks-content">
          <div className="tasks-header">
            <h2>
              {filterStatus === 'all' ? 'All Tasks' : `${TASK_STATUS_LABELS[filterStatus] || 'Tasks'}`}
              {filterAssignee !== 'all' && ` (${members.find(m => m.id === filterAssignee)?.email || 'Assigned'})`}
            </h2>
            <div className="task-count">{filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No tasks found</h3>
              <p>Try adjusting your filters or create a new task to get started.</p>
              {canManageTasks && (
                <button 
                  className="btn-primary" 
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={16} /> Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="task-grid">
              {filteredTasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-card-header">
                    <div className="task-card-title">
                      <h3>{task.title}</h3>
                      <span className={`status-badge status-${task.status}`}>
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </div>
                    {canManageTasks && (
                      <div className="task-actions">
                        <button 
                          className="icon-button" 
                          onClick={() => handleEdit(task)}
                          aria-label="Edit task"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="icon-button danger" 
                          onClick={() => handleDelete(task.id)}
                          aria-label="Delete task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {task.description && (
                    <div className="task-description">
                      <p>{task.description}</p>
                    </div>
                  )}
                  
                  <div className="task-meta">
                    {task.assignee_detail && (
                      <div className="meta-item">
                        <User size={14} />
                        <span>{task.assignee_detail.email}</span>
                      </div>
                    )}
                    {task.deadline && (
                      <div className="meta-item">
                        <Calendar size={14} />
                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="task-actions-row">
                    {user?.role_name === USER_ROLES.MEMBER && (
                      <div className="status-selector">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          disabled={updatingId === task.id}
                          className="status-select"
                        >
                          <option value={TASK_STATUS.TODO}>Mark as Todo</option>
                          <option value={TASK_STATUS.IN_PROGRESS}>Mark as In Progress</option>
                          <option value={TASK_STATUS.DONE}>Mark as Done</option>
                        </select>
                      </div>
                    )}

                    {canManageTasks && members.length > 0 && (
                      <div className="assign-selector">
                        <div className="select-wrapper">
                          <select
                            value={task.assignee || ''}
                            onChange={(e) => handleAssign(task.id, e.target.value)}
                            className="select-input"
                          >
                            <option value="">Assign to...</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.email}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="select-arrow" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="comments-section">
                    <button 
                      className="comments-toggle"
                      onClick={() => toggleComments(task.id)}
                      aria-expanded={!!commentsOpen[task.id]}
                    >
                      <MessageSquare size={16} />
                      <span>{commentsOpen[task.id] ? 'Hide comments' : 'Show comments'}</span>
                      <span className="comment-count">
                        {commentsData[task.id]?.length || 0}
                      </span>
                      {commentsOpen[task.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {commentsOpen[task.id] && (
                      <div className="comments-box">
                        <div className="comments-list">
                          {commentsData[task.id]?.length > 0 ? (
                            commentsData[task.id].map((comment) => (
                              <div key={comment.id} className="comment">
                                <div className="comment-header">
                                  <span className="comment-author">{comment.author_detail?.email}</span>
                                  <span className="comment-time">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <div className="comment-content">{comment.content}</div>
                              </div>
                            ))
                          ) : (
                            <div className="no-comments">No comments yet</div>
                          )}
                        </div>
                        
                        <div className="comment-input-container">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentDrafts[task.id] || ''}
                            onChange={(e) =>
                              setCommentDrafts({ ...commentDrafts, [task.id]: e.target.value })
                            }
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(task.id)}
                            className="comment-input"
                          />
                          <button 
                            onClick={() => handleAddComment(task.id)}
                            className="comment-submit"
                            disabled={!commentDrafts[task.id]?.trim()}
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showCreateModal} onClose={handleCloseCreateModal} title="Create New Task">
        <form onSubmit={handleSubmit} className="task-form">
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter task description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              rows="4"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value={TASK_STATUS.TODO}>To Do</option>
                <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                <option value={TASK_STATUS.DONE}>Done</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="deadline">Deadline</label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          {canManageTasks && members.length > 0 && (
            <div className="form-group">
              <label htmlFor="assignee">Assign To</label>
              <select 
                id="assignee" 
                name="assignee" 
                value={formData.assignee} 
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select a team member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.email}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleCloseCreateModal}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!formData.title.trim()}
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Task">
        <form onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
          />
          {canManageTasks && (
            <select name="assignee" value={formData.assignee} onChange={handleChange}>
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">Update Task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;