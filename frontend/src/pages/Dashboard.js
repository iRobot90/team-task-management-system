import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../api/tasks';
import { notificationsAPI } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import Loading from '../components/Loading';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const data = await tasksAPI.getStatistics();
        setStatistics(data);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsAPI.list();
      setNotifications(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (err) {
      // ignore dashboard errors
    }
  };

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  const isManager = user?.role === USER_ROLES.MANAGER;

  return (
    <div className="dashboard">
      <h1>{isManager ? 'Manager Dashboard' : 'Dashboard'}</h1>
      <div className="welcome-section">
        <p>Welcome, {user?.username || user?.email}!</p>
        <p className="user-role">Role: {user?.role_display || 'Member'}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{isManager ? 'Team Tasks' : 'Total Tasks'}</h3>
          <p className="stat-number">{statistics?.total || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Todo</h3>
          <p className="stat-number">{statistics?.todo || 0}</p>
        </div>

        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-number">{statistics?.in_progress || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Done</h3>
          <p className="stat-number">{statistics?.done || 0}</p>
        </div>
      </div>

      {statistics?.my_total !== undefined && (
        <div className="my-stats-section">
          <h2>{isManager ? 'Your teamboard' : 'Your workboard'}</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>My Total</h3>
              <p className="stat-number">{statistics.my_total || 0}</p>
            </div>
            <div className="stat-card">
              <h3>My Todo</h3>
              <p className="stat-number">{statistics.my_todo || 0}</p>
            </div>
            <div className="stat-card">
              <h3>My In Progress</h3>
              <p className="stat-number">{statistics.my_in_progress || 0}</p>
            </div>
            <div className="stat-card">
              <h3>My Done</h3>
              <p className="stat-number">{statistics.my_done || 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="notifications-card">
        <h2>Notifications</h2>
        {notifications.length === 0 ? (
          <div className="notif-empty">No notifications</div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;

