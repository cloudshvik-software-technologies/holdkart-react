import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

/* ── Type config ──────────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  ORDER: {
    icon: '📦',
    label: 'Orders',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    dot: '#f59e0b',
  },
  PAYMENT: {
    icon: '💳',
    label: 'Payments',
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#6ee7b7',
    dot: '#10b981',
  },
  CAMPAIGN: {
    icon: '🎯',
    label: 'Deals',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    dot: '#8b5cf6',
  },
  CANCEL: {
    icon: '❌',
    label: 'Cancellations',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fca5a5',
    dot: '#ef4444',
  },
  SYSTEM: {
    icon: 'ℹ️',
    label: 'System',
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#d1d5db',
    dot: '#6b7280',
  },
};

const TABS = [
  { key: 'ALL',      label: 'All' },
  { key: 'ORDER',    label: 'Orders' },
  { key: 'PAYMENT',  label: 'Payments' },
  { key: 'CAMPAIGN', label: 'Deals' },
  { key: 'CANCEL',   label: 'Cancellations' },
];

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)        return 'Just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)    return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDate(notifications) {
  const groups = {};
  notifications.forEach(n => {
    const d = new Date(n.created_date);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let key;
    if (d.toDateString() === today.toDateString()) key = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

/* ── Main component ───────────────────────────────────────────────────── */
export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const d = await notificationService.getNotifications();
      setNotifications(Array.isArray(d) ? d : []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchAll();
  }, [isAuthenticated]);

  const markAllRead = async () => {
    try {
      await notificationService.markRead({});
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await notificationService.markRead({ notificationId: id });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  /* ── Filtered list ── */
  const filtered = notifications.filter(n => {
    const tabMatch = activeTab === 'ALL' || n.type === activeTab;
    const unreadMatch = !showUnreadOnly || !n.is_read;
    return tabMatch && unreadMatch;
  });

  const grouped = groupByDate(filtered);
  const unread  = notifications.filter(n => !n.is_read).length;

  const tabCounts = {};
  TABS.forEach(t => {
    tabCounts[t.key] = t.key === 'ALL'
      ? notifications.filter(n => !n.is_read).length
      : notifications.filter(n => n.type === t.key && !n.is_read).length;
  });

  return (
    <div className="page-wrap" style={{ maxWidth: 860 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>
              Notifications
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: 4 }}>
              {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'You\'re all caught up!'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: '#374151', cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setShowUnreadOnly(v => !v)}
                style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: showUnreadOnly ? '#2a5298' : '#d1d5db',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2,
                  left: showUnreadOnly ? 18 : 2,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              Unread only
            </label>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: '1px solid #2a5298',
                  color: '#2a5298', padding: '6px 14px', borderRadius: 6,
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ✓ Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        borderBottom: '2px solid #e5e7eb', overflowX: 'auto',
        paddingBottom: 0,
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const cnt    = tabCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 16px', fontWeight: active ? 700 : 500,
                fontSize: '0.84rem', color: active ? '#2a5298' : '#6b7280',
                borderBottom: active ? '2px solid #2a5298' : '2px solid transparent',
                marginBottom: -2, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
              {cnt > 0 && (
                <span style={{
                  background: active ? '#2a5298' : '#e5e7eb',
                  color: active ? '#fff' : '#6b7280',
                  borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                  padding: '1px 7px', minWidth: 18, textAlign: 'center',
                }}>
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: '#fff', borderRadius: 10,
              padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, width: '60%' }} />
                <div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, width: '90%' }} />
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4, width: '25%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: '#fff', borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🔔</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
            {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p style={{ color: '#9ca3af', fontSize: '0.84rem' }}>
            {showUnreadOnly ? 'Toggle off "Unread only" to see all.' : "We'll notify you about orders, payments, and deals."}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([dateLabel, items]) => (
          <div key={dateLabel} style={{ marginBottom: 24 }}>
            {/* Date group header */}
            <div style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 8, paddingLeft: 2,
            }}>
              {dateLabel}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(n => {
                const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                const read = !!n.is_read;
                return (
                  <div
                    key={n.id}
                    onClick={() => !read && markRead(n.id)}
                    style={{
                      background: read ? '#fff' : cfg.bg,
                      border: `1px solid ${read ? '#e5e7eb' : cfg.border}`,
                      borderLeft: `4px solid ${read ? '#e5e7eb' : cfg.dot}`,
                      borderRadius: 10,
                      padding: '14px 18px',
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      cursor: read ? 'default' : 'pointer',
                      boxShadow: read ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Icon box */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: read ? '#f9fafb' : cfg.bg,
                      border: `1px solid ${read ? '#e5e7eb' : cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: read ? 500 : 700,
                          color: read ? '#374151' : '#1f2937',
                          lineHeight: 1.3,
                        }}>
                          {n.title}
                        </span>
                        <span style={{
                          fontSize: '0.72rem', color: '#9ca3af',
                          whiteSpace: 'nowrap', flexShrink: 0,
                          marginTop: 2,
                        }}>
                          {timeAgo(n.created_date)}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.82rem', color: '#6b7280',
                        lineHeight: 1.55, marginTop: 4, marginBottom: 0,
                      }}>
                        {n.message}
                      </p>

                      {/* Type chip */}
                      <span style={{
                        display: 'inline-block', marginTop: 8,
                        fontSize: '0.68rem', fontWeight: 700,
                        padding: '2px 8px', borderRadius: 20,
                        background: read ? '#f3f4f6' : cfg.bg,
                        color: read ? '#9ca3af' : cfg.color,
                        border: `1px solid ${read ? '#e5e7eb' : cfg.border}`,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Unread dot */}
                    {!read && (
                      <div style={{
                        width: 9, height: 9, borderRadius: '50%',
                        background: cfg.dot, flexShrink: 0, marginTop: 6,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}