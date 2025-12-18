import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  LogOut, 
  Menu, 
  X, 
  Home, 
  FileText, 
  Truck, 
  BarChart3, 
  User, 
  Settings,
  ChevronRight
} from 'lucide-react';
import '../styles/ModernLayout.css';

const ModernLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const getUserDisplayName = (user) => {
    if (!user) return '';
    return user.first_name || user.username || user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = (user) => {
    if (!user) return 'U';
    const name = getUserDisplayName(user);
    return name.charAt(0).toUpperCase();
  };

  const getNavItems = (userRole) => {
    const baseItems = [
      {
        path: '/dashboard',
        icon: <Home size={20} />,
        label: 'Dashboard',
        roles: ['CITIZEN', 'WASTE_COLLECTOR', 'ADMIN']
      },
      {
        path: '/reports',
        icon: <FileText size={20} />,
        label: 'Reports',
        roles: ['CITIZEN', 'WASTE_COLLECTOR', 'ADMIN']
      },
      {
        path: '/collections',
        icon: <Truck size={20} />,
        label: 'Collections',
        roles: ['WASTE_COLLECTOR', 'ADMIN']
      },
      {
        path: '/analytics',
        icon: <BarChart3 size={20} />,
        label: 'Analytics',
        roles: ['ADMIN']
      }
    ];
  };

  const navigationItems = [
    ...getNavItems(user?.role),
    {
      path: '/profile',
      label: 'Profile',
      icon: <User size={20} />,
      roles: [USER_ROLES.ADMIN, USER_ROLES.WASTE_COLLECTOR, USER_ROLES.CITIZEN]
    }
  ];

  const filteredNavigationItems = navigationItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="modern-layout">
      {/* Navbar */}
      <nav className="modern-navbar">
        <div className="modern-navbar-content">
          <div className="modern-navbar-brand">
            <button 
              className="modern-mobile-menu-toggle"
              onClick={toggleMobileSidebar}
            >
              <Menu size={24} />
            </button>
            <Link to="/dashboard" className="modern-navbar-logo">
              EcoWaste Manager
            </Link>
            {/* Desktop Navigation */}
            <div className="modern-navbar-nav">
              {filteredNavigationItems.slice(0, 4).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`modern-nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="modern-navbar-actions">
            <div className="modern-user-welcome">
              Welcome, {getUserDisplayName(user)}
            </div>
            <div className="modern-user-avatar" title={getUserDisplayName(user)}>
              {getUserInitials(user)}
            </div>
            <button className="modern-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="modern-mobile-sidebar-overlay"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`modern-mobile-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="modern-sidebar-toggle">
          <button 
            className="modern-sidebar-toggle-btn"
            onClick={closeMobileSidebar}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modern-sidebar-nav">
          {filteredNavigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`modern-sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={closeMobileSidebar}
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="modern-layout-main">
        {/* Desktop Sidebar */}
        <aside className={`modern-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="modern-sidebar-toggle">
            <button 
              className="modern-sidebar-toggle-btn"
              onClick={toggleSidebar}
            >
              <Menu size={20} />
            </button>
          </div>
          <nav className="modern-sidebar-nav">
            {filteredNavigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`modern-sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="modern-main-content modern-fade-in">
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
            theme="light"
          />
        </main>
      </div>
    </div>
  );
};

export default ModernLayout;
