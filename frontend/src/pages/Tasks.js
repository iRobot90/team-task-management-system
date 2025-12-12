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

  /* -------------------------
     State
     -------------------------*/
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
    status: TASK_STATUS?.TODO || 'todo',
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

  const canManageTasks =
    user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER;

  /* -------------------------
     Derived values
     -------------------------*/
  const filterByDateRange = (task) => {
    if (filterDateRange === 'all') return true;
    if (!task.created_at) return true;

    const created = new Date(task.created_at);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (filterDateRange === 'today') {
      return created.toDateString() === now.toDateString();
    }
    if (filterDateRange === 'week') {
      return diffDays <= 7;
    }
    if (filterDateRange === 'month') {
      return diffDays <= 30;
    }
    return true;
  };

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const assigneeId = task.assignee ?? task.assignee_detail?.id;
    const assigneeMatch =
      filterAssignee === 'all' || String(assigneeId) === String(filterAssignee);
    const searchMatch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const dateMatch = filterByDateRange(task);
    return statusMatch && assigneeMatch && searchMatch && dateMatch;
  });

  const metrics = computeTeamMetrics(filteredTasks, users);
  const {
    statusCounts,
    perUser,
    topPerformer,
    unassigned,
    tasksPerMember,
    activeMembers,
    totalTasks,
  } = metrics;

  const completionRate =
    totalTasks > 0
      ? (((statusCounts[TASK_STATUS.DONE] || 0) / totalTasks) * 100).toFixed(1)
      : 0;

  const overdueTasks = filteredTasks.filter(
    (t) =>
      t.deadline &&
      new Date(t.deadline) < new Date() &&
      t.status !== TASK_STATUS.DONE
  ).length;

  const completedTasksForAvg = filteredTasks.filter(
    (t) => t.status === TASK_STATUS.DONE && t.updated_at && t.created_at
  );
  const avgCompletionTime =
    completedTasksForAvg.length > 0
      ? completedTasksForAvg.reduce(
          (acc, t) =>
            acc +
            (new Date(t.updated_at) - new Date(t.created_at)) /
              (1000 * 60 * 60 * 24),
          0
        ) / completedTasksForAvg.length
      : 0;

  const teamUtilization = Object.values(perUser).reduce(
    (acc, member) => acc + (member[TASK_STATUS.IN_PROGRESS] || 0),
    0
  );

  /* -------------------------
     Data fetching
     -------------------------*/
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterAssignee !== 'all') params.assignee = filterAssignee;
      const data = await tasksAPI.getAll(params);
      setTasks(Array.isArray(data.results) ? data.results : data);
    } catch (err) {
      console.error('fetchTasks error', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [canManageTasks]);

  const fetchCommentsForTask = async (taskId) => {
    try {
      const comments = await tasksAPI.listComments(taskId);
      setCommentsData((prev) => ({ ...prev, [taskId]: comments }));
    } catch (err) {
      console.error('Failed to fetch comments', err);
      setError('Failed to load comments');
    }
  };

  /* -------------------------
     Effects: mount + websocket
     -------------------------*/
  useEffect(() => {
    fetchTasks();

    if (user?.token) {
      webSocketService.connect(user.token);

      const handleNotification = (data) => {
        if (!data) return;
        if (data.message) {
          toast.info(data.message, { position: 'top-right', autoClose: 5000 });
        }
        const notifType = data.type || data.notification_type;
        const isTaskEvent =
          typeof notifType === 'string' && notifType.startsWith('task_');
        if (data.should_refresh || isTaskEvent) fetchTasks();
      };

      const unsubscribe = webSocketService.onNotification(handleNotification);

      return () => {
        if (unsubscribe) unsubscribe();
        webSocketService.disconnect();
      };
    }

    return () => {};
  }, [fetchTasks, user?.token]);

  /* -------------------------
     Handlers
     -------------------------*/
  const handleStatusChange = async (taskId, status) => {
    setUpdatingId(taskId);
    setError('');
    setSuccess('');
    try {
      const task = tasks.find((t) => t.id === taskId);
      await tasksAPI.update(taskId, { status });

      if (task) {
        const message = `Task "${task.title}" status changed to ${TASK_STATUS_LABELS[status] || status}`;
        try {
          await notificationsAPI.create({
            type: 'TASK_DONE',
            message,
            recipient: task.assignee?.id || null,
            task: taskId,
          });
        } catch (e) {
          console.warn('notification create failed', e);
        }
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
      setSuccess('Task status updated');
    } catch (err) {
      console.error('handleStatusChange', err);
      setError('Failed to update task status');
    } finally {
      setUpdatingId(null);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const toggleComments = async (taskId) => {
    const isOpen = !commentsOpen[taskId];
    setCommentsOpen((prev) => ({ ...prev, [taskId]: isOpen }));
    if (isOpen && !commentsData[taskId]) {
      await fetchCommentsForTask(taskId);
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

  const handleAddComment = async (taskId) => {
    const content = (commentDrafts[taskId] || '').trim();
    if (!content) return;
    try {
      await tasksAPI.addComment(taskId, content);
      const updated = await tasksAPI.listComments(taskId);
      setCommentsData((prev) => ({ ...prev, [taskId]: updated }));
      setCommentDrafts((prev) => ({ ...prev, [taskId]: '' }));
      setSuccess('Comment added');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('handleAddComment', err);
      setError('Failed to add comment');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: TASK_STATUS.TODO,
      deadline: '',
      assignee: '',
    });
    setSelectedTask(null);
    setCreateError('');
    setCreateSuccess('');
  };

  const handleCloseCreateModal = () => {
    resetForm();
    setShowCreateModal(false);
    setShowEditModal(false);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreateError('');
    setCreateSuccess('');

    if (!formData.title || !formData.title.trim()) {
      setCreateError('Title is required');
      return;
    }

    try {
      setCreating(true);

      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        status: formData.status || TASK_STATUS.TODO,
        deadline: formData.deadline
          ? new Date(formData.deadline).toISOString()
          : null,
        assignee: formData.assignee || null,
      };

      if (selectedTask) {
        const updated = await tasksAPI.update(selectedTask.id, payload);
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        setCreateSuccess('Task updated successfully');
        setShowEditModal(false);
      } else {
        const created = await tasksAPI.create(payload);
        setTasks((prev) => [created, ...prev]);
        setCreateSuccess('Task created successfully');
        setShowCreateModal(false);
      }
      resetForm();
      setTimeout(() => setCreateSuccess(''), 3000);
    } catch (err) {
      console.error('handleSubmit', err);
      setCreateError(err?.response?.data?.error || 'Failed to save task');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (task) => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      status: task.status || TASK_STATUS.TODO,
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      assignee: task.assignee ?? task.assignee_detail?.id ?? '',
    });
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleAssign = async (taskId, assigneeId) => {
    setError('');
    setSuccess('');
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (assigneeId) {
        await tasksAPI.assign(taskId, assigneeId);
        if (task) {
          const message = `You've been assigned to task: ${task.title}`;
          try {
            await notificationsAPI.create({
              type: 'TASK_ASSIGNED',
              message,
              recipient: assigneeId,
              task: taskId,
            });
          } catch (e) {
            console.warn('notification create failed', e);
          }
        }
      } else {
        await tasksAPI.unassign(taskId);
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, assignee: { id: assigneeId } } : t))
      );
      setSuccess('Task assignment updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('handleAssign', err);
      setError('Failed to assign task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setError('');
    setSuccess('');
    try {
      await tasksAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSuccess('Task deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('handleDelete', err);
      setError('Failed to delete task');
    }
  };

  const handleBulkSelect = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
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

              {/* Advanced Filters */}
              <div className="filters-section">
                <h4>
                  <Filter size={16} />
                  Advanced Filters
                </h4>
                <div className="filter-controls">
                  <div className="filter-group">
                    <label>Search</label>
                    <div className="search-input-wrapper">
                      <Search size={14} className="search-icon" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks..."
                        className="search-input"
                      />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label>Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Status</option>
                      <option value={TASK_STATUS.TODO}>Todo</option>
                      <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                      <option value={TASK_STATUS.DONE}>Done</option>
                    </select>
                  </div>

                  {canManageTasks && (
                    <div className="filter-group">
                      <label>Assignee</label>
                      <select
                        value={filterAssignee}
                        onChange={(e) => setFilterAssignee(e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">All Members</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="filter-group">
                    <label>Date Range</label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="filter-select"
                    >
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                </div>

                <div className="filter-actions">
                  <button onClick={handleExport} className="btn btn-outline btn-sm">
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Team Performance Insights */}
              {Object.keys(perUser).length > 0 && (
                <div id="team-performance" className="productivity-section">
                  <h4>
                    <Users size={16} />
                    Team Performance Insights
                  </h4>

                  {/* Top Performer */}
                  {topPerformer && (
                    <div className="top-performer-card">
                      <div className="performer-header">
                        <CheckCircle size={14} />
                        <span>Top Performer</span>
                      </div>
                      <div className="performer-info">
                        <strong>
                          {topPerformer.user.email ||
                            topPerformer.user.username ||
                            'Team Member'}
                        </strong>
                        <div className="performer-stats">
                          <span>{topPerformer.completed} completed</span>
                          <span>{topPerformer.completionRate}% rate</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Team Overview */}
                  <div className="team-overview">
                    <div className="overview-item">
                      <span className="label">Tasks per Member</span>
                      <span className="value">{tasksPerMember}</span>
                    </div>
                    <div className="overview-item">
                      <span className="label">Active Members</span>
                      <span className="value">{activeMembers}</span>
                    </div>
                    {unassigned.total > 0 && (
                      <div className="overview-item">
                        <span className="label">Unassigned</span>
                        <span className="value">
                          {unassigned.total} total
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Individual Performance */}
                  <div className="productivity-list">
                    {Object.values(perUser)
                      .sort(
                        (a, b) =>
                          (b[TASK_STATUS.DONE] || 0) - (a[TASK_STATUS.DONE] || 0)
                      )
                      .map((entry) => {
                        const completed = entry[TASK_STATUS.DONE] || 0;
                        const active = entry[TASK_STATUS.IN_PROGRESS] || 0;
                        const total = entry.total || 0;
                        const completionPct =
                          total > 0 ? (completed / total) * 100 : 0;
                        const label =
                          entry.user.email ||
                          entry.user.username ||
                          'Team Member';
                        return (
                          <div key={entry.user.id} className="productivity-item">
                            <div className="member-info">
                              <span className="member-email">{label}</span>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${completionPct}%` }}
                                />
                              </div>
                            </div>
                            <div className="member-stats">
                              <span className="stat">{total} total</span>
                              <span className="stat done">{completed} done</span>
                              <span className="stat progress">{active} active</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </aside>
          )}

          {/* Main Content */}
          <main className="tasks-main">
            <div className="main-header">
              <div className="header-content">
                <div>
                  <h2>{canManageTasks ? 'Team Tasks' : 'My Tasks'}</h2>
                  <p className="header-subtitle">
                    {canManageTasks
                      ? 'Monitor and manage work across your team.'
                      : 'View and update the tasks assigned to you.'}
                  </p>
                </div>
                <div className="header-stats">
                  <span className="stat-badge">{filteredTasks.length} tasks</span>
                  {selectedTasks.length > 0 && (
                    <span className="stat-badge selected">
                      {selectedTasks.length} selected
                    </span>
                  )}
                </div>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
            </div>

            {/* Filters for Members */}
            {!canManageTasks && (
              <div className="member-filters-bar">
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value={TASK_STATUS.TODO}>To Do</option>
                    <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                    <option value={TASK_STATUS.DONE}>Done</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Search</label>
                  <div className="search-input-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks..."
                      className="search-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Manager Filters Bar */}
            {canManageTasks && (
              <div className="manager-filters-bar">
                <div className="filter-group">
                  <label>Search</label>
                  <div className="search-input-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks..."
                      className="search-input"
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value={TASK_STATUS.TODO}>To Do</option>
                    <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                    <option value={TASK_STATUS.DONE}>Done</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Assignee</label>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Members</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email || u.username || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Date Range</label>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {canManageTasks && selectedTasks.length > 0 && (
              <div className="bulk-actions-bar">
                <div className="bulk-info">
                  <span>{selectedTasks.length} task(s) selected</span>
                </div>
                <div className="bulk-buttons">
                  <button
                    onClick={() => setSelectedTasks([])}
                    className="btn btn-outline btn-sm"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="btn btn-delete btn-sm"
                  >
                    <Trash2 size={14} />
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Task List */}
            <div className="tasks-list">
              {filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <CheckCircle size={48} />
                  </div>
                  <h3>No tasks found</h3>
                  <p>
                    {filterStatus !== 'all' || filterAssignee !== 'all' || searchQuery
                      ? 'No tasks match your current filters.'
                      : canManageTasks
                      ? 'Create your first task to get started with your team.'
                      : 'No tasks have been assigned to you yet.'}
                  </p>
                  {canManageTasks && !filterStatus && !filterAssignee && !searchQuery && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-primary"
                    >
                      <Plus size={16} />
                      Create First Task
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredTasks.map((task) => (
                    <div key={task.id} className="task-wrapper">
                      {canManageTasks && (
                        <div className="bulk-select-wrapper">
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => handleBulkSelect(task.id)}
                            className="bulk-checkbox"
                          />
                        </div>
                      )}
                      <TaskCard
                        task={task}
                        currentUserId={user?.id}
                        isManagerOrAdmin={canManageTasks}
                        onStatusChange={handleStatusChange}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAssign={canManageTasks ? handleAssign : undefined}
                        onComment={toggleComments}
                        comments={commentsData[task.id] || []}
                        commentsOpen={commentsOpen[task.id]}
                        commentDrafts={commentDrafts}
                        setCommentDrafts={setCommentDrafts}
                        onAddComment={handleAddComment}
                        updatingId={updatingId}
                      />
                    </div>
                  ))}
                </div>
              )}
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
    </>
  );
};

export default Tasks;
