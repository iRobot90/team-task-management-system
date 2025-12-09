import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api/users';
import Loading from '../components/Loading';
import { USER_ROLE_LABELS } from '../utils/constants';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getAll();
      setUsers(Array.isArray(data.results) ? data.results : data);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading users..." />;
  }

  return (
    <div className="users-page">
      <h1>Users</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-cell">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>
                    {user.first_name} {user.last_name}
                  </td>
                  <td>
                    <span className="role-badge">
                      {USER_ROLE_LABELS[user.role_name] || user.role_name || 'No Role'}
                    </span>
                  </td>
                  <td>
                    <span className={user.is_active ? 'status-active' : 'status-inactive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;

