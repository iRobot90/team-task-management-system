import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideNav from './SideNav';
import NotificationBell from './NotificationBell';
import { LogOut } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSideNav = () => {
    setIsSideNavCollapsed(!isSideNavCollapsed);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="layout">
      <nav className="navbar navbar-shifted">
        {/* Left - Brand */}
        <div className="navbar-left">
          {(user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.MEMBER) && (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/tasks" className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}>
                Tasks
              </Link>
            </>
          )}
          {(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER) && (
            <Link to="/team-performance" className={`nav-link ${isActive('/team-performance') ? 'active' : ''}`}>
              Team Performance
            </Link>
          )}
          {user?.role === USER_ROLES.MEMBER && (
            <Link to="/my-performance" className={`nav-link ${isActive('/my-performance') ? 'active' : ''}`}>
              My Performance
            </Link>
          )}
          <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
            Profile
          </Link>
        </div>

        {/* Right - User actions */}
        <div className="navbar-right">
          <div className="user-welcome">
            Welcome, {user?.first_name || user?.username || user?.email?.split('@')[0]}
          </div>
          <div className="user-actions">
            <NotificationBell />
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="layout-main">
        <SideNav isCollapsed={isSideNavCollapsed} onToggle={toggleSideNav} />
        <main className="main-content">
          {children}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </main>
      </div>
    </div>
  );
};

export default Layout;
