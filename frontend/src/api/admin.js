import api from './axios';


// Admin - Activity Logs
export const getAdminLogs = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.action) params.append('action', filters.action);
        if (filters.admin_user) params.append('admin_user', filters.admin_user);
        if (filters.target_user) params.append('target_user', filters.target_user);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);

        const url = `/admin/logs/${params.toString() ? '?' + params.toString() : ''}`;
        const response = await api.get(url);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to fetch activity logs'
        };
    }
};

// Admin - System Monitoring
export const getSystemStatus = async () => {
    try {
        const response = await api.get('/admin/system-status/');
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to fetch system status'
        };
    }
};

export const getUserActivityStats = async (days = 7) => {
    try {
        const response = await api.get(`/admin/user-activity-stats/?days=${days}`);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to fetch user activity stats'
        };
    }
};

// Admin - User Management Extended
export const resetUserPassword = async (userId, newPassword) => {
    try {
        const response = await api.post(`/users/${userId}/reset_password/`, {
            new_password: newPassword
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to reset user password'
        };
    }
};

export const activateUser = async (userId) => {
    try {
        const response = await api.post(`/users/${userId}/activate/`);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to activate user'
        };
    }
};

export const deactivateUser = async (userId) => {
    try {
        const response = await api.post(`/users/${userId}/deactivate/`);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to deactivate user'
        };
    }
};

export const changeUserRole = async (userId, newRole) => {
    try {
        const response = await api.post(`/users/${userId}/change_role/`, {
            role: newRole
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to change user role'
        };
    }
};
