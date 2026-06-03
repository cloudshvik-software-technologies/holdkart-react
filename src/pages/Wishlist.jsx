import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { wishlistService, cartService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='100' y='108' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

function resolveImg(url) {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith('http')) return url;
  return url.startsWith('/uploads')
    ? url.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${url.startsWith('/') ? '' : '/'}${url}`;
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', gap: 20, background: '#fff',
      border: '1px solid #ddd', borderRadius: 4,
      padding: 16, marginBottom: 12, animation: 'wl-pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ width: 160, minWidth: 160, height: 160, background: '#f3f4f6', borderRadius: 4 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 14, width: '60%', background: '#f3f4f6', borderRadius: 4 }} />
        <div style={{ height: 12, width: '40%', background: '#f3f4f6', borderRadius: 4 }} />
        <div style={{ height: 18, width: '25%', background: '#f3f4f6', borderRadius: 4 }} />
        <div style={{ height: 34, width: 140, background: '#f3f4f6', borderRadius: 4, marginTop: 'auto' }} />
      </div>
    </div>
  );
}

function WishlistItem({ item, onRemove, onAddToCart, removingId, cartLoadingId }) {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(() => resolveImg(item.imageUrl));
  const isUnavailable = !item.active || item.stock === 0;
  const isRemoving = removingId === item.productId;
  const isAddingCart = cartLoadingId === item.productId;

  const hasGroupDeal = item.holdTarget > 0;
  const safeHold = Math.min(item.currentHold || 0, item.holdTarget || 0);
  const discountPct = hasGroupDeal ? safeHold : 0;
  const displayPrice = hasGroupDeal && discountPct > 0
    ? Math.round(item.retailPrice * (1 - discountPct / 100))
    : item.retailPrice;

  return (
    <div style={{
      display: 'flex', gap: 0, background: '#fff',
      border: '1px solid #ddd', borderRadius: 4,
      marginBottom: 12, overflow: 'hidden',
      opacity: isRemoving ? 0.5 : 1,
      transition: 'opacity 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.09)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Image */}
      <div
        onClick={() => navigate(`/product/${item.productId}`)}
        style={{
          width: 180, minWidth: 180, background: '#f9fafb',
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <img
          src={imgSrc}
          alt={item.name}
          onError={() => setImgSrc(FALLBACK_IMG)}
          style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
        />
        {isUnavailable && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.03em' }}>
              {item.stock === 0 ? 'Out of Stock' : 'Unavailable'}
            </span>
          </div>
        )}
        {discountPct > 0 && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: '#e31c1c', color: '#fff',
            fontSize: '0.7rem', fontWeight: 700,
            padding: '2px 7px', borderRadius: 3,
          }}>
            {discountPct}% off
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* Category */}
        <div style={{ fontSize: '0.7rem', color: '#2a5298', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {item.category}
        </div>

        {/* Name */}
        <div
          onClick={() => navigate(`/product/${item.productId}`)}
          style={{
            fontWeight: 600, fontSize: '1rem', color: '#0f1111', lineHeight: 1.4,
            cursor: 'pointer', maxWidth: 520,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#c7511f'}
          onMouseLeave={e => e.currentTarget.style.color = '#0f1111'}
        >
          {item.name}
        </div>

        {/* Rating */}
        {item.avgRating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ background: '#16a34a', color: '#fff', padding: '2px 7px', borderRadius: 4, fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              {item.avgRating.toFixed(1)} ★
            </div>
            {item.reviewCount > 0 && (
              <span style={{ fontSize: '0.76rem', color: '#007185' }}>
                {item.reviewCount} {item.reviewCount === 1 ? 'rating' : 'ratings'}
              </span>
            )}
          </div>
        )}

        {/* Group Deal bar */}
        {hasGroupDeal && (
          <div style={{ marginTop: 6, maxWidth: 340 }}>
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{
                height: '100%',
                width: `${Math.round((safeHold / item.holdTarget) * 100)}%`,
                borderRadius: 99,
                background: safeHold >= item.holdTarget ? '#16a34a' : '#2a5298',
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
              <strong style={{ color: '#1e3c72' }}>{safeHold}/{item.holdTarget}</strong> joined &nbsp;
              {discountPct > 0 && <span style={{ color: '#16a34a', fontWeight: 600 }}>· {discountPct}% off now</span>}
            </span>
          </div>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f1111' }}>
            ₹{displayPrice?.toLocaleString('en-IN')}
          </span>
          {discountPct > 0 && (
            <span style={{ fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'line-through' }}>
              ₹{item.retailPrice?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Tax note */}
        <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>Inclusive of all taxes</div>

        {/* Stock status */}
        <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: 2, color: item.stock > 5 ? '#007600' : item.stock > 0 ? '#c7511f' : '#dc2626' }}>
          {item.stock === 0 ? 'Out of Stock' : item.stock <= 5 ? `Only ${item.stock} left in stock` : 'In Stock'}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => onAddToCart(item.productId)}
            disabled={isUnavailable || isAddingCart}
            style={{
              padding: '8px 18px',
              background: isUnavailable ? '#e5e7eb' : 'linear-gradient(to bottom, #f7dfa5, #f0c14b)',
              border: '1px solid',
              borderColor: isUnavailable ? '#d1d5db' : '#a88734',
              borderRadius: 4,
              fontWeight: 700, fontSize: '0.85rem',
              color: isUnavailable ? '#9ca3af' : '#111',
              cursor: isUnavailable ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'background 0.15s',
              boxShadow: isUnavailable ? 'none' : '0 1px 0 rgba(255,255,255,0.4) inset',
              fontFamily: 'inherit',
            }}
          >
            🛒 {isAddingCart ? 'Adding…' : 'Add to Cart'}
          </button>

          <button
            onClick={() => navigate(`/product/${item.productId}`)}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(to bottom, #fff, #f7f8fa)',
              border: '1px solid #adb1b8',
              borderRadius: 4,
              fontWeight: 600, fontSize: '0.85rem', color: '#111',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset',
            }}
          >
            View Item
          </button>

          <button
            onClick={() => onRemove(item.productId)}
            disabled={isRemoving}
            style={{
              padding: '8px 14px',
              background: 'none', border: 'none',
              color: '#007185', fontSize: '0.83rem', fontWeight: 500,
              cursor: isRemoving ? 'not-allowed' : 'pointer',
              textDecoration: 'underline', textDecorationColor: 'transparent',
              fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c7511f'; e.currentTarget.style.textDecorationColor = '#c7511f'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#007185'; e.currentTarget.style.textDecorationColor = 'transparent'; }}
          >
            {isRemoving ? 'Removing…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Wishlist() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [cartLoadingId, setCartLoadingId] = useState(null);

  const fetchWishlist = async () => {
    try {
      const data = await wishlistService.getWishlist();
      // Filter out deleted products (active=false or missing name) — backend
      // already excludes them via JOIN, this is a safety net
      setWishlist(Array.isArray(data) ? data.filter(i => i.name && i.active !== false) : []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchWishlist();
  }, [isAuthenticated]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await wishlistService.removeFromWishlist({ productId });
      setWishlist(prev => prev.filter(i => i.productId !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (productId) => {
    setCartLoadingId(productId);
    try {
      await cartService.addToCart({ productId, quantity: 1 });
      toast.success('Added to cart!');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to add to cart');
    } finally {
      setCartLoadingId(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes wl-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
      `}</style>

      <div style={{ paddingTop: 112, background: '#f3f4f6', minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px' }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: '0.78rem', color: '#555', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link to="/" style={{ color: '#007185', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              Home
            </Link>
            <span style={{ color: '#999' }}>›</span>
            <span style={{ color: '#333' }}>Your Wish List</span>
          </div>

          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f1111', margin: 0, lineHeight: 1.2 }}>
                Your Wish List
              </h1>
              {!loading && (
                <p style={{ fontSize: '0.83rem', color: '#555', marginTop: 4 }}>
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
            <Link
              to="/products"
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(to bottom, #f7dfa5, #f0c14b)',
                border: '1px solid #a88734',
                borderRadius: 4,
                fontWeight: 700, fontSize: '0.85rem', color: '#111',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
              }}
            >
              + Continue Shopping
            </Link>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div>
              {[1, 2, 3].map(n => <SkeletonRow key={n} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && wishlist.length === 0 && (
            <div style={{
              background: '#fff', border: '1px solid #ddd', borderRadius: 4,
              padding: '60px 32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: 16, lineHeight: 1 }}>♡</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f1111', marginBottom: 8 }}>
                Your wish list is empty
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#555', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                You have no items in your wish list. Click "Add to Wishlist" next to any item to save it here.
              </p>
              <Link
                to="/products"
                style={{
                  display: 'inline-block',
                  padding: '10px 24px',
                  background: 'linear-gradient(to bottom, #f7dfa5, #f0c14b)',
                  border: '1px solid #a88734',
                  borderRadius: 4,
                  fontWeight: 700, fontSize: '0.92rem', color: '#111',
                  textDecoration: 'none',
                }}
              >
                Shop Now
              </Link>
            </div>
          )}

          {/* Wishlist items */}
          {!loading && wishlist.length > 0 && (
            <div>
              {wishlist.map(item => (
                <WishlistItem
                  key={item.wishlistId}
                  item={item}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                  removingId={removingId}
                  cartLoadingId={cartLoadingId}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}