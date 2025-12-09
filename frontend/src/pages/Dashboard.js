import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, []);

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="welcome-section">
        <p>Welcome, {user?.email}!</p>
        <p className="user-role">Role: {user?.role_display || 'Member'}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Tasks</h3>
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

      {user?.role_name === 'member' && statistics?.my_total !== undefined && (
        <div className="my-stats-section">
          <h2>My Tasks</h2>
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
    </div>
  );
};

export default Dashboard;

