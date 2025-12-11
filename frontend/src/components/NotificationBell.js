import React, { useEffect, useState } from 'react';
import { notificationsAPI } from '../api/notifications';
import './NotificationBell.css';

const NotificationBell = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const load = async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await load();
    }
  };

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    await load();
  };

  const markAll = async () => {
    await notificationsAPI.markAllRead();
    await load();
  };

  return (
    <div className="notif-bell">
      <button className="bell-btn" onClick={toggleOpen} title="Notifications">
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <span>Notifications</span>
            <button className="link-btn" onClick={markAll} disabled={loading || unreadCount === 0}>
              Mark all read
            </button>
          </div>
          <div className="notif-list">
            {loading && <div className="notif-empty">Loading...</div>}
            {!loading && items.length === 0 && <div className="notif-empty">No notifications</div>}
            {!loading &&
              items.map((n) => (
                <div key={n.id} className={`notif-item ${n.is_read ? 'read' : 'unread'}`}>
                  <div className="notif-title">{n.task_title || 'Task'}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-meta">
                    <span>{n.type}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    {!n.is_read && (
                      <button className="link-btn" onClick={() => markRead(n.id)}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

