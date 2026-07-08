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

function WishlistItem({ item, onRemove, removingId }) {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(() => resolveImg(item.imageUrl));
  const isUnavailable = !item.active || item.stock === 0;
  const isRemoving    = removingId    === item.productId;

  const hasGroupDeal = item.holdTarget > 0 && item.hasCampaign;
  // Discount = actual price saving, not hold count
  const discountPct = (hasGroupDeal && item.retailPrice > 0 && item.holdPrice > 0 && item.holdPrice < item.retailPrice)
    ? Math.round((1 - item.holdPrice / item.retailPrice) * 100)
    : 0;
  const dealPrice    = hasGroupDeal ? item.holdPrice : null;
  const displayPrice = item.retailPrice;

  return (
    <div style={{
      display: 'flex', background: '#fff',
      border: '1px solid #e5e7eb', borderRadius: 10,
      marginBottom: 14, overflow: 'hidden',
      opacity: isRemoving ? 0.5 : 1,
      transition: 'opacity 0.2s, box-shadow 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
    >
      {/* Image */}
      <div
        onClick={() => navigate(`/product/${item.productId}`)}
        className="wl-item-img"
        style={{
          background: '#f9fafb',
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <img
          src={imgSrc}
          alt={item.name}
          onError={() => setImgSrc(FALLBACK_IMG)}
          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
        />
        {isUnavailable && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.03em' }}>
              {item.stock === 0 ? 'Out of Stock' : 'Unavailable'}
            </span>
          </div>
        )}

      </div>

      {/* Details */}
      <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* Top row: category + delete */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#2a5298', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {item.category}
          </div>
          <button
            onClick={() => onRemove(item.productId)}
            disabled={isRemoving}
            title="Remove from wishlist"
            style={{
              background: 'none', border: 'none', padding: '2px 4px',
              color: '#9ca3af', fontSize: '1.1rem', cursor: isRemoving ? 'not-allowed' : 'pointer',
              lineHeight: 1, transition: 'color 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
          >
            ✕
          </button>
        </div>

        {/* Name */}
        <div
          onClick={() => navigate(`/product/${item.productId}`)}
          style={{
            fontWeight: 600, fontSize: '0.98rem', color: '#1f2937', lineHeight: 1.4,
            cursor: 'pointer', maxWidth: 520,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#E85D04'}
          onMouseLeave={e => e.currentTarget.style.color = '#1f2937'}
        >
          {item.name}
        </div>

        {/* Rating */}
        {item.avgRating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ background: '#16a34a', color: '#fff', padding: '2px 7px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              {item.avgRating.toFixed(1)} ★
            </div>
            {item.reviewCount > 0 && (
              <span style={{ fontSize: '0.74rem', color: '#2a5298' }}>
                {item.reviewCount} {item.reviewCount === 1 ? 'rating' : 'ratings'}
              </span>
            )}
          </div>
        )}

        {/* Price block */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {hasGroupDeal && dealPrice ? (
            <>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>
                ₹{dealPrice.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a' }}>
                {discountPct}% off (Group Deal)
              </span>
            </>
          ) : (
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
          )}
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
        .wl-item-img { width: 160px; min-width: 160px; }
        @media (max-width: 600px) {
          .wl-item-img { width: 100px !important; min-width: 100px !important; }
        }
      `}</style>

      <div style={{ paddingTop: 112, background: '#f3f4f6', minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px' }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: '0.78rem', color: '#555', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link to="/" style={{ color: '#2a5298', textDecoration: 'none' }}
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
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0, lineHeight: 1.2 }}>
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
                background: 'rgb(240 127 34)', border: '1px solid #994917',
                borderRadius: 4,
                fontWeight: 700, fontSize: '0.85rem', color: '#fff',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
               Continue Shopping
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
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
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
                  background: 'rgb(240 127 34)', border: '1px solid #994917',
                  borderRadius: 4,
                  fontWeight: 700, fontSize: '0.92rem', color: '#fff',
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
                  removingId={removingId}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}