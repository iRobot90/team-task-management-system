import api from './axios';


// Password Reset APIs
export const requestPasswordReset = async (email, reason = '') => {
    try {
        const response = await api.post('/auth/password-reset/request/', {
            user_email: email,
            reason: reason
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || error.response?.data || 'Failed to request password reset'
        };
    }
};

export const checkResetStatus = async (requestId) => {
    try {
        const response = await api.get(`/auth/password-reset/status/${requestId}/`);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to check reset status'
        };
    }
};

export const confirmPasswordReset = async (token, newPassword, confirmPassword) => {
    try {
        const response = await api.post('/auth/password-reset/confirm/', {
            token,
            new_password: newPassword,
            confirm_password: confirmPassword
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || error.response?.data || 'Failed to reset password'
        };
    }
};

// Admin - Password Reset Management
export const getPendingPasswordResets = async () => {
    try {
        const response = await api.get('/admin/password-resets/?status=PENDING');
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to fetch password resets'
        };
    }
};

export const getAllPasswordResets = async (status = null) => {
    try {
        const url = status ? `/admin/password-resets/?status=${status}` : '/admin/password-resets/';
        const response = await api.get(url);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to fetch password resets'
        };
    }
};

export const approvePasswordReset = async (requestId, adminNotes = '') => {
    try {
        const response = await api.post(`/admin/password-resets/${requestId}/approve/`, {
            action: 'approve',
            admin_notes: adminNotes
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to approve password reset'
        };
    }
};

export const rejectPasswordReset = async (requestId, adminNotes = '') => {
    try {
        const response = await api.post(`/admin/password-resets/${requestId}/reject/`, {
            action: 'reject',
            admin_notes: adminNotes
        });
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to reject password reset'
        };
    }
};
