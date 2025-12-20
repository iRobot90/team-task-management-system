import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  User,
  Menu,
  X,
  LogOut,
  Shield
} from 'lucide-react';
import './SideNav.css';

const SideNav = ({ isCollapsed = false, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: [USER_ROLES.MANAGER, USER_ROLES.MEMBER]
    },
    {
      to: '/tasks',
      label: 'Tasks',
      icon: CheckSquare,
      roles: [USER_ROLES.MANAGER, USER_ROLES.MEMBER]
    },
    {
      to: '/admin',
      label: 'Control Panel',
      icon: Shield,
      roles: [USER_ROLES.ADMIN]
    },
    {
      to: '/my-performance',
      label: 'My Performance',
      icon: BarChart3,
      roles: [USER_ROLES.MEMBER]
    },
    {
      to: '/team-performance',
      label: 'Team Performance',
      icon: BarChart3,
      roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER]
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
      roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.MEMBER]
    }
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const getInitials = () => {
    if (!user) return '?';
    const name = user.first_name || user.username || user.email || '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const formatRole = () => {
    if (!user?.role) return '';
    if (user.role === USER_ROLES.ADMIN) return 'Admin';
    if (user.role === USER_ROLES.MANAGER) return 'Manager';
    if (user.role === USER_ROLES.MEMBER) return 'Member';
    return user.role;
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const toggleCollapse = () => {
    if (onToggle) {
      onToggle();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path) => {
    if (path.includes('#')) {
      return location.hash === path.split('#')[1];
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={toggleMobileMenu} />
      )}

      <aside className={`sidenav ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidenav-header">
          <div className="sidenav-brand">
            <span className="brand-icon">TT</span>
            {!isCollapsed && <span className="brand-text">TTMS</span>}
          </div>
          <button
            className="collapse-toggle"
            onClick={toggleCollapse}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="sidenav-user">
          <div className="sidenav-avatar">
            {getInitials()}
          </div>
          {!isCollapsed && (
            <div className="sidenav-user-meta">
              <div className="sidenav-user-name" title={user?.first_name || user?.username || user?.email}>
                {user?.first_name || user?.username || user?.email}
              </div>
              <div className="sidenav-user-email" title={user?.email}>
                {user?.email}
              </div>
              <div className="sidenav-user-role">
                {formatRole()}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidenav-nav">
          {filteredNavItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`sidenav-link ${active ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} className="sidenav-icon" />
                {!isCollapsed && (
                  <span className="sidenav-label">{item.label}</span>
                )}
                {active && !isCollapsed && (
                  <div className="active-indicator" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidenav-footer">
          <button
            className="logout-btn"
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut size={20} className="logout-icon" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideNav;
