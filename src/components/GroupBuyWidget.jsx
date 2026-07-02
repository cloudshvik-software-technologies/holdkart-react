/**
 * GroupBuyWidget — drop into ProductDetail.jsx to show active group deals for the product.
 *
 * Usage:
 *   import GroupBuyWidget from '../components/GroupBuyWidget.jsx';
 *   // inside the ProductDetail JSX, after the price section:
 *   <GroupBuyWidget productId={product.productId} />
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { campaignService } from '../services/index.js';
import toast from 'react-hot-toast';

export default function GroupBuyWidget({ productId }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [campaigns, setCampaigns]   = useState([]);
  const [mine, setMine]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [joining, setJoining]       = useState(null);
  const [starting, setStarting]     = useState(false);
  const [showStart, setShowStart]   = useState(false);

  const load = async () => {
    try {
      const all = await campaignService.listCampaigns();
      const forProduct = (Array.isArray(all) ? all : []).filter(
        c => String(c.product_id || c.productId) === String(productId)
      );
      setCampaigns(forProduct);
      if (isAuthenticated) {
        const m = await campaignService.getMyCampaigns();
        setMine(Array.isArray(m) ? m : []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (productId) load();
  }, [productId, isAuthenticated]);

  const joinedIds = new Set(mine.map(m => String(m.campaign_id)));

  const handleJoin = async (campaignId) => {
    if (!isAuthenticated) { toast.error('Please sign in to join'); return; }
    try {
      await campaignService.joinCampaign({ campaignId });
      toast.success('Joined the group deal!');
      window.dispatchEvent(new CustomEvent('campaignJoined', { detail: { campaignId, productId } }));
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to join');
    } finally { setJoining(null); }
  };

  const handleStart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to start a group deal'); return; }
    try {
      await campaignService.startCampaign({ productId });
      toast.success('Group deal started! Others can now join.');
      window.dispatchEvent(new CustomEvent('campaignJoined', { detail: { productId } }));
      load();
      setShowStart(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not start a campaign for this product');
    } finally { setStarting(false); }
  };

  if (loading) return (
    <div style={{ marginTop: 20, background: '#eef2ff', borderRadius: 12, padding: '16px 20px', height: 80, animation: 'hk-shimmer 1.4s infinite' }} />
  );

  const active = campaigns.filter(c => (c.status || 'ACTIVE') === 'ACTIVE');

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        background: 'linear-gradient(135deg,#eef2ff,#dbeafe)',
        border: '1.5px solid #c7d2fe',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#1e3c72,#2a5298)',
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: '1.2rem' }}>🎯</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Group Deal Available</div>
            <div style={{ color: '#93c5fd', fontSize: '0.72rem' }}>Join to unlock a lower price</div>
          </div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {active.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ color: '#4b5563', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
                No active group deals yet
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginBottom: 14 }}>
                Be the first to start one! Once the target is reached, it's added to everyone's cart at the deal price.
              </div>
              {!showStart ? (
                <button
                  onClick={() => isAuthenticated ? setShowStart(true) : toast.error('Please sign in to start a group deal')}
                  style={{
                    background: 'linear-gradient(135deg,#2a5298,#1e3c72)',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '10px 24px', fontWeight: 700, fontSize: '0.85rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(42,82,152,0.3)',
                  }}
                >
                  Start a Group Deal
                </button>
              ) : (
                <div style={{
                  background: '#fff', borderRadius: 10, padding: '14px 16px',
                  border: '1.5px solid #c7d2fe', textAlign: 'left',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 6, color: '#1f2937' }}>
                    Start a Group Deal for this product
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 12 }}>
                    The seller has pre-set the target size and group deal price. Once enough people join, everyone gets the discount.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleStart} disabled={starting}
                      style={{
                        flex: 1, background: 'linear-gradient(135deg,#2a5298,#1e3c72)',
                        color: '#fff', border: 'none', borderRadius: 8,
                        padding: '10px', fontWeight: 700, fontSize: '0.85rem',
                        cursor: starting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        opacity: starting ? 0.7 : 1,
                      }}
                    >
                      {starting ? 'Starting…' : 'Confirm & Start'}
                    </button>
                    <button
                      onClick={() => setShowStart(false)}
                      style={{
                        padding: '10px 16px', background: '#f3f4f6',
                        color: '#374151', border: 'none', borderRadius: 8,
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            active.map(c => {
              const pct     = Math.min(100, Math.round((c.current_hold / c.target) * 100));
              const isJoined = joinedIds.has(String(c.id));
              const saved    = Number(c.retail_price) - Number(c.hold_price);
              const barColor = pct >= 100 ? '#16a34a' : pct >= 60 ? '#2a5298' : '#f59e0b';

              return (
                <div key={c.id} style={{
                  background: '#fff', borderRadius: 10, padding: '14px 16px',
                  border: '1.5px solid #e0e7ff',
                }}>
                  {/* Price row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3c72' }}>
                          ₹{Number(c.hold_price).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                          ₹{Number(c.retail_price).toLocaleString()}
                        </span>
                      </div>
                      {saved > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: 2 }}>
                          Save ₹{saved.toLocaleString()} ({Math.round((saved / c.retail_price) * 100)}% off)
                        </div>
                      )}
                    </div>
                    {isJoined && (
                      <div style={{
                        background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac',
                        borderRadius: 6, padding: '3px 10px', fontSize: '0.68rem', fontWeight: 700,
                      }}>JOINED</div>
                    )}
                  </div>

                  {/* Progress */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: 5 }}>
                      <span><b style={{ color: '#1f2937' }}>{c.current_hold}</b> / {c.target} joined</span>
                      <span style={{ fontWeight: 700, color: barColor }}>{pct}%</span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                      <div style={{
                        width: pct + '%', height: '100%', borderRadius: 99,
                        background: `linear-gradient(90deg,${barColor},${barColor}cc)`,
                        transition: 'width 0.5s',
                      }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>
                      {Math.max(0, c.target - c.current_hold)} more needed — item added to cart only when target is reached
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                      style={{
                        flex: 1, background: '#eef2ff', color: '#2a5298',
                        border: '1.5px solid #c7d2fe', borderRadius: 8,
                        padding: '8px', fontWeight: 600, fontSize: '0.8rem',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      View Deal
                    </button>
                    {!isJoined && (
                      <button
                        onClick={() => handleJoin(c.id)} disabled={joining === c.id}
                        style={{
                          flex: 2, background: 'linear-gradient(135deg,#2a5298,#1e3c72)',
                          color: '#fff', border: 'none', borderRadius: 8,
                          padding: '8px', fontWeight: 700, fontSize: '0.8rem',
                          cursor: joining === c.id ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit', opacity: joining === c.id ? 0.7 : 1,
                        }}
                      >
                        {joining === c.id ? 'Joining…' : 'Join Group Deal'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes hk-shimmer {
          0%  { background-position: 200% 0; }
          100%{ background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}