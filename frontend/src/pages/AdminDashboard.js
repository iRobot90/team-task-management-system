import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, Check, X, Shield, Activity, Users, FileText, Settings, BarChart, Briefcase, CheckSquare, Key } from 'lucide-react';
import { usersAPI } from '../api/users';
import { projectsAPI } from '../api/projects';
import { tasksAPI } from '../api/tasks';
import {
    resetUserPassword,
    activateUser,
    deactivateUser,
    changeUserRole
} from '../api/admin';
import {
    getAllPasswordResets,
    approvePasswordReset,
    rejectPasswordReset
} from '../api/password';
import { getAdminLogs, getSystemStatus, getUserActivityStats } from '../api/admin';
import './AdminDashboard.css';

// Helper wrappers for usersAPI to match expected format
const getUsers = async () => {
    try {
        const data = await usersAPI.getAll();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

const createUser = async (userData) => {
    try {
        const data = await usersAPI.create(userData);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

const deleteUser = async (id) => {
    try {
        const data = await usersAPI.delete(id);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

const getProjects = async () => {
    try {
        const data = await projectsAPI.getAll();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

const createProject = async (projectData) => {
    try {
        const data = await projectsAPI.create(projectData);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

const deleteProject = async (id) => {
    try {
        const data = await projectsAPI.delete(id);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

const getAllTasks = async () => {
    try {
        const data = await tasksAPI.getAll(); // Ensure backend supports listing all tasks for admin
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

const deleteTask = async (id) => {
    try {
        const data = await tasksAPI.delete(id);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};


const createTask = async (taskData) => {
    try {
        const data = await tasksAPI.create(taskData);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

const updateTask = async (id, taskData) => {
    try {
        const data = await tasksAPI.update(id, taskData);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [passwordResets, setPasswordResets] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [systemStatus, setSystemStatus] = useState(null);
    const [activityStats, setActivityStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // User Management States
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);

    const [userForm, setUserForm] = useState({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        role: 'MEMBER',
        password: ''
    });
    const [projectForm, setProjectForm] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: ''
    });
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        project: '',
        assignee: ''
    });

    // Filters
    const [userFilter, setUserFilter] = useState({ role: '', search: '' });
    const [taskFilter, setTaskFilter] = useState({ status: '', search: '' });
    const [resetFilter, setResetFilter] = useState('PENDING');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            if (activeTab === 'overview') {
                await Promise.all([
                    loadSystemStatus(),
                    loadActivityStats(),
                    loadUsers(),
                    loadProjects(),
                    loadTasks()
                ]);
            } else if (activeTab === 'users') {
                await loadUsers();
            } else if (activeTab === 'projects') {
                await loadProjects();
            } else if (activeTab === 'tasks') {
                await loadTasks();
            } else if (activeTab === 'password-resets') {
                await loadPasswordResets();
            } else if (activeTab === 'logs') {
                await loadActivityLogs();
            } else if (activeTab === 'system') {
                await loadSystemStatus();
            }
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        const result = await getUsers();
        if (result.success) {
            setUsers(result.data.results || result.data || []);
        }
    };

    const loadProjects = async () => {
        const result = await getProjects();
        if (result.success) {
            setProjects(result.data.results || result.data);
        }
    };

    const loadTasks = async () => {
        const result = await getAllTasks();
        if (result.success) {
            setTasks(result.data.results || result.data);
        }
    };

    const loadPasswordResets = async () => {
        const result = await getAllPasswordResets(resetFilter);
        if (result.success) {
            setPasswordResets(result.data.results || result.data);
        }
    };

    const loadActivityLogs = async () => {
        const result = await getAdminLogs();
        if (result.success) {
            setActivityLogs(result.data.results || result.data);
        }
    };

    const loadSystemStatus = async () => {
        const result = await getSystemStatus();
        if (result.success) {
            setSystemStatus(result.data);
        }
    };

    const loadActivityStats = async () => {
        const result = await getUserActivityStats(7);
        if (result.success) {
            setActivityStats(result.data);
        }
    };

    // User Management Functions
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await createUser(userForm);

        if (result.success) {
            setSuccess('User created successfully!');
            setShowUserModal(false);
            setUserForm({ email: '', username: '', first_name: '', last_name: '', role: 'MEMBER', password: '' });
            await loadUsers();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
            return;
        }

        setLoading(true);
        const result = await deleteUser(userId);

        if (result.success) {
            setSuccess('User deleted successfully!');
            await loadUsers();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleResetPassword = async (userId, userEmail) => {
        const newPassword = prompt(`Enter new password for ${userEmail}:`);
        if (!newPassword) return;

        if (newPassword.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        const result = await resetUserPassword(userId, newPassword);

        if (result.success) {
            setSuccess(result.data.message);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleToggleActive = async (user) => {
        setLoading(true);
        const result = user.is_active
            ? await deactivateUser(user.id)
            : await activateUser(user.id);

        if (result.success) {
            setSuccess(result.data.message);
            await loadUsers();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleChangeRole = async (userId, currentRole, userEmail) => {
        const newRole = prompt(`Change role for ${userEmail}. Enter ADMIN, MANAGER, or MEMBER:`, currentRole);
        if (!newRole || newRole === currentRole) return;

        const validRoles = ['ADMIN', 'MANAGER', 'MEMBER'];
        if (!validRoles.includes(newRole.toUpperCase())) {
            alert('Invalid role. Must be ADMIN, MANAGER, or MEMBER');
            return;
        }

        setLoading(true);
        const result = await changeUserRole(userId, newRole.toUpperCase());

        if (result.success) {
            setSuccess('Role changed successfully!');
            await loadUsers();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    // Project Handlers
    const handleCreateProject = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await createProject(projectForm);

        if (result.success) {
            setSuccess('Project created successfully!');
            setShowProjectModal(false);
            setProjectForm({ name: '', description: '', start_date: '', end_date: '' });
            await loadProjects();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleDeleteProject = async (projectId, projectName) => {
        if (!window.confirm(`Are you sure you want to delete project: ${projectName}? This will also delete all associated tasks.`)) {
            return;
        }

        setLoading(true);
        const result = await deleteProject(projectId);

        if (result.success) {
            setSuccess('Project deleted successfully!');
            await loadProjects();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleDeleteTask = async (taskId, taskTitle) => {
        if (!window.confirm(`Are you sure you want to delete task: ${taskTitle}?`)) {
            return;
        }

        setLoading(true);
        const result = await deleteTask(taskId);

        if (result.success) {
            setSuccess('Task deleted successfully!');
            await loadTasks();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await createTask(taskForm);

        if (result.success) {
            setSuccess('Task created successfully!');
            setShowTaskModal(false);
            setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', project: '', assignee: '' });
            await loadTasks();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await updateTask(editingTaskId, taskForm);

        if (result.success) {
            setSuccess('Task updated successfully!');
            setShowTaskModal(false);
            setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', project: '', assignee: '' });
            setIsEditingTask(false);
            setEditingTaskId(null);
            await loadTasks();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const openEditTaskModal = (task) => {
        // Handle both assignee as ID (from assignee field) or as object (from assignee_detail)
        let assigneeId = '';
        if (task.assignee_detail) {
            assigneeId = task.assignee_detail.id;
        } else if (task.assignee) {
            // assignee might be just an ID string or an object
            assigneeId = typeof task.assignee === 'object' ? task.assignee.id : task.assignee;
        }

        setTaskForm({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            due_date: task.due_date ? task.due_date.split('T')[0] : '', // Format date for input
            project: task.project ? task.project.id : '',
            assignee: assigneeId
        });
        setIsEditingTask(true);
        setEditingTaskId(task.id);
        setShowTaskModal(true);
    };

    // Password Reset Management
    const handleApproveReset = async (resetId) => {
        const notes = prompt('Add approval notes (optional):');

        setLoading(true);
        const result = await approvePasswordReset(resetId, notes || '');

        if (result.success) {
            setSuccess('Password reset approved! Token: ' + result.data.token);
            await loadPasswordResets();
            setTimeout(() => setSuccess(''), 5000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleRejectReset = async (resetId) => {
        const notes = prompt('Add rejection reason:');
        if (!notes) return;

        setLoading(true);
        const result = await rejectPasswordReset(resetId, notes);

        if (result.success) {
            setSuccess('Password reset rejected');
            await loadPasswordResets();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    // Format bytes
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesRole = !userFilter.role || user.role === userFilter.role;
        const matchesSearch = !userFilter.search ||
            user.email.toLowerCase().includes(userFilter.search.toLowerCase()) ||
            user.username.toLowerCase().includes(userFilter.search.toLowerCase());
        return matchesRole && matchesSearch;
    });

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesStatus = !taskFilter.status || task.status === taskFilter.status;
        const matchesSearch = !taskFilter.search ||
            task.title.toLowerCase().includes(taskFilter.search.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(taskFilter.search.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1><Shield size={28} style={{ marginRight: '12px' }} /> Control Panel</h1>
                <p>Manage users, monitor system, and review activity logs</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Tabs */}
            <div className="admin-tabs">
                <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    <BarChart size={18} style={{ marginRight: '8px' }} /> Overview
                </button>
                <button
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={18} style={{ marginRight: '8px' }} /> User Directory
                </button>
                <button
                    className={activeTab === 'projects' ? 'active' : ''}
                    onClick={() => setActiveTab('projects')}
                >
                    <Briefcase size={18} style={{ marginRight: '8px' }} /> Projects
                </button>
                <button
                    className={activeTab === 'tasks' ? 'active' : ''}
                    onClick={() => setActiveTab('tasks')}
                >
                    <CheckSquare size={18} style={{ marginRight: '8px' }} /> Tasks
                </button>
                <button
                    className={activeTab === 'password-resets' ? 'active' : ''}
                    onClick={() => setActiveTab('password-resets')}
                >
                    <Key size={18} style={{ marginRight: '8px' }} /> Password Resets
                </button>
                <button
                    className={activeTab === 'logs' ? 'active' : ''}
                    onClick={() => setActiveTab('logs')}
                >
                    <FileText size={18} style={{ marginRight: '8px' }} /> Activity Logs
                </button>
                <button
                    className={activeTab === 'system' ? 'active' : ''}
                    onClick={() => setActiveTab('system')}
                >
                    <Activity size={18} style={{ marginRight: '8px' }} /> System Status
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="admin-content">
                    <h2>System Overview</h2>

                    {systemStatus && (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>Total Users</h3>
                                <div className="stat-value">{systemStatus.statistics.total_users}</div>
                                <div className="stat-detail">
                                    {systemStatus.statistics.active_users} active
                                </div>
                            </div>

                            <div className="stat-card">
                                <h3>Total Tasks</h3>
                                <div className="stat-value">{systemStatus.statistics.total_tasks}</div>
                            </div>

                            <div className="stat-card">
                                <h3>Projects</h3>
                                <div className="stat-value">{systemStatus.statistics.total_projects}</div>
                            </div>

                            <div className="stat-card">
                                <h3>Pending Resets</h3>
                                <div className="stat-value">{systemStatus.statistics.pending_password_resets}</div>
                            </div>

                            <div className="stat-card">
                                <h3>CPU Usage</h3>
                                <div className="stat-value">{systemStatus.system.cpu_percent.toFixed(1)}%</div>
                            </div>

                            <div className="stat-card">
                                <h3>Memory</h3>
                                <div className="stat-value">{systemStatus.system.memory.percent.toFixed(1)}%</div>
                                <div className="stat-detail">
                                    {formatBytes(systemStatus.system.memory.used)} / {formatBytes(systemStatus.system.memory.total)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Task Metrics */}
                    <div className="activity-overview" style={{ marginTop: '2rem' }}>
                        <h3>Task Metrics</h3>
                        <div className="activity-stats">
                            <div className="activity-item">
                                <span className="activity-label">To Do</span>
                                <span className="activity-count" style={{ color: '#ffc107' }}>
                                    {tasks.filter(t => t.status === 'todo').length}
                                </span>
                            </div>
                            <div className="activity-item">
                                <span className="activity-label">In Progress</span>
                                <span className="activity-count" style={{ color: '#17a2b8' }}>
                                    {tasks.filter(t => t.status === 'in_progress').length}
                                </span>
                            </div>
                            <div className="activity-item">
                                <span className="activity-label">Done</span>
                                <span className="activity-count" style={{ color: '#28a745' }}>
                                    {tasks.filter(t => t.status === 'done').length}
                                </span>
                            </div>
                        </div>

                        <div className="role-distribution" style={{ marginTop: '1rem' }}>
                            <h4>Priority Distribution</h4>
                            <div className="role-item">
                                <span>High Priority</span>
                                <span className="role-count" style={{ color: '#dc3545' }}>
                                    {tasks.filter(t => t.priority === 'high').length}
                                </span>
                            </div>
                            <div className="role-item">
                                <span>Medium Priority</span>
                                <span className="role-count" style={{ color: '#ffc107' }}>
                                    {tasks.filter(t => t.priority === 'medium').length}
                                </span>
                            </div>
                            <div className="role-item">
                                <span>Low Priority</span>
                                <span className="role-count" style={{ color: '#28a745' }}>
                                    {tasks.filter(t => t.priority === 'low').length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {activityStats && (
                        <div className="activity-overview">
                            <h3>Activity Summary (Last 7 Days)</h3>
                            <div className="activity-stats">
                                {Object.entries(activityStats.activity_stats.activity_by_type).map(([key, value]) => (
                                    value.count > 0 && (
                                        <div key={key} className="activity-item">
                                            <span className="activity-label">{value.label}</span>
                                            <span className="activity-count">{value.count}</span>
                                        </div>
                                    )
                                ))}
                            </div>

                            {activityStats.role_distribution && (
                                <div className="role-distribution">
                                    <h4>User Role Distribution</h4>
                                    {Object.entries(activityStats.role_distribution).map(([role, data]) => (
                                        <div key={role} className="role-item">
                                            <span>{data.label}</span>
                                            <span className="role-count">{data.count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="admin-content">
                    <div className="section-header">
                        <h2>User Directory ({filteredUsers.length})</h2>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setSelectedUser(null);
                                setUserForm({ email: '', username: '', first_name: '', last_name: '', role: 'MEMBER', password: '' });
                                setShowUserModal(true);
                            }}
                        >
                            <Plus size={16} style={{ marginRight: '8px' }} /> Create New User
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="filters">
                        <input
                            type="text"
                            placeholder="Search by email or username..."
                            value={userFilter.search}
                            onChange={(e) => setUserFilter({ ...userFilter, search: e.target.value })}
                            className="search-input"
                        />
                        <select
                            value={userFilter.role}
                            onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value })}
                            className="filter-select"
                        >
                            <option value="">All Roles</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="MEMBER">Member</option>
                        </select>
                    </div>

                    {/* User Table */}
                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.email}</td>
                                        <td>{user.username}</td>
                                        <td>{user.first_name} {user.last_name}</td>
                                        <td>
                                            <span className={`role-badge role-${user.role.toLowerCase()}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                                {user.is_active ? '✓ Active' : '✗ Inactive'}
                                            </span>
                                        </td>
                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleToggleActive(user)}
                                                    className="btn-sm"
                                                    title={user.is_active ? 'De activate' : 'Activate'}
                                                >
                                                    {user.is_active ? '🔒' : '🔓'}
                                                </button>
                                                <button
                                                    onClick={() => handleChangeRole(user.id, user.role, user.email)}
                                                    className="btn-sm"
                                                    title="Change Role"
                                                >
                                                    🔄
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user.id, user.email)}
                                                    className="btn-sm"
                                                    title="Reset Password"
                                                >
                                                    🔑
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                                    className="btn-sm btn-danger"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="admin-content">
                    <div className="section-header">
                        <h2>Projects ({projects.length})</h2>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setProjectForm({ name: '', description: '', start_date: '', end_date: '' });
                                setShowProjectModal(true);
                            }}
                        >
                            <Plus size={16} style={{ marginRight: '8px' }} /> Create New Project
                        </button>
                    </div>

                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Created By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map(project => (
                                    <tr key={project.id}>
                                        <td>{project.name}</td>
                                        <td>{project.description}</td>
                                        <td>{project.start_date}</td>
                                        <td>{project.end_date}</td>
                                        <td>{project.owner?.username || '-'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleDeleteProject(project.id, project.name)}
                                                    className="btn-sm btn-danger"
                                                    title="Delete Project"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
                <div className="admin-content">
                    <div className="section-header">
                        <h2>All Tasks ({filteredTasks.length})</h2>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setIsEditingTask(false);
                                setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', project: '', assignee: '' });
                                setShowTaskModal(true);
                            }}
                        >
                            <Plus size={16} style={{ marginRight: '8px' }} /> Create New Task
                        </button>
                    </div>

                    <div className="filters">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={taskFilter.search}
                            onChange={(e) => setTaskFilter({ ...taskFilter, search: e.target.value })}
                            className="search-input"
                        />
                        <select
                            value={taskFilter.status}
                            onChange={(e) => setTaskFilter({ ...taskFilter, status: e.target.value })}
                            className="filter-select"
                        >
                            <option value="">All Statuses</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                    </div>

                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Project</th>
                                    <th>Assigned To</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.id}>
                                        <td>{task.title}</td>
                                        <td>{task.project?.name || '-'}</td>
                                        <td>{task.assignee_detail?.username || 'Unassigned'}</td>
                                        <td>
                                            <span className={`status-badge status-${task.status.replace('_', '-')}`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{task.priority}</td>
                                        <td>{task.due_date}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => openEditTaskModal(task)}
                                                    className="btn-sm"
                                                    title="Edit Task"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id, task.title)}
                                                    className="btn-sm btn-danger"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Password Resets Tab */}
            {activeTab === 'password-resets' && (
                <div className="admin-content">
                    <div className="section-header">
                        <h2>Password Reset Requests</h2>
                        <select
                            value={resetFilter}
                            onChange={(e) => {
                                setResetFilter(e.target.value);
                                setTimeout(() => loadPasswordResets(), 0);
                            }}
                            className="filter-select"
                        >
                            <option value="">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Requested</th>
                                    <th>Approved By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {passwordResets.map(reset => (
                                    <tr key={reset.id}>
                                        <td>{reset.user?.email || 'Unknown'}</td>
                                        <td>{reset.reason || '-'}</td>
                                        <td>
                                            <span className={`status-badge status-${reset.status.toLowerCase()}`}>
                                                {reset.status}
                                            </span>
                                        </td>
                                        <td>{new Date(reset.created_at).toLocaleString()}</td>
                                        <td>{reset.approved_by?.email || '-'}</td>
                                        <td>
                                            {reset.status === 'PENDING' && (
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => handleApproveReset(reset.id)}
                                                        className="btn-sm btn-success"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectReset(reset.id)}
                                                        className="btn-sm btn-danger"
                                                    >
                                                        ✗ Reject
                                                    </button>
                                                </div>
                                            )}
                                            {reset.admin_notes && (
                                                <div className="notes">{reset.admin_notes}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
                <div className="admin-content">
                    <h2>Activity Logs</h2>
                    <div className="logs-container">
                        {activityLogs.map(log => (
                            <div key={log.id} className="log-entry">
                                <div className="log-header">
                                    <span className="log-action">{log.action_display}</span>
                                    <span className="log-time">{new Date(log.created_at).toLocaleString()}</span>
                                </div>
                                <div className="log-body">
                                    <p><strong>Admin:</strong> {log.admin_user?.email || 'System'}</p>
                                    {log.target_user && <p><strong>Target:</strong> {log.target_user.email}</p>}
                                    <p>{log.description}</p>
                                    {log.ip_address && <p className="log-meta">IP: {log.ip_address}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* System Status Tab */}
            {activeTab === 'system' && systemStatus && (
                <div className="admin-content">
                    <h2>System Status</h2>

                    <div className="system-info">
                        <div className="info-section">
                            <h3>Server Information</h3>
                            <p><strong>Platform:</strong> {systemStatus.system.platform} {systemStatus.system.platform_version}</p>
                            <p><strong>Python:</strong> {systemStatus.system.python_version}</p>
                            <p><strong>CPU Cores:</strong> {systemStatus.system.cpu_count}</p>
                            <p><strong>Database:</strong> {systemStatus.database.connection} ({formatBytes(systemStatus.database.size)})</p>
                        </div>

                        <div className="info-section">
                            <h3>Resource Usage</h3>
                            <div className="progress-bar">
                                <label>CPU Usage: {systemStatus.system.cpu_percent.toFixed(1)}%</label>
                                <div className="progress">
                                    <div className="progress-fill" style={{ width: `${systemStatus.system.cpu_percent}%` }}></div>
                                </div>
                            </div>

                            <div className="progress-bar">
                                <label>Memory: {systemStatus.system.memory.percent.toFixed(1)}%</label>
                                <div className="progress">
                                    <div className="progress-fill" style={{ width: `${systemStatus.system.memory.percent}%` }}></div>
                                </div>
                            </div>

                            <div className="progress-bar">
                                <label>Disk: {systemStatus.system.disk.percent.toFixed(1)}%</label>
                                <div className="progress">
                                    <div className="progress-fill" style={{ width: `${systemStatus.system.disk.percent}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="info-section">
                            <h3>Recent Activity (24h)</h3>
                            <p><strong>Logins:</strong> {systemStatus.activity.recent_logins_24h}</p>
                            <p><strong>Total Actions:</strong> {systemStatus.activity.recent_activities_24h}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showUserModal && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New User</h2>
                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    value={userForm.username}
                                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        value={userForm.first_name}
                                        onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        value={userForm.last_name}
                                        onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Role *</label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                    required
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    required
                                    minLength="8"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Create Project Modal */}
            {showProjectModal && (
                <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Project</h2>
                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label>Project Name *</label>
                                <input
                                    type="text"
                                    value={projectForm.name}
                                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={projectForm.description}
                                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={projectForm.start_date}
                                        onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={projectForm.end_date}
                                        onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowProjectModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Create/Edit Task Modal */}
            {showTaskModal && (
                <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{isEditingTask ? 'Edit Task' : 'Create New Task'}</h2>
                        <form onSubmit={isEditingTask ? handleUpdateTask : handleCreateTask}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={taskForm.status}
                                        onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={taskForm.due_date}
                                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Project</label>
                                <select
                                    value={taskForm.project}
                                    onChange={(e) => setTaskForm({ ...taskForm, project: e.target.value })}
                                >
                                    <option value="">Select Project...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Assignee</label>
                                <select
                                    value={taskForm.assignee}
                                    onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : (isEditingTask ? 'Update Task' : 'Create Task')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
