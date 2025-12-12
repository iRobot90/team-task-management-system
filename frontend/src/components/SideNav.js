import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import { LayoutDashboard, CheckSquare, BarChart3, User, Bell } from 'lucide-react';
import './SideNav.css';

const SideNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/performance', label: 'Performance', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: User },
    // Notifications currently route to dashboard; adjust if you add a dedicated page
    { to: '/dashboard#notifications', label: 'Notifications', icon: Bell },
  ];

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

  return (
    <aside className="sidenav">
      <div className="sidenav-header">
        <div className="sidenav-brand">TTMS</div>
      </div>

      <div className="sidenav-user">
        <div className="sidenav-avatar">{getInitials()}</div>
        <div className="sidenav-user-meta">
          <div className="sidenav-user-email" title={user?.email}>{user?.email}</div>
          <div className="sidenav-user-role">{formatRole()}</div>
        </div>
      </div>

      <nav className="sidenav-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to.split('#')[0];
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: isRouteActive }) =>
                'sidenav-link' + (isActive || isRouteActive ? ' active' : '')
              }
            >
              <Icon size={18} className="sidenav-icon" />
              <span className="sidenav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideNav;
