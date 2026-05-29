import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating.jsx';
import { cartService, wishlistService, campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f4f8'/%3E%3Crect x='140' y='90' width='120' height='90' rx='10' fill='%23d1d9e6'/%3E%3Ccircle cx='200' cy='115' r='18' fill='%23a0aec0'/%3E%3Cpath d='M155 175 Q200 130 245 175Z' fill='%23a0aec0'/%3E%3Ctext x='200' y='225' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

function resolveImgSrc(imageUrl) {
  if (!imageUrl) return FALLBACK_IMG;
  if (imageUrl.startsWith('http')) return imageUrl;
  const normalised = imageUrl.startsWith('/uploads')
    ? imageUrl.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  return normalised;
}

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [imgSrc, setImgSrc]           = useState(() => resolveImgSrc(product.imageUrl));
  const [wished, setWished]            = useState(false);
  const [joining, setJoining]          = useState(false);
  const [cartLoading, setCartLoading]  = useState(false);
  const [localHold, setLocalHold]      = useState(product.currentHold || 0);
  const [hasJoined, setHasJoined]      = useState(false);

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

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please sign in to join the group deal'); navigate('/login'); return; }
    setJoining(true);
    try {
      await campaignService.startOrJoinCampaign({ productId: product.productId });
      toast.success('Joined the group deal! 🎉');
      /* Instantly update the card — no page reload needed */
      setLocalHold(prev => Math.min(prev + 1, product.holdTarget || prev + 1));
      setHasJoined(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to join');
    } finally { setJoining(false); }
  };

  /* ── pricing ── */
  const hasGroupDeal    = product.holdTarget > 0;
  const safeHold        = Math.min(localHold, product.holdTarget || 0);
  const discountPct     = hasGroupDeal ? safeHold : 0;
  const displayPrice    = hasGroupDeal && discountPct > 0
    ? Math.round(product.retailPrice * (1 - discountPct / 100))
    : product.retailPrice;
  const progressPct     = hasGroupDeal ? Math.round((safeHold / product.holdTarget) * 100) : 0;

  /* Best possible price when ALL holdTarget members join */
  const maxDiscountPct  = hasGroupDeal ? product.holdTarget : 0;
  const bestGroupPrice  = hasGroupDeal
    ? Math.round(product.retailPrice * (1 - maxDiscountPct / 100))
    : product.retailPrice;

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: '#fff',
        borderRadius: 4,
        border: '1px solid #e3e6e6',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.14)'; e.currentTarget.style.borderColor = '#c9cdd2'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e3e6e6'; }}
    >

      {/* ── Wishlist heart — top right corner of image ── */}
      <button
        onClick={handleWishlist}
        title="Add to wishlist"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10,
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          cursor: 'pointer',
          color: wished ? '#dc2626' : '#9ca3af',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          transition: 'color 0.15s, transform 0.15s',
          lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {wished ? '♥' : '♡'}
      </button>

      {/* ── Image ── */}
      <div style={{ position: 'relative', background: '#f9fafb', overflow: 'hidden' }}>
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => setImgSrc(FALLBACK_IMG)}
          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', padding: 0 }}
        />
        {/* Discount badge on image */}
        {discountPct > 0 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: '#e31c1c', color: '#fff',
            fontSize: '0.72rem', fontWeight: 700,
            padding: '3px 7px', borderRadius: 3,
          }}>
            {discountPct}% off
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '6px 8px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Category */}
        <p style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: 2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {product.category}
        </p>

        {/* Name */}
        <p style={{
          fontWeight: 500, fontSize: '0.88rem', color: '#0f1111',
          marginBottom: 3, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          minHeight: '2.3em',
        }}>
          {product.name}
        </p>

        {/* Star rating — always reserve the row height so all cards stay the same size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, height: '1rem', overflow: 'hidden' }}>
          {product.avgRating > 0 ? (
            <>
              <StarRating rating={product.avgRating} size="0.8rem" />
              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>({product.reviewCount})</span>
            </>
          ) : (
            <span style={{ display: 'block' }} />
          )}
        </div>

        {/* ── Group Deal section ── */}
        {hasGroupDeal && (
          <div style={{ marginBottom: 5 }}>
            {/* Progress bar */}
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                borderRadius: 99,
                background: progressPct >= 100 ? '#16a34a' : '#2a5298',
                transition: 'width 0.4s ease',
              }} />
            </div>

            {/* Joined count + current discount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                <span style={{ fontWeight: 700, color: '#1e3c72' }}>{safeHold}/{product.holdTarget}</span> joined
              </span>
              {discountPct > 0
                ? <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a' }}>{discountPct}% off now</span>
                : <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>Group Deal</span>
              }
            </div>

            {/* Best possible price callout */}
            <div style={{
              background: '#f0f4ff',
              border: '1px solid #c7d8f8',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: '0.68rem',
              color: '#1e3c72',
              marginBottom: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>🏆 Best price on hold</span>
              <span style={{ fontWeight: 800, color: '#007600', marginLeft: 4, flexShrink: 0 }}>
                ₹{bestGroupPrice.toLocaleString('en-IN')} ({maxDiscountPct}% off)
              </span>
            </div>
          </div>
        )}

        {/* ── Price ── */}
        <div style={{ marginBottom: 6, marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f1111' }}>
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {discountPct > 0 && (
              <span style={{ fontSize: '0.78rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                ₹{product.retailPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 1 }}>Inclusive of all taxes</p>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Cart button */}
          <button
            onClick={handleCart}
            disabled={cartLoading}
            style={{
              flex: 1,
              padding: '6px 0',
              background: cartLoading ? '#e5e7eb' : '#f0c14b',
              border: '1px solid #a88734',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#111',
              cursor: cartLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            🛒 {cartLoading ? '…' : 'Cart'}
          </button>

          {/* Join / Group deal button */}
          {hasGroupDeal ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              style={{
                flex: 1,
                padding: '6px 0',
                background: joining ? '#e5e7eb' : 'linear-gradient(135deg, #2a5298, #1e3c72)',
                border: 'none',
                borderRadius: 4,
                fontWeight: 700,
                fontSize: '0.8rem',
                color: joining ? '#9ca3af' : '#fff',
                cursor: joining ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {joining ? '…' : 'Join'}
            </button>
          ) : (
            /* No group deal — show a "Buy" shortcut */
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.productId}`); }}
              style={{
                flex: 1,
                padding: '6px 0',
                background: 'linear-gradient(135deg, #2a5298, #1e3c72)',
                border: 'none',
                borderRadius: 4,
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
