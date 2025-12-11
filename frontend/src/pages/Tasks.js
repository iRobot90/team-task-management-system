import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../api/tasks';
import { usersAPI } from '../api/users';
<<<<<<< HEAD
import { useAuth } from '../context/AuthContext';
=======
>>>>>>> 11a5649 (Log registration validation errors; surface registration errors in frontend)
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { TASK_STATUS, TASK_STATUS_LABELS, USER_ROLES } from '../utils/constants';
import './Tasks.css';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
<<<<<<< HEAD
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: TASK_STATUS.TODO,
    deadline: '',
    assignee: '',
  });

  const canManageTasks = user?.role_name === USER_ROLES.ADMIN || user?.role_name === USER_ROLES.MANAGER;

  useEffect(() => {
    fetchTasks();
    if (canManageTasks) {
      fetchUsers();
    }
  }, [filterStatus, filterAssignee]);
=======
  const [filter, setFilter] = useState('all');
  const [members, setMembers] = useState([]);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const { user } = useAuth();
  const [updatingId, setUpdatingId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    assignee: '',
  });

  useEffect(() => {
    fetchTasks();
    if (user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN) {
      fetchMembers();
    }
  }, [filter, user]);
>>>>>>> 11a5649 (Log registration validation errors; surface registration errors in frontend)

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterAssignee !== 'all') params.assignee = filterAssignee;
      const data = await tasksAPI.getAll(params);
      setTasks(Array.isArray(data.results) ? data.results : data);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
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
    setAssignError('');
    setAssignSuccess('');
    try {
      if (!assigneeId) {
        await tasksAPI.unassign(taskId);
        setAssignSuccess('Task unassigned');
      } else {
        await tasksAPI.assign(taskId, assigneeId);
        setAssignSuccess('Task assigned successfully');
      }
      fetchTasks();
      fetchMembers();
    } catch (err) {
      setAssignError(
        err.response?.data?.error || 'Failed to assign task'
      );
    }
  };

  const handleCreateTask = async () => {
    setCreateError('');
    setCreateSuccess('');
    if (!newTask.title.trim()) {
      setCreateError('Title is required');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: newTask.title,
        description: newTask.description,
        status: 'todo',
        assignee: newTask.assignee || null,
      };
      if (newTask.deadline) {
        payload.deadline = new Date(newTask.deadline).toISOString();
      }
      await tasksAPI.create(payload);
      setCreateSuccess('Task created');
      setNewTask({ title: '', description: '', deadline: '', assignee: '' });
      fetchTasks();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create task');
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

  if (loading) {
    return <Loading message="Loading tasks..." />;
  }

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
<<<<<<< HEAD
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
=======
      <div className="tasks-grid">
        <aside className="tasks-sidebar">
          <h3>Filters</h3>
          <div className="filter-buttons vertical">
            {statusFilterButtons.map((btn) => (
              <button
                key={btn.key}
                className={filter === btn.key ? 'active' : ''}
                onClick={() => setFilter(btn.key)}
              >
                {btn.label}
                {btn.key !== 'all' && (
                  <span className="pill-count">
                    {statusCounts[btn.key] || 0}
                  </span>
>>>>>>> 11a5649 (Log registration validation errors; surface registration errors in frontend)
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
<<<<<<< HEAD
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
=======
              </ul>
>>>>>>> 11a5649 (Log registration validation errors; surface registration errors in frontend)
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
