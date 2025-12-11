import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../api/tasks';
import { usersAPI } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { TASK_STATUS, TASK_STATUS_LABELS, USER_ROLES } from '../utils/constants';
import './Tasks.css';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: TASK_STATUS.TODO,
    deadline: '',
    assignee: '',
  });

  const canManageTasks = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER;

  useEffect(() => {
    fetchTasks();
    if (canManageTasks) {
      fetchUsers();
      fetchMembers();
    }
  }, [filterStatus, filterAssignee]);

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
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterAssignee !== 'all') params.assignee = filterAssignee;
      const data = await tasksAPI.getAll(params);
      setTasks(Array.isArray(data.results) ? data.results : data);
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
  const handleStatusChange = async (taskId, status) => {
    setUpdatingId(taskId);
    try {
      await tasksAPI.update(taskId, { status });
      await fetchTasks();
    } catch (err) {
      setError('Failed to update task status');
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await usersAPI.getAll({ role: USER_ROLES.MEMBER });
      setMembers(Array.isArray(data.results) ? data.results : data);
    } catch (err) {
      console.error('Error fetching members', err);
    }
  };

  const handleAssign = async (taskId, assigneeId) => {
    setError('');
    setSuccess('');
    try {
      if (!assigneeId) {
        await tasksAPI.unassign(taskId);
        setSuccess('Task unassigned');
      } else {
        await tasksAPI.assign(taskId, assigneeId);
        setSuccess('Task assigned successfully');
      }
      fetchTasks();
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign task');
    }
  };

  const handleCreateTask = async () => {
    setError('');
    setSuccess('');
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        status: formData.status || 'todo',
        assignee: formData.assignee || null,
      };
      if (formData.deadline) {
        payload.deadline = new Date(formData.deadline).toISOString();
      }
      await tasksAPI.create(payload);
      setSuccess('Task created successfully');
      setFormData({
        title: '',
        description: '',
        status: TASK_STATUS.TODO,
        deadline: '',
        assignee: ''
      });
      setShowCreateModal(false);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const toggleComments = async (taskId) => {
    const open = commentsOpen[taskId];
    setCommentsOpen({ ...commentsOpen, [taskId]: !open });
    if (!open) {
      const data = await tasksAPI.listComments(taskId);
      setCommentsData({ ...commentsData, [taskId]: data });
    }
  };

  const handleAddComment = async (taskId) => {
    const content = commentDrafts[taskId];
    if (!content) return;
    await tasksAPI.addComment(taskId, content);
    const data = await tasksAPI.listComments(taskId);
    setCommentsData({ ...commentsData, [taskId]: data });
    setCommentDrafts({ ...commentDrafts, [taskId]: '' });
  };

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(Array.isArray(data.results) ? data.results : data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      status: TASK_STATUS.TODO,
      deadline: '',
      assignee: '',
    });
    setSelectedTask(null);
    setShowCreateModal(true);
  };

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

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await tasksAPI.delete(taskId);
      setSuccess('Task deleted successfully');
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const taskData = {
        ...formData,
        deadline: formData.deadline || null,
        assignee: formData.assignee || null,
      };

      if (selectedTask) {
        await tasksAPI.update(selectedTask.id, taskData);
        setSuccess('Task updated successfully');
      } else {
        await tasksAPI.create(taskData);
        setSuccess('Task created successfully');
      }

      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedTask(null);
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
      console.error('Error saving task:', err);
    }
  };

  const handleAssign = async (taskId, assigneeId) => {
    try {
      await tasksAPI.assign(taskId, assigneeId);
      setSuccess('Task assigned successfully');
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to assign task');
      console.error('Error assigning task:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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


  const statusCounts = tasks.reduce(
    (acc, t) => {
      acc.total += 1;
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    { total: 0, todo: 0, in_progress: 0, done: 0 }
  );

  const productivity = tasks.reduce((acc, t) => {
    const key = t.assignee_detail?.email || 'Unassigned';
    acc[key] = acc[key] || { total: 0, done: 0, in_progress: 0, todo: 0 };
    acc[key].total += 1;
    acc[key][t.status] += 1;
    return acc;
  }, {});

  const statusFilterButtons = [
    { key: 'all', label: 'All' },
    { key: 'todo', label: 'Todo' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'done', label: 'Done' },
  ];

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h1>Tasks</h1>
        {canManageTasks && (
          <button className="btn-create" onClick={handleCreate}>
            + Create Task
          </button>
        )}
      </div>

      <div className="tasks-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value={TASK_STATUS.TODO}>Todo</option>
            <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
            <option value={TASK_STATUS.DONE}>Done</option>
          </select>
        </div>

        {canManageTasks && (
          <div className="filter-group">
            <label>Assignee:</label>
            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
              <option value="all">All</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">No tasks found</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className={`status-badge status-${task.status}`}>
                  {TASK_STATUS_LABELS[task.status] || task.status}
                </span>
              </div>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              <div className="task-meta">
                {task.assignee_detail ? (
                  <span>Assigned to: {task.assignee_detail.email}</span>
                ) : (
                  <span className="unassigned">Unassigned</span>
                )}
              </button>
            ))}
          </div>

          <div className="summary-card">
            <h4>At a glance</h4>
            <ul>
              <li><span>Total</span><strong>{statusCounts.total}</strong></li>
              <li><span>Todo</span><strong>{statusCounts.todo}</strong></li>
              <li><span>In Progress</span><strong>{statusCounts.in_progress}</strong></li>
              <li><span>Done</span><strong>{statusCounts.done}</strong></li>
            </ul>
          </div>

          {user?.role === 'MANAGER' && (
            <div className="summary-card">
              <h4>Member productivity</h4>
              <ul className="productivity-list">
                {Object.entries(productivity).map(([member, stats]) => (
                  <li key={member}>
                    <div>
                      <strong>{member}</strong>
                      <div className="productivity-meta">
                        <span>{stats.done} done</span>
                        <span>{stats.in_progress} in progress</span>
                        <span>{stats.todo} todo</span>
                      </div>
                    </div>
                    <span className="pill-count">{stats.total}</span>
                  </li>
                ))}
                {Object.keys(productivity).length === 0 && (
                  <li className="muted">No assignments yet</li>
                )}
              </div>
              <div className="task-actions">
                {(canManageTasks || task.assignee === user?.id) && (
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(task)}
                  >
                    Edit
                  </button>
                )}
                {canManageTasks && (
                  <>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(task.id)}
                    >
                      Delete
                    </button>
                    <select
                      className="assign-select"
                      value={task.assignee || ''}
                      onChange={(e) => handleAssign(task.id, e.target.value)}
                    >
                      <option value="">Assign to...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email}
                        </option>
                      ))}
                    </select>
                  </>
                )}
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

          {(user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN) && (
            <div className="summary-card create-task">
              <h4>Create task</h4>
              {createError && <div className="error-message compact">{createError}</div>}
              {createSuccess && <div className="success-message compact">{createSuccess}</div>}
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Assign to</label>
                <select
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.email} ({m.first_name} {m.last_name})
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn-primary" disabled={creating} onClick={handleCreateTask}>
                {creating ? 'Creating...' : 'Create task'}
              </button>
            </div>
          )}
        </aside>

        <div className="tasks-content">
          <div className="tasks-header">
            <div>
              <p className="eyebrow">
                {user?.role === USER_ROLES.MANAGER ? 'Tasks assigned' : 'Tasks'}
              </p>
              <h1>
                {user?.role === USER_ROLES.MANAGER ? 'Team board' : 'Your workboard'}
              </h1>
            </div>
            <div className="pill-row">
              {statusFilterButtons.map((btn) => (
                <button
                  key={btn.key}
                  className={`pill ${filter === btn.key ? 'active' : ''}`}
                  onClick={() => setFilter(btn.key)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {assignError && <div className="error-message">{assignError}</div>}
          {assignSuccess && <div className="success-message">{assignSuccess}</div>}

          <div className="tasks-list">
            {tasks.length === 0 ? (
              <div className="empty-state">No tasks found</div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <div>
                      <p className="eyebrow">#{String(task.id).slice(0, 6)}</p>
                      <h3>{task.title}</h3>
                    </div>
                    <span className={`status-badge status-${task.status}`}>
                      {TASK_STATUS_LABELS[task.status] || task.status}
                    </span>
                  </div>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div className="task-meta">
                    {task.assignee_detail && (
                      <span>Assigned to: {task.assignee_detail.email}</span>
                    )}
                    {task.created_by_detail && (
                      <span>Created by: {task.created_by_detail.email}</span>
                    )}
                    {task.deadline && (
                      <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                  {user?.role === USER_ROLES.MEMBER && (
                    <div className="status-row">
                      <label htmlFor={`status-${task.id}`}>Update status:</label>
                      <select
                        id={`status-${task.id}`}
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        disabled={updatingId === task.id}
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  )}
                  {(user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN) && (
                    <div className="assign-row">
                      <select
                        onChange={(e) => handleAssign(task.id, e.target.value)}
                        defaultValue={task.assignee || ''}
                      >
                        <option value="">Unassign</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.email} ({m.first_name} {m.last_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="comments-section">
                    <button
                      className="pill secondary"
                      onClick={() => toggleComments(task.id)}
                    >
                      {commentsOpen[task.id] ? 'Hide comments' : 'Show comments'}
                    </button>
                    {commentsOpen[task.id] && (
                      <div className="comments-box">
                        {(commentsData[task.id] || []).map((c) => (
                          <div key={c.id} className="comment">
                            <div className="comment-meta">
                              <span>{c.author_detail?.email || 'User'}</span>
                              <span>{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <div className="comment-body">{c.content}</div>
                          </div>
                        ))}
                        <div className="comment-input">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentDrafts[task.id] || ''}
                            onChange={(e) =>
                              setCommentDrafts({
                                ...commentDrafts,
                                [task.id]: e.target.value,
                              })
                            }
                          />
                          <button onClick={() => handleAddComment(task.id)}>
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Task"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value={TASK_STATUS.TODO}>Todo</option>
              <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={TASK_STATUS.DONE}>Done</option>
            </select>
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>

          {canManageTasks && (
            <div className="form-group">
              <label>Assign To</label>
              <select name="assignee" value={formData.assignee} onChange={handleChange}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value={TASK_STATUS.TODO}>Todo</option>
              <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={TASK_STATUS.DONE}>Done</option>
            </select>
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>

          {canManageTasks && (
            <div className="form-group">
              <label>Assign To</label>
              <select name="assignee" value={formData.assignee} onChange={handleChange}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-primary">Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
