import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api/users';
import { notificationsAPI } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { USER_ROLE_LABELS } from '../utils/constants';
import './Profile.css';

const Profile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getProfile();
      console.log('Profile data fetched:', data);
      console.log('Profile role field:', data.role);
      console.log('Profile role_name field:', data.role_name);
      console.log('Profile phone field:', data.phone);
      console.log('Profile phone field type:', typeof data.phone);
      console.log('Profile phone field length:', data.phone ? data.phone.length : 'null');
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationsAPI.list();
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Save button clicked - form submission started');
    setError('');
    setSuccess('');
    setLoading(true); // Set loading to true when saving starts

    // Validate form data
    const firstName = formData.first_name.trim();
    const lastName = formData.last_name.trim();
    const phone = formData.phone.trim();
    
    console.log('Form submission validation:', { firstName, lastName, phone });
    
    if (!firstName && !lastName && !phone) {
      setError('Please provide at least one field to update');
      setLoading(false); // Reset loading if validation fails
      return;
    }

    try {
      // Prepare the payload with only the fields that have values
      const payload = {};
      if (firstName) payload.first_name = firstName;
      if (lastName) payload.last_name = lastName;
      if (phone) payload.phone = phone;
      
      console.log('Final payload being sent:', payload);
      
      // Update profile
      const response = await usersAPI.updateProfile(payload);
      console.log('Profile update API response:', response);
      
      // Ensure we have a valid response
      const updatedProfile = response.data || response;
      
      if (!updatedProfile || typeof updatedProfile !== 'object') {
        throw new Error('Invalid response from server');
      }
      
      console.log('Updated profile data:', updatedProfile);
      
      // Update all states with the new data immediately
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      
      // Update form data with the latest values from server
      setFormData({
        first_name: updatedProfile.first_name || '',
        last_name: updatedProfile.last_name || '',
        phone: updatedProfile.phone || '',
      });
      
      // Force a profile refresh to ensure we have the latest data
      setTimeout(async () => {
        try {
          const freshProfile = await usersAPI.getProfile();
          console.log('Fresh profile data after update:', freshProfile);
          console.log('Fresh phone field:', freshProfile.phone);
          // Update profile state again with fresh data
          setProfile(freshProfile);
          updateUser(freshProfile);
          // Also update form data to ensure consistency
          setFormData({
            first_name: freshProfile.first_name || '',
            last_name: freshProfile.last_name || '',
            phone: freshProfile.phone || '',
          });
        } catch (refreshErr) {
          console.error('Failed to refresh profile:', refreshErr);
        }
      }, 100);
      
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setLoading(false); // Reset loading after successful save
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Profile update error:', err);
      setLoading(false); // Reset loading on error
      
      // Enhanced error handling
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join(', ');
          setError(`Validation error: ${errorMessages}`);
        } else {
          setError(`Validation error: ${errorData}`);
        }
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (err.response?.status === 403) {
        setError('You do not have permission to update this profile.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    }
  };

  if (loading) {
    return <Loading message="Loading profile..." />;
  }

  if (!profile) {
    return <div className="error-container">Failed to load profile</div>;
  }

  return (
    <div className="profile-page">
      <h1>Profile</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-card">
        {!editing ? (
          <>
            <div className="profile-header">
              <h2>Profile Information</h2>
              <button onClick={() => setEditing(true)} className="btn-edit">
                Edit
              </button>
            </div>

            <div className="profile-info">
              <div className="info-row">
                <label>Email:</label>
                <span>{profile.email}</span>
              </div>
              <div className="info-row">
                <label>Username:</label>
                <span>{profile.username}</span>
              </div>
              <div className="info-row">
                <label>First Name:</label>
                <span>{profile.first_name || 'Not set'}</span>
              </div>
              <div className="info-row">
                <label>Last Name:</label>
                <span>{profile.last_name || 'Not set'}</span>
              </div>
              <div className="info-row">
                <label>Phone:</label>
                <span>{(() => {
                  const phoneValue = profile.phone;
                  console.log('Phone display logic:', {
                    phoneValue,
                    phoneType: typeof phoneValue,
                    phoneLength: phoneValue ? phoneValue.length : 'null',
                    phoneTrimmed: phoneValue ? phoneValue.trim() : 'null',
                    phoneDisplay: phoneValue ? phoneValue.trim() || 'Not set' : 'Not set'
                  });
                  return phoneValue ? phoneValue.trim() || 'Not set' : 'Not set';
                })()}</span>
              </div>
              <div className="info-row">
                <label>Role:</label>
                <span className="role-badge">
                  {USER_ROLE_LABELS[profile.role] || USER_ROLE_LABELS[profile.role_name] || profile.role_name || profile.role || 'No Role'}
                </span>
              </div>
            </div>

            {notifications.length > 0 && (
              <div className="notifications">
                <h3>Notifications</h3>
                <ul>
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <div className="notif-title">{n.task_title || 'Task'}</div>
                      <div className="notif-message">{n.message}</div>
                      <div className="notif-meta">
                        <span>{n.type}</span>
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="profile-header">
              <h2>Edit Profile</h2>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    phone: profile.phone || '',
                  });
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;

