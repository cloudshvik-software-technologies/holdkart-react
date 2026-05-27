import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

// Same logic as ProductCard — relative path so Vite proxy handles it
function resolveImg(raw) {
  if (!raw) return null;
  let url = raw;
  // Unwrap JSON array: '["\/uploads\/products\/x.jpg"]'
  if (String(raw).trimStart().startsWith('[')) {
    try { const arr = JSON.parse(raw); url = arr[0] || null; } catch {}
  }
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return url.startsWith('/uploads')
    ? url.replace('/uploads', '/seller-uploads')
    : `/seller-uploads/${url.replace(/^\//, '')}`;
}

const NoImage = () => (
  <div style={{
    width: '100%', height: '100%',
    background: 'linear-gradient(145deg,#f0f2f5,#e8eaed)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 5,
  }}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#d1d5db"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="#9ca3af"/>
      <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#9ca3af" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
    <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 500 }}>No Image</span>
  </div>
);

function CampaignCard({ c, joined, joining, leaving, onJoin, onLeave }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgSrc = resolveImg(c.image_url);
  const pct    = Math.min(100, Math.round((c.current_hold / c.target) * 100));
  const saved  = Number(c.retail_price) - Number(c.hold_price);
  const barColor = pct >= 75 ? '#16a34a' : '#2a5298';

  return (
    <div style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
      border: joined ? '1.5px solid #2a5298' : '1.5px solid #e5e7eb',
      display: 'flex', transition: 'box-shadow 0.18s, transform 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.11)'; }}
      onMouseLeave={e =>  { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'; }}
    >
      {/* Image — 120×120 square */}
      <div style={{ width: 120, minHeight: 120, flexShrink: 0, background: '#f7f8fa', position: 'relative' }}>
        {!imgFailed && imgSrc
          ? <img src={imgSrc} alt={c.product_name}
              onError={() => setImgFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 120 }} />
          : <NoImage />
        }
        {joined && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: '#16a34a', color: '#fff',
            fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          }}>✓ JOINED</div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>

        {/* Name + Save badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.product_name}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>{c.sellerName}</div>
          </div>
          {saved > 0 && (
            <div style={{ flexShrink: 0, background: '#fef9c3', color: '#92400e', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap' }}>
              Save ₹{saved.toLocaleString()}
            </div>
          )}
        </div>

        {/* Prices */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e3c72' }}>₹{Number(c.hold_price).toLocaleString()}</span>
          <span style={{ fontSize: '0.78rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{Number(c.retail_price).toLocaleString()}</span>
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6b7280', marginBottom: 3 }}>
            <span><b style={{ color: '#1f2937' }}>{c.current_hold}</b> / {c.target} joined</span>
            <span style={{ fontWeight: 600, color: barColor }}>{pct}%</span>
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: 99, height: 5, overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${barColor},${barColor}cc)`, transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Footer: end date + action button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
            {c.end_time ? `Ends ${new Date(c.end_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </span>
          {joined ? (
            <button onClick={() => onLeave(c.id)} disabled={leaving === c.id}
              style={{ background: 'transparent', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 7, padding: '5px 13px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{leaving === c.id ? 'Leaving…' : '✕ Leave'}</button>
          ) : (
            <button onClick={() => onJoin(c.id)} disabled={joining === c.id}
              style={{ background: 'linear-gradient(135deg,#2a5298,#1e3c72)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 16px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >{joining === c.id ? 'Joining…' : '🎯 Join'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [mine, setMine]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('active');
  const [joining, setJoining]     = useState(null);
  const [leaving, setLeaving]     = useState(null);

  const fetchAll = async () => {
    try {
      const c = await campaignService.listCampaigns();
      setCampaigns(Array.isArray(c) ? c : []);
      if (isAuthenticated) {
        const m = await campaignService.getMyCampaigns();
        setMine(Array.isArray(m) ? m : []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [isAuthenticated]);

  const handleJoin = async (id) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setJoining(id);
    try { await campaignService.joinCampaign({ campaignId: id }); toast.success('Joined!'); fetchAll(); }
    catch(e) { toast.error(e?.response?.data?.message || 'Failed to join'); } finally { setJoining(null); }
  };

  const handleLeave = async (id) => {
    if (!confirm('Leave this campaign? Your spot will be released.')) return;
    setLeaving(id);
    try { await campaignService.leaveCampaign({ campaignId: id }); toast.success('Left campaign'); fetchAll(); }
    catch(e) { toast.error(e?.response?.data?.message || 'Failed to leave'); } finally { setLeaving(null); }
  };

  const joinedIds = new Set(mine.map(m => m.campaign_id));

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.35rem', color: '#1f2937', marginBottom: 4 }}>🎯 Hold Deals</h1>
        <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Join group buy campaigns — when the target fills, everyone gets the deal price.</p>
      </div>

      {isAuthenticated && (
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 20 }}>
          {[['active', 'Active Campaigns'], ['mine', `My Campaigns${mine.length ? ` (${mine.length})` : ''}`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 18px', fontWeight: 600, fontSize: '0.85rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === key ? '#2a5298' : '#6b7280',
              borderBottom: tab === key ? '2px solid #2a5298' : '2px solid transparent',
              marginBottom: -2, transition: 'color 0.15s',
            }}>{label}</button>
          ))}
        </div>
      )}

      {loading ? <p style={{ color: '#6b7280' }}>Loading…</p>
      : tab === 'active' ? (
        campaigns.length === 0
          ? <div className="empty-state"><div className="icon">🎯</div><h3>No active campaigns</h3><p>Check back soon!</p></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(400px,1fr))', gap: 12 }}>
              {campaigns.map(c => (
                <CampaignCard key={c.id} c={c} joined={joinedIds.has(c.id)}
                  joining={joining} leaving={leaving} onJoin={handleJoin} onLeave={handleLeave} />
              ))}
            </div>
      ) : (
        mine.length === 0
          ? <div className="empty-state"><div className="icon">🎯</div><h3>No campaigns joined yet</h3><p>Join a campaign for group buy discounts!</p></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(400px,1fr))', gap: 12 }}>
              {mine.map(m => {
                const [imgFailed, setImgFailed] = [false, () => {}]; // static fallback for my-campaigns
                const imgSrc = resolveImg(m.image_url);
                const pct    = Math.min(100, Math.round((m.current_hold / m.target) * 100));
                const isActive = m.campaignStatus === 'ACTIVE';
                return (
                  <div key={m.id} style={{
                    background: '#fff', borderRadius: 12, overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1.5px solid #e5e7eb', display: 'flex',
                  }}>
                    <div style={{ width: 100, minHeight: 100, flexShrink: 0, background: '#f7f8fa' }}>
                      {imgSrc
                        ? <img src={imgSrc} alt={m.product_name}
                            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 100 }} />
                        : null}
                      <NoImage />
                    </div>
                    <div style={{ flex: 1, padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1f2937' }}>{m.product_name}</span>
                        <span className={`badge badge-${m.campaignStatus === 'COMPLETED' ? 'green' : 'blue'}`} style={{ fontSize: '0.65rem' }}>{m.campaignStatus}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#1e3c72', fontSize: '0.92rem' }}>₹{Number(m.hold_price).toLocaleString()}</span>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#6b7280', marginBottom: 3 }}>
                          <span>{m.current_hold} / {m.target} joined</span><span style={{ fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ background: '#e5e7eb', borderRadius: 99, height: 4 }}>
                          <div style={{ width: pct + '%', height: '100%', background: pct >= 100 ? '#16a34a' : '#2a5298', borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Joined {new Date(m.joined_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        {isActive && (
                          <button onClick={() => handleLeave(m.campaign_id)} disabled={leaving === m.campaign_id}
                            style={{ background: 'transparent', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 6, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
                            {leaving === m.campaign_id ? 'Leaving…' : '✕ Leave'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
      )}
    </div>
  );
}