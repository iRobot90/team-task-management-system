import React, { useEffect, useState, useCallback } from 'react';
import { notificationsAPI } from '../api/notifications';
import { Bell, Clock, AlertCircle, User as UserIcon } from 'lucide-react';
import './NotificationBell.css';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.list();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling to check for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.task) {
      navigate(`/tasks`);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-bell">
      <div className="notification-container">
        <button 
          onClick={toggleDropdown} 
          className={`notification-button ${unreadCount > 0 ? 'has-unread' : ''}`}
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>
        
        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h4>Notifications</h4>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-read">
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="notification-list">
              {loading ? (
                <div className="notification-item loading">
                  <Clock size={16} className="icon" />
                  <span>Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-item empty">
                  <Bell size={16} className="icon" />
                  <span>No notifications yet</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {notification.type === 'task_assigned' ? (
                        <UserIcon size={16} className="icon" />
                      ) : (
                        <AlertCircle size={16} className="icon" />
                      )}
                    </div>
                    <div className="notification-content">
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!notification.is_read && <span className="unread-dot" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="notification-footer">
                <button 
                  className="view-all" 
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationBell;

