import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f4f8'/%3E%3Crect x='60' y='55' width='80' height='70' rx='8' fill='%23d1d9e6'/%3E%3Ccircle cx='100' cy='80' r='16' fill='%23a0aec0'/%3E%3Cpath d='M68 122 Q100 95 132 122Z' fill='%23a0aec0'/%3E%3C/svg%3E";

function resolveImg(url) {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith('http')) return url;
  return url.startsWith('/uploads')
    ? url.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${url.startsWith('/') ? '' : '/'}${url}`;
}

const STATUS_META = {
  ACTIVE:    { label: 'Active',    bg: '#dcfce7', color: '#15803d', dot: '#16a34a' },
  COMPLETED: { label: 'Completed', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  CANCELLED: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.bg, color: m.color,
      fontSize: '0.72rem', fontWeight: 700,
      padding: '3px 9px', borderRadius: 3,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function ProgressBar({ current, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const color = pct >= 100 ? '#16a34a' : pct >= 60 ? '#2a5298' : '#f59e0b';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 4 }}>
        <span style={{ color: '#6b7280' }}>
          <b style={{ color: '#0f1111', fontWeight: 700 }}>{current}</b> / {target} members joined
        </span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 99,
          background: color, transition: 'width 0.4s',
        }} />
      </div>
    </div>
  );
}

function CampaignRow({ item, leaving, onLeave }) {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);
  const src = imgErr ? FALLBACK_IMG : resolveImg(item.image_url);

  const retailPrice  = Number(item.retail_price  || 0);
  const holdPrice    = Number(item.hold_price     || 0);
  const currentHold  = Number(item.current_hold   || 0);
  const target       = Number(item.target         || 0);
  const status       = item.campaignStatus || 'ACTIVE';

  /* discount = currentHold % off (N joined = N% off) */
  const safeHold     = Math.min(currentHold, target);
  const discountPct  = safeHold;
  const effectivePrice = discountPct > 0
    ? Math.round(retailPrice * (1 - discountPct / 100))
    : retailPrice;
  const maxDiscountPct  = target;
  const bestPrice       = Math.round(retailPrice * (1 - maxDiscountPct / 100));
  const joined_date     = item.joined_date
    ? new Date(item.joined_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '88px 1fr',
      gap: 16,
      padding: '20px',
      borderBottom: '1px solid #e5e7eb',
      background: '#fff',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
    >
      {/* Image */}
      <div
        onClick={() => navigate(`/product/${item.product_id}`)}
        style={{ cursor: 'pointer', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', background: '#f9fafb', height: 88, flexShrink: 0 }}
      >
        <img
          src={src} alt={item.product_name}
          onError={() => setImgErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: 4 }}
        />
      </div>

      {/* Content */}
      <div style={{ minWidth: 0 }}>
        {/* Top row: name + status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
          <p
            onClick={() => navigate(`/product/${item.product_id}`)}
            style={{
              fontWeight: 400, fontSize: '0.97rem', color: '#007185',
              cursor: 'pointer', margin: 0, lineHeight: 1.35,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}
          >
            {item.product_name}
          </p>
          <StatusBadge status={status} />
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b12704' }}>
            ₹{effectivePrice.toLocaleString('en-IN')}
          </span>
          {discountPct > 0 && (
            <>
              <span style={{ fontSize: '0.82rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                ₹{retailPrice.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#007600' }}>
                {discountPct}% off (group)
              </span>
            </>
          )}
        </div>

        {/* Best price pill */}
        {target > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#f0f4ff', border: '1px solid #c7d8f8',
            borderRadius: 3, padding: '3px 9px', fontSize: '0.71rem',
            color: '#1e3c72', marginBottom: 10,
          }}>
            🏆 Best price at {target} members:&nbsp;
            <b style={{ color: '#007600' }}>₹{bestPrice.toLocaleString('en-IN')} ({maxDiscountPct}% off)</b>
          </div>
        )}

        {/* Progress bar */}
        <div style={{ marginBottom: 10 }}>
          <ProgressBar current={currentHold} target={target} />
        </div>

        {/* Bottom row: joined date + leave button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {joined_date && (
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Joined on {joined_date}</span>
          )}
          {status === 'ACTIVE' && (
            <button
              onClick={() => onLeave(item.campaign_id)}
              disabled={leaving === item.campaign_id}
              style={{
                padding: '5px 14px',
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: leaving === item.campaign_id ? '#9ca3af' : '#dc2626',
                cursor: leaving === item.campaign_id ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { if (leaving !== item.campaign_id) e.currentTarget.style.borderColor = '#dc2626'; }}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}
            >
              {leaving === item.campaign_id ? 'Leaving…' : 'Leave Deal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════
   MAIN PAGE
══════════════════════════════ */
export default function Campaigns() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mine, setMine]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(null);
  const [filter, setFilter]   = useState('ALL');

  const fetchMine = async () => {
    try {
      const m = await campaignService.getMyCampaigns();
      setMine(Array.isArray(m) ? m : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated) { fetchMine(); }
    else { setLoading(false); }
  }, [isAuthenticated]);

  const handleLeave = async (campaignId) => {
    if (!window.confirm('Leave this group deal? Your spot will be released.')) return;
    setLeaving(campaignId);
    try {
      await campaignService.leaveCampaign({ campaignId });
      toast.success('Left the group deal');
      fetchMine();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to leave');
    } finally { setLeaving(null); }
  };

  const filters = [
    { key: 'ALL',       label: 'All' },
    { key: 'ACTIVE',    label: 'Active' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  const filtered = filter === 'ALL' ? mine : mine.filter(m => m.campaignStatus === filter);
  const activeCount    = mine.filter(m => m.campaignStatus === 'ACTIVE').length;
  const completedCount = mine.filter(m => m.campaignStatus === 'COMPLETED').length;

  /* ── Not signed in ── */
  if (!isAuthenticated) return (
    <div style={{ background: '#f4f6fa', minHeight: '100vh', paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: '0 16px' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontWeight: 700, color: '#0f1111', marginBottom: 8 }}>Sign in to view your deals</h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 24 }}>
          Your joined group deals will appear here.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '10px 32px', background: '#f0c14b', border: '1px solid #a88734', borderRadius: 4, fontWeight: 700, color: '#111', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f4f6fa', minHeight: '100vh', paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 400, color: '#0f1111', marginBottom: 4 }}>
            My Group Deals
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>
            Campaigns you've joined — track progress and pricing in real time.
          </p>
        </div>

        {/* ── Summary cards ── */}
        {!loading && mine.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Joined', value: mine.length, icon: '🤝', color: '#2a5298' },
              { label: 'Active Deals', value: activeCount, icon: '⚡', color: '#007600' },
              { label: 'Completed',    value: completedCount, icon: '✅', color: '#1e40af' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: '1.6rem' }}>{s.icon}</span>
                <div>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter tabs ── */}
        {!loading && mine.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px 4px 0 0', borderBottom: 'none', display: 'flex', padding: '0 20px', gap: 0 }}>
            {filters.map(f => {
              const count = f.key === 'ALL' ? mine.length : mine.filter(m => m.campaignStatus === f.key).length;
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '13px 18px',
                    background: 'none',
                    border: 'none',
                    borderBottom: active ? '2px solid #2a5298' : '2px solid transparent',
                    fontWeight: active ? 700 : 400,
                    fontSize: '0.85rem',
                    color: active ? '#0f1111' : '#6b7280',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                    marginBottom: -1,
                  }}
                >
                  {f.label} {count > 0 && <span style={{ color: active ? '#2a5298' : '#9ca3af', fontSize: '0.78rem' }}>({count})</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          /* Skeleton */
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 16, padding: 20, borderBottom: i < 3 ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ height: 88, background: '#f0f0f0', borderRadius: 4, animation: 'hk-skel 1.4s ease-in-out infinite' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ height: 16, width: '60%', background: '#f0f0f0', borderRadius: 4, animation: 'hk-skel 1.4s ease-in-out infinite' }} />
                  <div style={{ height: 12, width: '40%', background: '#f0f0f0', borderRadius: 4, animation: 'hk-skel 1.4s ease-in-out infinite' }} />
                  <div style={{ height: 6, width: '100%', background: '#f0f0f0', borderRadius: 99, animation: 'hk-skel 1.4s ease-in-out infinite' }} />
                </div>
              </div>
            ))}
            <style>{`@keyframes hk-skel{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
          </div>
        ) : mine.length === 0 ? (
          /* Empty */
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🤝</div>
            <h2 style={{ fontWeight: 700, color: '#0f1111', marginBottom: 8, fontSize: '1.1rem' }}>No group deals yet</h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
              Join a group deal on any product page and track your savings progress right here.
            </p>
            <button
              onClick={() => navigate('/products')}
              style={{ padding: '10px 28px', background: '#f0c14b', border: '1px solid #a88734', borderRadius: 4, fontWeight: 700, color: '#111', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Browse Products
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty filtered */
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0 0 4px 4px', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No {filter.toLowerCase()} deals found.</p>
          </div>
        ) : (
          /* Campaign list */
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: mine.length > 0 ? '0 0 4px 4px' : 4, overflow: 'hidden' }}>
            {/* List header */}
            <div style={{ padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>
                {filtered.length} deal{filtered.length !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                More members joined = lower price for you
              </span>
            </div>

            {filtered.map((item, idx) => (
              <CampaignRow
                key={item.campaign_id || idx}
                item={item}
                leaving={leaving}
                onLeave={handleLeave}
              />
            ))}

            {/* Footer CTA */}
            <div style={{ padding: '16px 20px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Want more savings?</span>
              <button
                onClick={() => navigate('/products')}
                style={{ padding: '7px 18px', background: '#2a5298', border: 'none', borderRadius: 4, color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Join More Deals →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
