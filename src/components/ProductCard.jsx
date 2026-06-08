import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating.jsx';
import JoinDealModal from './JoinDealModal.jsx';
import { cartService, wishlistService, campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f4f8'/%3E%3Crect x='140' y='90' width='120' height='90' rx='10' fill='%23d1d9e6'/%3E%3Ccircle cx='200' cy='115' r='18' fill='%23a0aec0'/%3E%3Cpath d='M155 175 Q200 130 245 175Z' fill='%23a0aec0'/%3E%3Ctext x='200' y='225' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C%2Fsvg%3E";

function resolveImgSrc(imageUrl) {
  if (!imageUrl) return FALLBACK_IMG;
  if (imageUrl.startsWith('http')) return imageUrl;
  const normalised = imageUrl.startsWith('/uploads')
    ? imageUrl.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  return normalised;
}

export default function ProductCard({ product, alreadyJoined = false }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [imgSrc, setImgSrc]               = useState(() => resolveImgSrc(product.imageUrl));
  const [wished, setWished]               = useState(false);
  const [cartLoading, setCartLoading]     = useState(false);
  const [localHold, setLocalHold]         = useState(product.currentHold || 0);
  const [hasJoined, setHasJoined]         = useState(alreadyJoined);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const pollRef = useRef(null);

  // Poll every 4s while joined — redirect to cart when deal completes
  const startPolling = (productId, holdTarget) => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const campaigns = await campaignService.listCampaigns();
        const active = Array.isArray(campaigns)
          ? campaigns.find(c => Number(c.product_id) === Number(productId))
          : null;
        if (!active || Number(active.current_hold) >= holdTarget) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          toast.success('🎉 Group deal completed! Redirecting to your cart…', { duration: 3000 });
          setTimeout(() => navigate('/cart'), 2000);
        } else {
          setLocalHold(Number(active.current_hold));
        }
      } catch { /* ignore */ }
    }, 4000);
  };

  useEffect(() => {
    // Start polling immediately if user already joined this deal on mount
    if (alreadyJoined && product.holdTarget > 0) {
      startPolling(product.productId, product.holdTarget);
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [alreadyJoined, product.productId]);

  // Keep in sync when parent refreshes product data
  useEffect(() => { setLocalHold(product.currentHold || 0); }, [product.currentHold]);
  useEffect(() => { setHasJoined(alreadyJoined); }, [alreadyJoined]);

  useEffect(() => {
    if (!isAuthenticated) return;
    wishlistService.getWishlist().then(items => {
      if (Array.isArray(items)) {
        setWished(items.some(i => Number(i.productId ?? i.product_id) === Number(product.productId)));
      }
    }).catch(() => {});
  }, [isAuthenticated, product.productId]);

  const handleCardClick = () => navigate(`/product/${product.productId}`);

  const handleCart = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please sign in to add to cart'); navigate('/login'); return; }
    setCartLoading(true);
    try {
      await cartService.addToCart({ productId: product.productId, quantity: 1 });
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to cart');
    } finally { setCartLoading(false); }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please sign in to add to wishlist'); navigate('/login'); return; }
    try {
      if (wished) {
        await wishlistService.removeFromWishlist({ productId: product.productId });
        setWished(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.addToWishlist({ productId: product.productId });
        setWished(true);
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    }
  };

  const handleJoinSuccess = async (qty) => {
    setShowJoinModal(false);
    setHasJoined(true);
    // Optimistic update immediately
    setLocalHold(prev => Math.min(prev + qty, product.holdTarget));

    // Sync real current_hold from server
    let realHold = localHold + qty;
    try {
      const campaigns = await campaignService.listCampaigns();
      if (Array.isArray(campaigns)) {
        const campaign = campaigns.find(c => Number(c.product_id) === Number(product.productId));
        if (campaign) { realHold = Number(campaign.current_hold); setLocalHold(realHold); }
      }
    } catch { /* keep optimistic */ }

    window.dispatchEvent(new CustomEvent('campaignJoined', { detail: { productId: product.productId } }));

    if (realHold >= product.holdTarget) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      toast.success('🎉 Target reached! Redirecting to your cart…', { duration: 3000 });
      setTimeout(() => navigate('/cart'), 2000);
    } else {
      toast.success(`Joined with ${qty} unit${qty > 1 ? 's' : ''}! You'll be redirected to cart once the target is reached.`);
      startPolling(product.productId, product.holdTarget);
    }
  };

  const handleJoin = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please sign in to join the group deal'); navigate('/login'); return; }
    setShowJoinModal(true);
  };

  const hasGroupDeal   = product.holdTarget > 0 && product.holdPrice > 0;
  const safeHold       = Math.min(localHold, product.holdTarget || 0);
  const progressPct    = hasGroupDeal ? Math.round((safeHold / product.holdTarget) * 100) : 0;
  const bestGroupPrice = hasGroupDeal ? product.holdPrice : product.retailPrice;
  const maxDiscountPct = hasGroupDeal && product.retailPrice > 0
    ? Math.round(((product.retailPrice - product.holdPrice) / product.retailPrice) * 100)
    : 0;
  const displayPrice   = product.retailPrice;

  return (
    <>
      {showJoinModal && (
        <JoinDealModal
          product={product}
          bestGroupPrice={bestGroupPrice}
          maxDiscountPct={maxDiscountPct}
          remainingSlots={product.holdTarget - localHold}
          onClose={() => setShowJoinModal(false)}
          onJoinSuccess={handleJoinSuccess}
        />
      )}

      <div
        onClick={handleCardClick}
        style={{
          background: '#fff', borderRadius: 4, border: '1px solid #e3e6e6',
          overflow: 'hidden', cursor: 'pointer', display: 'flex',
          flexDirection: 'column', transition: 'box-shadow 0.2s, border-color 0.2s',
          position: 'relative',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.14)'; e.currentTarget.style.borderColor = '#c9cdd2'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e3e6e6'; }}
      >
        {/* Wishlist heart */}
        <button
          onClick={handleWishlist}
          title="Add to wishlist"
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)', border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', cursor: 'pointer',
            color: wished ? '#dc2626' : '#9ca3af',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            transition: 'color 0.15s, transform 0.15s', lineHeight: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {wished ? '♥' : '♡'}
        </button>

        {/* Image */}
        <div style={{ background: '#f9fafb', overflow: 'hidden' }}>
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgSrc(FALLBACK_IMG)}
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* Body */}
        <div style={{ padding: '6px 8px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: 2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {product.category}
          </p>
          <p style={{
            fontWeight: 500, fontSize: '0.88rem', color: '#0f1111',
            marginBottom: 3, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.3em',
          }}>
            {product.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, height: '1rem', overflow: 'hidden' }}>
            {product.avgRating > 0 ? (
              <>
                <StarRating rating={product.avgRating} size="0.8rem" />
                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>({product.reviewCount})</span>
              </>
            ) : <span style={{ display: 'block' }} />}
          </div>

          {/* Group Deal progress */}
          {hasGroupDeal && (
            <div style={{ marginBottom: 5 }}>
              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
                <div style={{
                  height: '100%', width: `${progressPct}%`, borderRadius: 99,
                  background: progressPct >= 100 ? '#16a34a' : '#2a5298',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                  <span style={{ fontWeight: 700, color: '#1e3c72' }}>{safeHold}/{product.holdTarget}</span> joined
                </span>
                <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>Group Deal</span>
              </div>
              <div style={{ fontSize: '0.68rem', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 5 }}>
                <span style={{ color: '#0f1111', fontWeight: 700, fontSize: '0.67rem' }}>Best price on hold</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#dc2626', fontWeight: 800 }}>₹{bestGroupPrice.toLocaleString('en-IN')}</span>
                  <span style={{ background: '#dc2626', color: '#fff', borderRadius: 3, padding: '1px 4px' }}>{maxDiscountPct}% off</span>
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div style={{ marginBottom: 6, marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f1111' }}>
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>

            </div>
            <p style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 1 }}>Inclusive of all taxes</p>
          </div>

          {/* Buttons */}
          {hasGroupDeal ? (
            <div style={{ display: 'flex', gap: 6 }}>
              {hasJoined ? (
                <button disabled style={{
                  flex: 1, padding: '6px 0',
                  background: '#d1fae5', border: '1px solid #6ee7b7',
                  borderRadius: 4, fontWeight: 700, fontSize: '0.78rem',
                  color: '#065f46', cursor: 'default',
                }}>
                  ✓ Joined
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  style={{
                    flex: 1, padding: '6px 0',
                    background: '#f0c14b', border: '1px solid #a88734',
                    borderRadius: 4, fontWeight: 700, fontSize: '0.78rem',
                    color: '#111', cursor: 'pointer',
                  }}
                >
                  Join
                </button>
              )}
              <button
                onClick={handleCart}
                disabled={cartLoading}
                style={{
                  flex: 1, padding: '6px 0',
                  background: cartLoading ? '#e5e7eb' : 'linear-gradient(135deg, #2a5298, #1e3c72)',
                  border: 'none', borderRadius: 4,
                  fontWeight: 700, fontSize: '0.78rem',
                  color: cartLoading ? '#9ca3af' : '#fff',
                  cursor: cartLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {cartLoading ? '…' : 'Add to Cart'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleCart}
                disabled={cartLoading}
                style={{
                  flex: 1, padding: '6px 0',
                  background: cartLoading ? '#e5e7eb' : '#f0c14b',
                  border: '1px solid #a88734', borderRadius: 4,
                  fontWeight: 700, fontSize: '0.8rem', color: '#111',
                  cursor: cartLoading ? 'not-allowed' : 'pointer',
                }}
              >
                🛒 {cartLoading ? '…' : 'Cart'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.productId}`); }}
                style={{
                  flex: 1, padding: '6px 0',
                  background: 'linear-gradient(135deg, #2a5298, #1e3c72)',
                  border: 'none', borderRadius: 4,
                  fontWeight: 700, fontSize: '0.8rem', color: '#fff', cursor: 'pointer',
                }}
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}