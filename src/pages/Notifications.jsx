import { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { notificationService } from '../services/index.js';
  import { useAuth } from '../context/AuthContext.jsx';
  import toast from 'react-hot-toast';

  const typeIcons = { ORDER: '📦', PAYMENT: '💳', CAMPAIGN: '🎯', SYSTEM: 'ℹ️' };

  export default function Notifications() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
      try { const d = await notificationService.getNotifications(); setNotifications(Array.isArray(d) ? d : []); }
      catch {} finally { setLoading(false); }
    };

    useEffect(() => { if (!isAuthenticated) { navigate('/login'); return; } fetch(); }, [isAuthenticated]);

    const markAllRead = async () => {
      try { await notificationService.markRead({}); fetch(); toast.success('All marked as read'); }
      catch {}
    };

    const markRead = async (id) => {
      try { await notificationService.markRead({ notificationId: id }); fetch(); } catch {}
    };

    const unread = notifications.filter(n => !n.is_read).length;

    return (
      <div className="page-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 className="page-title" style={{ margin: 0 }}>Notifications {unread > 0 && <span className="badge badge-blue" style={{ fontSize: '0.85rem' }}>{unread} new</span>}</h1>
          {unread > 0 && <button className="btn-outline btn-sm" onClick={markAllRead}>Mark All Read</button>}
        </div>

        {loading ? <p>Loading…</p> : notifications.length === 0 ? (
          <div className="empty-state"><div className="icon">🔔</div><h3>No notifications</h3><p>You're all caught up!</p></div>
        ) : notifications.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)} style={{ background: n.is_read ? '#fff' : 'var(--blue-pale)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 12, boxShadow: 'var(--shadow)', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all 0.2s', borderLeft: n.is_read ? 'none' : '4px solid var(--blue)' }}>
            <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{typeIcons[n.type] || '🔔'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.is_read ? 500 : 700, marginBottom: 4 }}>{n.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>{n.message}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 6 }}>{new Date(n.created_date).toLocaleString()}</div>
            </div>
            {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 6 }} />}
          </div>
        ))}
      </div>
    );
  }
  