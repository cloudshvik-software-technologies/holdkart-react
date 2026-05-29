import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23eef2ff'/%3E%3Crect x='220' y='110' width='160' height='130' rx='14' fill='%23c7d2fe'/%3E%3Ccircle cx='300' cy='148' r='26' fill='%236366f1'/%3E%3Ctext x='300' y='315' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%236366f1'%3ENo Image%3C/text%3E%3C/svg%3E";

function resolveImg(url) {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith('http')) return url;
  const n = url.startsWith('/uploads')
    ? url.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${url.startsWith('/') ? '' : '/'}${url}`;
  return n;
}

function useCountdown(endTime) {
  const calc = useCallback(() => {
    if (!endTime) return null;
    const diff = new Date(endTime) - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, expired: false };
  }, [endTime]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    setTime(calc());
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);
  return time;
}

function CountdownBox({ label, value }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#1e3c72,#2a5298)',
      borderRadius: 10, padding: '12px 16px', textAlign: 'center', minWidth: 64,
    }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: '0.65rem', color: '#93c5fd', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}

function ProgressRing({ pct }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const color = pct >= 100 ? '#16a34a' : pct >= 60 ? '#2a5298' : '#f59e0b';
  return (
    <svg width={130} height={130} viewBox="0 0 130 130">
      <circle cx={65} cy={65} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
      <circle
        cx={65} cy={65} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 65 65)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={65} y={60} textAnchor="middle" fontSize={22} fontWeight={800} fill={color}>
        {Math.min(pct, 100)}%
      </text>
      <text x={65} y={80} textAnchor="middle" fontSize={11} fill="#6b7280">
        filled
      </text>
    </svg>
  );
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [joined, setJoined]     = useState(false);
  const [acting, setActing]     = useState(false);
  const [imgError, setImgError] = useState(false);

  const countdown = useCountdown(campaign?.end_time);

  const load = useCallback(async () => {
    try {
      const data = await campaignService.getCampaignById(id);
      setCampaign(data);
      if (isAuthenticated) {
        const mine = await campaignService.getMyCampaigns();
        const ids  = new Set((Array.isArray(mine) ? mine : []).map(m => String(m.campaign_id)));
        setJoined(ids.has(String(id)));
      }
    } catch {
      toast.error('Campaign not found');
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setActing(true);
    try {
      await campaignService.joinCampaign({ campaignId: Number(id) });
      toast.success('You joined the group deal!');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to join');
    } finally { setActing(false); }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this campaign? Your spot will be released.')) return;
    setActing(true);
    try {
      await campaignService.leaveCampaign({ campaignId: Number(id) });
      toast.success('Left campaign');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to leave');
    } finally { setActing(false); }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: campaign?.product_name, text: `Join this group deal on HoldKart!`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
    }
  };

  if (loading) return (
    <div className="page-wrap">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#2a5298', borderRadius: '50%', animation: 'hk-spin 0.7s linear infinite' }} />
      </div>
    </div>
  );

  if (!campaign) return null;

  const pct      = Math.min(100, Math.round((campaign.current_hold / campaign.target) * 100));
  const saved    = Number(campaign.retail_price) - Number(campaign.hold_price);
  const imgSrc   = imgError ? FALLBACK_IMG : resolveImg(campaign.image_url);
  const isActive = campaign.status === 'ACTIVE' || !campaign.status;
  const isFull   = pct >= 100;

  return (
    <div className="page-wrap">

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#9ca3af', marginBottom: 20 }}>
        <Link to="/campaigns" style={{ color: '#2a5298', fontWeight: 600, textDecoration: 'none' }}>Hold Deals</Link>
        <span>/</span>
        <span style={{ color: '#374151' }}>{campaign.product_name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Product Image + Info Card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
              <div style={{ width: 260, minHeight: 240, flexShrink: 0, background: '#f7f8fa', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={imgSrc} alt={campaign.product_name}
                  onError={() => setImgError(true)}
                  style={{ width: '100%', height: '100%', minHeight: 240, objectFit: 'cover', display: 'block' }}
                />
                {isFull && (
                  <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: '#16a34a', color: '#fff',
                    borderRadius: 6, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700,
                  }}>TARGET REACHED</div>
                )}
              </div>
              <div style={{ flex: 1, padding: '24px 28px', minWidth: 220 }}>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Group Deal
                </div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>
                  {campaign.product_name}
                </h1>
                {campaign.sellerName && (
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 16 }}>by {campaign.sellerName}</div>
                )}

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3c72' }}>
                    ₹{Number(campaign.hold_price).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                    ₹{Number(campaign.retail_price).toLocaleString()}
                  </span>
                </div>

                {saved > 0 && (
                  <div style={{
                    display: 'inline-block', background: '#fef9c3', color: '#92400e',
                    borderRadius: 6, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, marginBottom: 16,
                  }}>
                    Save ₹{saved.toLocaleString()} ({Math.round((saved / campaign.retail_price) * 100)}% off)
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  <button
                    onClick={handleShare}
                    style={{
                      background: '#f3f4f6', color: '#374151', border: 'none',
                      borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Share Deal
                  </button>
                  <Link to={`/product/${campaign.product_id || campaign.productId}`}
                    style={{
                      background: 'transparent', color: '#2a5298', border: '1.5px solid #2a5298',
                      borderRadius: 8, padding: '7px 16px', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit',
                      display: 'inline-flex', alignItems: 'center',
                    }}
                  >
                    View Product
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 16, color: '#1f2937' }}>How Group Deals Work</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[
                { step: '1', title: 'Join the deal', desc: 'Click join to reserve your spot at the group price.' },
                { step: '2', title: 'Spread the word', desc: 'Share with friends — more members means the deal activates faster.' },
                { step: '3', title: 'Get the discount', desc: 'Once the target is reached, everyone pays the group deal price.' },
              ].map(s => (
                <div key={s.step} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#2a5298,#1e3c72)',
                    color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 10px',
                  }}>{s.step}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1f2937', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 100 }}>

          {/* Progress Card */}
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <ProgressRing pct={pct} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3c72' }}>{campaign.current_hold}</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Joined</div>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#374151' }}>{campaign.target}</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Target</div>
              </div>
              <div style={{ width: 1, background: '#e5e7eb' }} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>
                  {Math.max(0, campaign.target - campaign.current_hold)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Remaining</div>
              </div>
            </div>

            {/* Countdown */}
            {countdown && !countdown.expired && campaign.end_time && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center', marginBottom: 10, fontWeight: 600 }}>
                  TIME REMAINING
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {countdown.d > 0 && <CountdownBox label="Days" value={countdown.d} />}
                  <CountdownBox label="Hours" value={countdown.h} />
                  <CountdownBox label="Min"   value={countdown.m} />
                  <CountdownBox label="Sec"   value={countdown.s} />
                </div>
              </div>
            )}
            {countdown?.expired && (
              <div style={{ background: '#fef2f2', borderRadius: 8, padding: '10px', textAlign: 'center', color: '#dc2626', fontWeight: 600, fontSize: '0.85rem', marginBottom: 16 }}>
                This campaign has ended
              </div>
            )}

            {/* Action Button */}
            {isActive && (
              joined ? (
                <div>
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', textAlign: 'center', marginBottom: 12 }}>
                    <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>You are in this deal!</div>
                    <div style={{ color: '#4ade80', fontSize: '0.75rem' }}>Your spot is reserved at the deal price.</div>
                  </div>
                  <button
                    onClick={handleLeave} disabled={acting}
                    style={{
                      width: '100%', padding: '11px', background: 'transparent',
                      color: '#dc2626', border: '1.5px solid #fca5a5',
                      borderRadius: 10, fontWeight: 600, fontSize: '0.88rem', cursor: acting ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', opacity: acting ? 0.7 : 1,
                    }}
                  >
                    {acting ? 'Processing…' : 'Leave Campaign'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoin} disabled={acting || isFull}
                  style={{
                    width: '100%', padding: '14px',
                    background: isFull ? '#e5e7eb' : 'linear-gradient(135deg,#2a5298,#1e3c72)',
                    color: isFull ? '#9ca3af' : '#fff', border: 'none',
                    borderRadius: 10, fontWeight: 700, fontSize: '0.95rem',
                    cursor: acting || isFull ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: acting ? 0.8 : 1,
                    boxShadow: isFull ? 'none' : '0 4px 16px rgba(42,82,152,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  {acting ? 'Joining…' : isFull ? 'Campaign Full' : 'Join Group Deal'}
                </button>
              )
            )}

            {!isAuthenticated && (
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9ca3af', marginTop: 10 }}>
                <button onClick={() => navigate('/login')} style={{ color: '#2a5298', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Sign in
                </button>{' '}to join this deal
              </p>
            )}
          </div>

          {/* Savings Breakdown */}
          {saved > 0 && (
            <div className="card" style={{ background: 'linear-gradient(135deg,#fefce8,#fef9c3)', border: '1.5px solid #fde68a' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Savings
              </div>
              {[
                { label: 'Regular Price',    value: `₹${Number(campaign.retail_price).toLocaleString()}`, muted: true },
                { label: 'Group Deal Price', value: `₹${Number(campaign.hold_price).toLocaleString()}`, bold: true },
                { label: 'You Save',         value: `₹${saved.toLocaleString()} (${Math.round((saved / campaign.retail_price) * 100)}%)`, green: true },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: r.label === 'Group Deal Price' ? '1px dashed #fde68a' : 'none' }}>
                  <span style={{ fontSize: '0.83rem', color: r.muted ? '#9ca3af' : '#374151' }}>{r.label}</span>
                  <span style={{ fontSize: '0.83rem', fontWeight: r.bold || r.green ? 700 : 400, color: r.green ? '#16a34a' : r.muted ? '#9ca3af' : '#1f2937', textDecoration: r.muted ? 'line-through' : 'none' }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes hk-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .campaign-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
