import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { campaignService, productService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23eef2ff'/%3E%3Crect x='140' y='90' width='120' height='90' rx='10' fill='%23c7d2fe'/%3E%3Ccircle cx='200' cy='115' r='18' fill='%236366f1'/%3E%3Cpath d='M155 175 Q200 130 245 175Z' fill='%236366f1'/%3E%3Ctext x='200' y='225' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%236366f1'%3ENo Image%3C/text%3E%3C/svg%3E";

function resolveImg(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return url.startsWith('/uploads')
    ? url.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${url.startsWith('/') ? '' : '/'}${url}`;
}

function NoImg() {
  return (
    <div style={{
      width: '100%', height: '100%', minHeight: 90,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#eef2ff', color: '#a5b4fc', fontSize: '1.4rem',
    }}>🎯</div>
  );
}

/* ──────────────────────────────────────── Campaign Card ── */
function CampaignCard({ c, joined, joining, leaving, onJoin, onLeave }) {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);
  const imgSrc = resolveImg(c.image_url);
  const pct = Math.min(100, Math.round((c.current_hold / c.target) * 100));
  const saved = Number(c.retail_price) - Number(c.hold_price);
  const barColor = pct >= 100 ? '#16a34a' : pct >= 60 ? '#2a5298' : '#f59e0b';

  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      border: joined ? '2px solid #86efac' : '1.5px solid #e5e7eb',
      display: 'flex', transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: 'pointer',
    }}
      onClick={() => navigate(`/campaigns/${c.id}`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Image */}
      <div style={{ width: 110, minHeight: 110, flexShrink: 0, background: '#f7f8fa', position: 'relative', overflow: 'hidden' }}>
        {imgSrc && !imgFailed
          ? <img src={imgSrc} alt={c.product_name} onError={() => setImgFailed(true)}
              style={{ width: '100%', height: '100%', minHeight: 110, objectFit: 'cover', display: 'block' }} />
          : <NoImg />}
        {joined && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: '#16a34a', color: '#fff',
            fontSize: '0.55rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          }}>JOINED</div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
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

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
            {c.end_time ? `Ends ${new Date(c.end_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </span>
          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
            {joined ? (
              <button onClick={() => onLeave(c.id)} disabled={leaving === c.id}
                style={{ background: 'transparent', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 7, padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >{leaving === c.id ? 'Leaving…' : '✕ Leave'}</button>
            ) : (
              <button onClick={() => onJoin(c.id)} disabled={joining === c.id}
                style={{ background: 'linear-gradient(135deg,#2a5298,#1e3c72)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 16px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >{joining === c.id ? 'Joining…' : '🎯 Join Deal'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────── Start Campaign Form ── */
function StartCampaignTab() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [starting, setStarting] = useState(false);
  const [started, setStarted]   = useState(null);
  const debounceRef = useRef(null);

  const search = (q) => {
    setQuery(q);
    setSelected(null);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await campaignService.searchProducts(q);
        const arr = Array.isArray(res) ? res : (res?.products || res?.data || []);
        setResults(arr.slice(0, 12));
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const handleStart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selected) { toast.error('Please select a product'); return; }
    setStarting(true);
    try {
      const res = await campaignService.startCampaign({ productId: selected.productId });
      toast.success('Group deal started successfully!');
      setStarted(res);
      setSelected(null);
      setQuery('');
      setResults([]);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not start campaign for this product');
    } finally { setStarting(false); }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg,#1e3c72,#2a5298)', borderRadius: 14,
        padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-start',
      }}>
        <div style={{ fontSize: '2rem', flexShrink: 0 }}>🎯</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Start a Group Deal</div>
          <div style={{ color: '#93c5fd', fontSize: '0.82rem', lineHeight: 1.5 }}>
            Search for a product below and kick off a group deal campaign. The seller has pre-set the required group size and discount price.
            Once enough people join, everyone gets the deal price automatically.
          </div>
        </div>
      </div>

      {/* Success State */}
      {started && (
        <div style={{
          background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12,
          padding: '20px 24px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '1rem', marginBottom: 6 }}>Group deal started!</div>
          <div style={{ color: '#374151', fontSize: '0.85rem', marginBottom: 14 }}>
            Share this campaign with friends to fill it up faster and unlock the discount.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => navigate('/campaigns')}
              style={{ padding: '9px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              View All Campaigns
            </button>
            <button onClick={() => setStarted(null)}
              style={{ padding: '9px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Start Another
            </button>
          </div>
        </div>
      )}

      {/* Search Box */}
      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: 8, color: '#374151' }}>
          Search for a product
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text" value={query} onChange={e => search(e.target.value)}
            placeholder="Type product name…"
            style={{
              width: '100%', padding: '11px 40px 11px 14px',
              border: '1.5px solid #e5e7eb', borderRadius: 10,
              fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#2a5298'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
          {searching && (
            <div style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 16, height: 16, border: '2px solid #e5e7eb', borderTopColor: '#2a5298',
              borderRadius: '50%', animation: 'hk-spin 0.7s linear infinite',
            }} />
          )}
        </div>

        {/* Results */}
        {results.length > 0 && !selected && (
          <div style={{ marginTop: 10, border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            {results.map((p, i) => {
              const imgSrc = resolveImg(p.imageUrl) || FALLBACK_IMG;
              return (
                <div key={p.productId} onClick={() => { setSelected(p); setResults([]); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none',
                    background: '#fff', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <img src={imgSrc} alt={p.name} onError={e => e.target.src = FALLBACK_IMG}
                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 7, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.87rem', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '0.73rem', color: '#9ca3af', marginTop: 1 }}>{p.category}</div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e3c72' }}>₹{Number(p.retailPrice).toLocaleString()}</div>
                    {p.holdPrice && p.holdPrice < p.retailPrice && (
                      <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>
                        Deal: ₹{Number(p.holdPrice).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {query && !searching && results.length === 0 && !selected && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: '0.85rem' }}>
            No products found for "{query}"
          </div>
        )}
      </div>

      {/* Selected Product Preview */}
      {selected && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 14, color: '#374151' }}>Selected Product</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
            <img
              src={resolveImg(selected.imageUrl) || FALLBACK_IMG}
              alt={selected.name} onError={e => e.target.src = FALLBACK_IMG}
              style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937', marginBottom: 2 }}>{selected.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 6 }}>{selected.category}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e3c72' }}>₹{Number(selected.retailPrice).toLocaleString()}</span>
                {selected.holdPrice && selected.holdPrice < selected.retailPrice && (
                  <>
                    <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>→ Group deal:</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#16a34a' }}>₹{Number(selected.holdPrice).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
            <button onClick={() => { setSelected(null); setQuery(''); }}
              style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Change
            </button>
          </div>

          <div style={{ background: '#eef2ff', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '0.8rem', color: '#3730a3', lineHeight: 1.6 }}>
            The seller has defined the group target and deal price for this product. Your campaign will go live immediately and others can join.
          </div>

          <button onClick={handleStart} disabled={starting}
            style={{
              width: '100%', padding: '13px',
              background: starting ? '#e5e7eb' : 'linear-gradient(135deg,#2a5298,#1e3c72)',
              color: starting ? '#9ca3af' : '#fff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: '0.95rem', cursor: starting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: starting ? 'none' : '0 4px 16px rgba(42,82,152,0.3)',
            }}>
            {starting ? 'Starting Campaign…' : 'Start Group Deal Campaign'}
          </button>
        </div>
      )}

      {/* How it works mini-guide */}
      <div className="card" style={{ background: '#f9fafb' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: 14 }}>How it works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '🔍', title: 'You start the campaign', desc: 'Pick a product and launch the group deal. You automatically join as the first member.' },
            { icon: '📣', title: 'Share with friends', desc: 'Copy the campaign link and spread the word. More members = deal unlocks faster.' },
            { icon: '🎉', title: 'Target reached', desc: 'Once the seller-set target fills up, everyone pays the group deal price.' },
          ].map(s => (
            <div key={s.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 1 }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#1f2937', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: '0.77rem', color: '#6b7280', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────── Main Page ── */
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
    try { await campaignService.joinCampaign({ campaignId: id }); toast.success('Joined the group deal!'); fetchAll(); }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed to join'); } finally { setJoining(null); }
  };

  const handleLeave = async (id) => {
    if (!window.confirm('Leave this campaign? Your spot will be released.')) return;
    setLeaving(id);
    try { await campaignService.leaveCampaign({ campaignId: id }); toast.success('Left campaign'); fetchAll(); }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed to leave'); } finally { setLeaving(null); }
  };

  const joinedIds = new Set(mine.map(m => m.campaign_id));

  const TABS = [
    { key: 'active', label: 'Active Campaigns' },
    { key: 'mine',   label: `My Campaigns${mine.length ? ` (${mine.length})` : ''}` },
    { key: 'start',  label: '+ Start Campaign' },
  ];

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1f2937', marginBottom: 4 }}>Hold Deals</h1>
        <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
          Join group buy campaigns — when the target fills, everyone gets the deal price.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24, gap: 0, overflowX: 'auto' }}>
        {(isAuthenticated ? TABS : TABS.slice(0, 1)).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '10px 20px', fontWeight: 600, fontSize: '0.87rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === key ? '#2a5298' : '#6b7280',
            borderBottom: tab === key ? '2.5px solid #2a5298' : '2.5px solid transparent',
            marginBottom: -2, transition: 'color 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
          }}>{label}</button>
        ))}
        {!isAuthenticated && (
          <button onClick={() => navigate('/login')} style={{
            padding: '10px 20px', fontWeight: 600, fontSize: '0.87rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7280', borderBottom: '2.5px solid transparent', marginBottom: -2, fontFamily: 'inherit',
          }}>
            Sign in to join
          </button>
        )}
      </div>

      {/* Tab: Active Campaigns */}
      {tab === 'active' && (
        loading
          ? <p style={{ color: '#6b7280' }}>Loading campaigns…</p>
          : campaigns.length === 0
            ? (
              <div className="empty-state">
                <div className="icon">🎯</div>
                <h3>No active campaigns</h3>
                <p>Be the first to start one!</p>
                {isAuthenticated && (
                  <button onClick={() => setTab('start')} style={{
                    marginTop: 16, padding: '10px 28px',
                    background: 'linear-gradient(135deg,#2a5298,#1e3c72)',
                    color: '#fff', border: 'none', borderRadius: 8,
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit',
                  }}>Start a Group Deal</button>
                )}
              </div>
            )
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 14 }}>
                {campaigns.map(c => (
                  <CampaignCard key={c.id} c={c} joined={joinedIds.has(c.id)}
                    joining={joining} leaving={leaving} onJoin={handleJoin} onLeave={handleLeave} />
                ))}
              </div>
            )
      )}

      {/* Tab: My Campaigns */}
      {tab === 'mine' && isAuthenticated && (
        loading
          ? <p style={{ color: '#6b7280' }}>Loading…</p>
          : mine.length === 0
            ? (
              <div className="empty-state">
                <div className="icon">🎯</div>
                <h3>No campaigns joined yet</h3>
                <p>Browse active campaigns and join one for a group discount!</p>
                <button onClick={() => setTab('active')} style={{
                  marginTop: 16, padding: '10px 28px',
                  background: 'linear-gradient(135deg,#2a5298,#1e3c72)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit',
                }}>Browse Campaigns</button>
              </div>
            )
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 14 }}>
                {mine.map(m => {
                  const imgSrc = resolveImg(m.image_url);
                  const pct    = Math.min(100, Math.round((m.current_hold / m.target) * 100));
                  const isActive = m.campaignStatus === 'ACTIVE';
                  return (
                    <div key={m.id}
                      onClick={() => navigate(`/campaigns/${m.campaign_id}`)}
                      style={{
                        background: '#fff', borderRadius: 14, overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                        border: '1.5px solid #86efac', display: 'flex', cursor: 'pointer',
                        transition: 'box-shadow 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'}
                    >
                      <div style={{ width: 100, minHeight: 100, flexShrink: 0, background: '#f7f8fa' }}>
                        {imgSrc
                          ? <img src={imgSrc} alt={m.product_name} onError={e => e.target.style.display = 'none'}
                              style={{ width: '100%', height: '100%', minHeight: 100, objectFit: 'cover', display: 'block' }} />
                          : <NoImg />}
                      </div>
                      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
                            {m.product_name}
                          </span>
                          <span className={`badge badge-${m.campaignStatus === 'COMPLETED' ? 'green' : 'blue'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                            {m.campaignStatus}
                          </span>
                        </div>
                        <span style={{ fontWeight: 800, color: '#1e3c72', fontSize: '0.92rem' }}>₹{Number(m.hold_price).toLocaleString()}</span>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#6b7280', marginBottom: 3 }}>
                            <span>{m.current_hold} / {m.target} joined</span>
                            <span style={{ fontWeight: 600 }}>{pct}%</span>
                          </div>
                          <div style={{ background: '#e5e7eb', borderRadius: 99, height: 4 }}>
                            <div style={{ width: pct + '%', height: '100%', background: pct >= 100 ? '#16a34a' : '#2a5298', borderRadius: 99 }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                            Joined {new Date(m.joined_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          {isActive && (
                            <button
                              onClick={e => { e.stopPropagation(); handleLeave(m.campaign_id); }}
                              disabled={leaving === m.campaign_id}
                              style={{ background: 'transparent', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 6, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                              {leaving === m.campaign_id ? 'Leaving…' : '✕ Leave'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
      )}

      {/* Tab: Start Campaign */}
      {tab === 'start' && isAuthenticated && <StartCampaignTab />}

      <style>{`@keyframes hk-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
