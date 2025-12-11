import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import './Layout.css';
import NotificationBell from './NotificationBell';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">TTMS</Link>
        </div>
        <div className="navbar-menu">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
            Dashboard
          </Link>
          <Link to="/tasks" className={`nav-link ${isActive('/tasks')}`}>
            Tasks
          </Link>
          {user?.role === USER_ROLES.ADMIN && (
            <Link to="/users" className={`nav-link ${isActive('/users')}`}>
              Users
            </Link>
          )}
          <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>
            Profile
          </Link>
        </div>
        <div className="navbar-user">
          <span className="user-name">{user?.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;

