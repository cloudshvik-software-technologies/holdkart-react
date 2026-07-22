import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import JoinDealModal from '../components/JoinDealModal.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23eef2ff'/%3E%3Crect x='220' y='110' width='160' height='130' rx='14' fill='%23c7d2fe'/%3E%3Ccircle cx='300' cy='148' r='26' fill='%236366f1'/%3E%3Ctext x='300' y='315' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%236366f1'%3ENo Image%3C/text%3E%3C/svg%3E";

function resolveImg(url) {
  if (!url || url.startsWith('data:')) return FALLBACK_IMG;
  // image_url may be a JSON array string: '["path1","path2"]'
  let first = url;
  if (String(url).startsWith('[')) {
    try { first = JSON.parse(url).filter(Boolean)[0] || url; } catch {}
  }
  if (first.startsWith('http')) return first;
  const n = first.startsWith('/uploads')
    ? first.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${first.startsWith('/') ? '' : '/'}${first}`;
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
  const { id: rawId } = useParams();
  // Strip any ':N' mysql2 duplicate-column suffix that may appear in the URL
  const id = parseInt(String(rawId || '').split(':')[0], 10);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [joined, setJoined]     = useState(false);
  const [myJoinedQty, setMyJoinedQty] = useState(1);
  const [acting, setActing]     = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveQty, setLeaveQty] = useState(1);

  const countdown = useCountdown(campaign?.end_time);

  // Reusable fetch — pulls fresh campaign data + this customer's join status.
  // Used on initial mount and again after a successful join/leave so the
  // progress ring, slot count, and joined state all reflect the server.
  const load = useCallback(() => {
    if (!id) return;
    campaignService.getCampaignById(id)
      .then(data => setCampaign(data))
      .catch(() => {});
    if (isAuthenticated) {
      campaignService.getMyCampaigns()
        .then(mine => {
          const list = Array.isArray(mine) ? mine : [];
          const mineRow = list.find(m => String(m.campaign_id) === String(id));
          setJoined(!!mineRow);
          setMyJoinedQty(mineRow ? (Number(mineRow.mySlots) || 1) : 1);
        })
        .catch(() => {});
    }
  }, [id, isAuthenticated]);

  // Fetch campaign data — split into two independent effects so that
  // auth state resolving doesn't re-fetch (and double-toast) the campaign.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    campaignService.getCampaignById(id)
      .then(data => { if (!cancelled) setCampaign(data); })
      .catch(() => { if (!cancelled) { toast.error('Campaign not found'); navigate('/campaigns'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, navigate]);

  // Separately check join status only when auth is confirmed
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    campaignService.getMyCampaigns()
      .then(mine => {
        const list = Array.isArray(mine) ? mine : [];
        const mineRow = list.find(m => String(m.campaign_id) === String(id));
        setJoined(!!mineRow);
        setMyJoinedQty(mineRow ? (Number(mineRow.mySlots) || 1) : 1);
      })
      .catch(() => {});
  }, [id, isAuthenticated]);

  // Opens the deposit/advance-amount modal instead of joining instantly —
  // consistent with every other "Join" entry point in the app (product
  // card, product detail), which all collect the advance amount via
  // JoinDealModal first.
  const handleJoin = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setShowJoinModal(true);
  };

  const handleJoinSuccess = (qty) => {
    setShowJoinModal(false);
    setJoined(true);
    toast.success('You joined the group deal!');
    window.dispatchEvent(new CustomEvent('campaignJoined', { detail: { campaignId: Number(id), campaign } }));
    load();
  };

  // Opens the same "how many units to leave" modal used on the product
  // page, instead of a bare window.confirm — also resets the stepper to
  // the customer's full joined quantity each time it's opened.
  const handleLeave = () => {
    setLeaveQty(myJoinedQty || 1);
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = async (qty) => {
    setActing(true);
    try {
      await campaignService.leaveCampaign({ campaignId: Number(id), quantity: qty });
      toast.success('Left campaign');
      setShowLeaveModal(false);
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

  // Props for the deposit modal — built from the campaign row itself so the
  // amount charged matches this exact deal (a campaign can override the
  // product's default retail/hold price).
  const retailPrice    = Number(campaign.retail_price) || 0;
  const holdPrice      = Number(campaign.hold_price) || 0;
  const maxDiscountPct = retailPrice > 0 ? Math.round(((retailPrice - holdPrice) / retailPrice) * 100) : 0;
  const remainingSlots = Math.max(0, Number(campaign.target) - Number(campaign.current_hold));
  const variantLabel   = [campaign.variant_color, campaign.variant_size].filter(Boolean).join(' / ') || null;

  return (
    <div className="page-wrap">

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#9ca3af', marginBottom: 20 }}>
        <Link to="/campaigns" style={{ color: '#2a5298', fontWeight: 600, textDecoration: 'none' }}>Hold Deals</Link>
        <span>/</span>
        <span style={{ color: '#374151' }}>{campaign.product_name}</span>
      </div>

      <div className="campaign-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>

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
                {(campaign.variant_color || campaign.variant_size) && (
                  <div style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600, marginBottom: 4 }}>
                    {[campaign.variant_color, campaign.variant_size].filter(Boolean).join(' / ')}
                  </div>
                )}
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
        <div className="campaign-detail-right" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 100 }}>

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
          .campaign-detail-right { position: static !important; top: auto !important; }
        }
      `}</style>

      {showJoinModal && (
        <JoinDealModal
          product={{ productId: campaign.product_id, name: campaign.product_name, retailPrice }}
          bestGroupPrice={holdPrice}
          maxDiscountPct={maxDiscountPct}
          remainingSlots={remainingSlots}
          variantLabel={variantLabel}
          variantId={campaign.variant_id || null}
          onClose={() => setShowJoinModal(false)}
          onJoinSuccess={handleJoinSuccess}
          campaignAction={(qty, { cashfreeOrderId, depositAmount }) =>
            campaignService.joinCampaign({ campaignId: Number(id), quantity: qty, cashfreeOrderId, depositAmount })
          }
        />
      )}

      {/* ── Leave Campaign Modal (choose how many units to leave) ── */}
      {showLeaveModal && (
        <div
          onClick={() => !acting && setShowLeaveModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 380, padding: '24px 24px 20px' }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', color: '#1f2937' }}>Leave Campaign</h3>
            <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: '#6b7280' }}>
              You joined this deal with {myJoinedQty} {myJoinedQty === 1 ? 'unit' : 'units'}. How many would you like to leave?
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => setLeaveQty(q => Math.max(1, q - 1))}
                disabled={leaveQty <= 1}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #d1d5db', background: '#fff', fontSize: '1.1rem', fontWeight: 700, color: leaveQty <= 1 ? '#d1d5db' : '#1f2937', cursor: leaveQty <= 1 ? 'default' : 'pointer' }}
              >−</button>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1f2937', minWidth: 30, textAlign: 'center' }}>{leaveQty}</span>
              <button
                type="button"
                onClick={() => setLeaveQty(q => Math.min(myJoinedQty || 1, q + 1))}
                disabled={leaveQty >= (myJoinedQty || 1)}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #d1d5db', background: '#fff', fontSize: '1.1rem', fontWeight: 700, color: leaveQty >= (myJoinedQty || 1) ? '#d1d5db' : '#1f2937', cursor: leaveQty >= (myJoinedQty || 1) ? 'default' : 'pointer' }}
              >+</button>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center' }}>
              {leaveQty >= myJoinedQty
                ? "You'll leave the campaign completely."
                : `You'll still have ${myJoinedQty - leaveQty} ${myJoinedQty - leaveQty === 1 ? 'unit' : 'units'} in this deal.`}
            </p>
            {/* Refund warning — the initial/advance amount paid when joining is
                not returned when a customer leaves a hold campaign. */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 12px', marginBottom: 18 }}>
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#92400e', lineHeight: 1.45 }}>
                Your initial payment for the unit(s) you're leaving will <strong>not be refunded</strong>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                disabled={acting}
                style={{ flex: 1, padding: '10px 0', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >Cancel</button>
              <button
                type="button"
                onClick={() => handleConfirmLeave(leaveQty)}
                disabled={acting}
                style={{ flex: 1, padding: '10px 0', borderRadius: 4, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >{acting ? 'Leaving…' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}