import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { USER_ROLE_LABELS } from '../utils/constants';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getProfile();
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = await usersAPI.updateProfile(formData);
      setProfile(data);
      updateUser(data);
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
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
                <span>{profile.phone || 'Not set'}</span>
              </div>
              <div className="info-row">
                <label>Role:</label>
                <span className="role-badge">
                  {USER_ROLE_LABELS[profile.role_name] || profile.role_name || 'No Role'}
                </span>
              </div>
            </div>
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

            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;

