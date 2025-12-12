import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../api/tasks';
import { usersAPI } from '../api/users';
import { notificationsAPI } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import TaskCard from '../components/TaskCard';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { webSocketService } from '../services/websocket';
import Modal from '../components/Modal';
import { TASK_STATUS, TASK_STATUS_LABELS, USER_ROLES } from '../utils/constants';
import { computeTeamMetrics } from '../utils/teamMetrics';
import {
  Plus,
  Users,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Search,
  Trash2,
  BarChart3,
  PieChart,
} from 'lucide-react';
import './Tasks.css';

const Tasks = () => {
  const { user } = useAuth();

  /* -------------------------
     State
     -------------------------*/
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
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('week');
  const [selectedTasks, setSelectedTasks] = useState([]);

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
      setError('');
      const tasksData = await tasksAPI.getAll();
      const list = Array.isArray(tasksData.results) ? tasksData.results : tasksData;
      setTasks(list || []);

      if (canManageTasks) {
        const usersData = await usersAPI.getAll();
        setUsers(Array.isArray(usersData.results) ? usersData.results : usersData);

        // members
        try {
          const membersData = await usersAPI.getAll({ role: USER_ROLES.MEMBER });
          setMembers(
            Array.isArray(membersData.results) ? membersData.results : membersData
          );
        } catch {
          setMembers(
            Array.isArray(usersData.results) ? usersData.results : usersData
          );
        }
      }
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

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedTasks.length} task(s)?`)) return;
    setError('');
    setSuccess('');
    try {
      await Promise.all(selectedTasks.map((id) => tasksAPI.delete(id)));
      setTasks((prev) => prev.filter((t) => !selectedTasks.includes(t.id)));
      setSelectedTasks([]);
      setSuccess(`${selectedTasks.length} tasks deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('handleBulkDelete', err);
      setError('Failed to delete tasks');
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Description', 'Status', 'Assignee', 'Created', 'Deadline'],
      ...filteredTasks.map((task) => [
        task.title,
        task.description || '',
        task.status,
        task.assignee_detail?.email ||
          task.assignee_detail?.username ||
          'Unassigned',
        new Date(task.created_at).toLocaleDateString(),
        task.deadline ? new Date(task.deadline).toLocaleDateString() : '',
      ]),
    ].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Tasks exported successfully');
  };

  /* -------------------------
     Render
     -------------------------*/
  if (loading) return <Loading message="Loading tasks..." />;

  return (
    <>
      <div className="tasks-page">
        <div className={`tasks-layout ${canManageTasks ? 'manager-layout' : 'member-layout'}`}>
          {/* Sidebar (Managers/Admin only) */}
          {canManageTasks && (
            <aside className="tasks-sidebar">
              <div className="sidebar-header">
                <h3>Team Overview</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={16} />
                  New Task
                </button>
              </div>

              {/* KPI Dashboard */}
              <div className="kpi-section">
                <h4>
                  <BarChart3 size={16} />
                  Key Performance Indicators
                </h4>
                <div className="kpi-grid">
                  <div className="kpi-card primary">
                    <div className="kpi-header">
                      <Target size={14} />
                      <span className="kpi-label">Completion Rate</span>
                    </div>
                    <div className="kpi-value">
                      {completionRate}%
                      {Number(completionRate) >= 80 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                    </div>
                  </div>
                  <div className="kpi-card warning">
                    <div className="kpi-header">
                      <AlertCircle size={14} />
                      <span className="kpi-label">Overdue Tasks</span>
                    </div>
                    <div className="kpi-value">{overdueTasks}</div>
                  </div>
                  <div className="kpi-card success">
                    <div className="kpi-header">
                      <Clock size={14} />
                      <span className="kpi-label">Avg. Completion</span>
                    </div>
                    <div className="kpi-value">{avgCompletionTime.toFixed(1)} days</div>
                  </div>
                  <div className="kpi-card info">
                    <div className="kpi-header">
                      <Activity size={14} />
                      <span className="kpi-label">Team Utilization</span>
                    </div>
                    <div className="kpi-value">{teamUtilization} active</div>
                  </div>
                </div>
              </div>

              {/* Task Statistics */}
              <div className="stats-section">
                <h4>
                  <PieChart size={16} />
                  Task Distribution
                </h4>
                <div className="stat-cards">
                  <div className="stat-card">
                    <span className="stat-number">{totalTasks || 0}</span>
                    <span className="stat-label">Total Tasks</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{statusCounts[TASK_STATUS.TODO] || 0}</span>
                    <span className="stat-label">Pending</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{statusCounts[TASK_STATUS.IN_PROGRESS] || 0}</span>
                    <span className="stat-label">In Progress</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{statusCounts[TASK_STATUS.DONE] || 0}</span>
                    <span className="stat-label">Completed</span>
                  </div>
                </div>
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
          </main>
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={handleCloseCreateModal}
        title={selectedTask ? 'Edit Task' : 'Create New Task'}
      >
        <form onSubmit={handleSubmit} className="task-form">
          {createError && <div className="alert alert-error">{createError}</div>}
          {createSuccess && <div className="alert alert-success">{createSuccess}</div>}

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
              rows={3}
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
              >
                <option value={TASK_STATUS.TODO}>Todo</option>
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
              />
            </div>
          </div>

          {canManageTasks && (
            <div className="form-group">
              <label htmlFor="assignee">Assignee</label>
              <select
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Saving...' : selectedTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Tasks;
