import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import JoinDealModal from '../components/JoinDealModal.jsx';
import AdBanner from '../components/AdBanner.jsx';
import { productService, cartService, wishlistService, campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';


const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest',     label: 'Newest Arrivals' },
  { value: 'rating',     label: 'Avg. Customer Review' },
  { value: 'discount',   label: 'Best Discount' },
];

const PRICE_RANGES = [
  { label: 'Under ₹500',         min: '',     max: '500'   },
  { label: '₹500 – ₹1,000',     min: '500',  max: '1000'  },
  { label: '₹1,000 – ₹5,000',   min: '1000', max: '5000'  },
  { label: '₹5,000 – ₹10,000',  min: '5000', max: '10000' },
  { label: 'Above ₹10,000',      min: '10000',max: ''      },
];

const STAR_OPTIONS = [4, 3, 2, 1];

const FIXED_CATEGORIES = [
  'Automotive',
  'Bags',
  'Beauty',
  'Books',
  'Dress',
  'Electronics',
  'Fashion',
  'Food',
  'Grocery',
  'Health',
  'Home & Kitchen',
  'Other',
  'Perfume',
  'skincare',
  'sports',
  'Sports & Fitness',
  'Top',
  'Toys',
  'Toys & Games',
];

/* ── Mini star row ── */
function StarRow({ n }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 20 20"
          fill={i <= n ? '#f59e0b' : '#d1d5db'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span style={{ fontSize: '0.75rem', color: '#374151', marginLeft: 4 }}>&amp; Up</span>
    </span>
  );
}

/* ── Loading skeleton card ── */
function Skeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <div style={{
        height: 160,
        background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
        backgroundSize: '400% 100%',
        animation: 'hk-shimmer 1.4s infinite',
      }} />
      <div style={{ padding: 14 }}>
        {[80, 60, 40].map((w, i) => (
          <div key={i} style={{ height: 12, width: `${w}%`, background: '#f3f4f6', borderRadius: 6, marginBottom: 10, animation: 'hk-shimmer 1.4s infinite' }} />
        ))}
      </div>
    </div>
  );
}

/* ── Sidebar content ── */
function SidebarContent({ categories, filters, setFilters, minCustom, maxCustom, setMinCustom, setMaxCustom, applyPriceRange, clearAll, activeFilterCount }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: '#2a5298', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginLeft: 6 }}>
              {activeFilterCount}
            </span>
          )}
        </span>
        {activeFilterCount > 0 && (
          <button onClick={clearAll} style={{ fontSize: '0.75rem', color: '#2a5298', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 10 }}>
          Category
        </div>
        {['', ...categories].map(c => (
          <button key={c} onClick={() => setFilters(f => ({ ...f, category: c }))}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', borderRadius: 6, cursor: 'pointer', width: '100%', background: 'transparent', border: 'none', fontFamily: 'inherit', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
              border: filters.category === c ? '2px solid #2a5298' : '2px solid #9ca3af',
              background: filters.category === c ? '#2a5298' : '#fff',
              boxSizing: 'border-box', transition: 'all 0.15s',
            }}>
              {filters.category === c && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'block' }} />
              )}
            </span>
            <span style={{ fontSize: '0.86rem', color: '#374151', fontWeight: filters.category === c ? 600 : 400 }}>
              {c === '' ? 'All Categories' : c}
            </span>
          </button>
        ))}
      </div>

      {/* Price Range */}
      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 10 }}>
          Price Range
        </div>
        {PRICE_RANGES.map(r => {
          const active = filters.minPrice === r.min && filters.maxPrice === r.max && (r.min !== '' || r.max !== '');
          return (
            <button key={r.label} onClick={() => applyPriceRange(r.min, r.max)}
              style={{ display: 'block', width: '100%', padding: '7px 10px', marginBottom: 5, border: `1.5px solid ${active ? '#2a5298' : '#e5e7eb'}`, background: active ? '#eef2ff' : '#fff', color: active ? '#1e3c72' : '#374151', fontWeight: active ? 600 : 400, borderRadius: 6, fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', fontFamily: 'inherit' }}>
              {r.label}
            </button>
          );
        })}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: '0.74rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Custom Range</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="number" placeholder="Min ₹" value={minCustom} onChange={e => setMinCustom(e.target.value)}
              style={{ width: '50%', padding: '7px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#2a5298'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            <input type="number" placeholder="Max ₹" value={maxCustom} onChange={e => setMaxCustom(e.target.value)}
              style={{ width: '50%', padding: '7px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#2a5298'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <button onClick={() => applyPriceRange(minCustom, maxCustom)}
            style={{ width: '100%', marginTop: 8, padding: '9px', background: 'linear-gradient(135deg,#2a5298,#1e3c72)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Apply
          </button>
        </div>
      </div>

      {/* Customer Rating */}
      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 10 }}>
          Customer Rating
        </div>
        {['', ...STAR_OPTIONS.map(String)].map(n => (
          <button key={n} onClick={() => setFilters(f => ({ ...f, rating: n }))}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', borderRadius: 6, cursor: 'pointer', width: '100%', background: 'transparent', border: 'none', fontFamily: 'inherit', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
              border: filters.rating === n ? '2px solid #2a5298' : '2px solid #9ca3af',
              background: filters.rating === n ? '#2a5298' : '#fff',
              boxSizing: 'border-box', transition: 'all 0.15s',
            }}>
              {filters.rating === n && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'block' }} />
              )}
            </span>
            {n === '' ? (
              <span style={{ fontSize: '0.86rem', color: '#374151', fontWeight: filters.rating === '' ? 600 : 400 }}>All Ratings</span>
            ) : (
              <StarRow n={Number(n)} />
            )}
          </button>
        ))}
      </div>

      {/* Availability */}
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 10 }}>
          Availability
        </div>
        {['In Stock Only', 'On Sale', 'Free Delivery'].map(label => (
          <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', borderRadius: 6, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <input type="checkbox" style={{ accentColor: '#2a5298', width: 15, height: 15, cursor: 'pointer' }} />
            <span style={{ fontSize: '0.86rem', color: '#374151' }}>{label}</span>
          </label>
        ))}
      </div>
    </>
  );
}

/* ── List-view product row — uses shared JoinDealModal ── */
function ListProductCard({ product, alreadyJoined = false }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='100' y='108' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

  const resolveImg = (url) => {
    if (!url) return FALLBACK;
    if (url.startsWith('http')) return url;
    const norm = url.startsWith('/uploads') ? url.replace('/uploads', '/seller-uploads') : `/seller-uploads${url.startsWith('/') ? '' : '/'}${url}`;
    return norm;
  };

  const [imgSrc, setImgSrc]           = useState(() => resolveImg(product.imageUrl));
  const [cartLoading, setCartLoading] = useState(false);
  const [hasJoined, setHasJoined]     = useState(alreadyJoined);
  const [localHold, setLocalHold]     = useState(product.currentHold || 0);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const hasGroupDeal = product.holdTarget > 0;
  const safeHold = Math.min(localHold, product.holdTarget || 0);
  const discount = hasGroupDeal
    ? safeHold
    : (product.holdPrice && product.holdPrice !== product.retailPrice && product.retailPrice > 0
        ? Math.round((1 - product.holdPrice / product.retailPrice) * 100) : 0);
  const listDisplayPrice = hasGroupDeal && discount > 0
    ? Math.round(product.retailPrice * (1 - discount / 100))
    : (product.holdPrice && product.holdPrice !== product.retailPrice ? product.holdPrice : product.retailPrice);

  const maxDiscountPct = hasGroupDeal ? product.holdTarget : 0;
  const bestGroupPrice = hasGroupDeal
    ? Math.round(product.retailPrice * (1 - maxDiscountPct / 100))
    : product.retailPrice;

  const handleCart = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    setCartLoading(true);
    try {
      await cartService.addToCart({ productId: product.productId, quantity: 1 });
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to cart');
    } finally { setCartLoading(false); }
  };

  /* Opens the join modal */
  const handleJoin = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please sign in to join the group deal'); return; }
    setShowJoinModal(true);
  };

  /* Called by JoinDealModal after successful join/payment */
  const handleJoinSuccess = (qty) => {
    setShowJoinModal(false);
    const next = localHold + qty;
    setLocalHold(Math.min(next, product.holdTarget));
    setHasJoined(true);
    window.dispatchEvent(new CustomEvent('campaignJoined', { detail: { productId: product.productId } }));
    if (next >= product.holdTarget) {
      cartService.addToCart({ productId: product.productId, quantity: qty }).catch(() => {});
      toast.success('🎉 Target reached! Product added to your cart.', { duration: 4000 });
      setTimeout(() => navigate('/cart'), 2500);
    } else {
      toast.success('Joined the deal! It will move to your cart once the target is reached.');
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to add to wishlist');
      return;
    }
    try {
      await wishlistService.addToWishlist({ productId: product.productId });
      toast.success('Added to wishlist!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to wishlist');
    }
  };

  return (
    <>
      {showJoinModal && hasGroupDeal && (
        <JoinDealModal
          product={product}
          bestGroupPrice={bestGroupPrice}
          maxDiscountPct={maxDiscountPct}
          remainingSlots={Math.max(0, product.holdTarget - localHold)}
          onClose={() => setShowJoinModal(false)}
          onJoinSuccess={handleJoinSuccess}
        />
      )}

      <div onClick={() => navigate(`/product/${product.productId}`)}
        className="hk-list-card"
        style={{ display: 'flex', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

        {/* Image */}
        <div className="hk-list-card-img" style={{ width: 160, minWidth: 160, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 0 }}>
          <img src={imgSrc} alt={product.name} onError={() => setImgSrc(FALLBACK)}
            style={{ width: '100%', height: 140, objectFit: 'contain' }} />
        </div>

        {/* Details */}
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.72rem', color: '#2a5298', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {product.category}
          </div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: '#111', lineHeight: 1.4 }}>{product.name}</div>

          {product.avgRating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {product.avgRating.toFixed(1)} ★
              </div>
              {product.reviewCount > 0 && (
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>({product.reviewCount} reviews)</span>
              )}
            </div>
          )}

          {product.description && (
            <p style={{ fontSize: '0.83rem', color: '#6b7280', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {product.description}
            </p>
          )}

          {/* Group Deal progress — updated after joining */}
          {hasGroupDeal && (() => {
            const progressPct = Math.round((safeHold / product.holdTarget) * 100);
            const finalPrice  = Math.round(product.retailPrice * (1 - product.holdTarget / 100));
            return (
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{
                    height: '100%', width: `${progressPct}%`, borderRadius: 99,
                    background: progressPct >= 100 ? '#16a34a' : '#2a5298',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: 4 }}>
                  <span>{safeHold}/{product.holdTarget} joined</span>
                  <span>Group Deal</span>
                </div>
                <div style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>₹{finalPrice.toLocaleString('en-IN')}</span>
                  <span style={{ background: '#dc2626', color: '#fff', borderRadius: 3, padding: '1px 4px', fontSize: '0.68rem' }}>{product.holdTarget}% off</span>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111' }}>
              ₹{listDisplayPrice?.toLocaleString('en-IN')}
            </span>
            {discount > 0 && (
              <span style={{ fontSize: '0.88rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                ₹{product.retailPrice?.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {hasGroupDeal && (
              hasJoined ? (
                <button
                  disabled
                  style={{ padding: '8px 18px', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', color: '#065f46', cursor: 'default', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  ✅ Joined
                </button>
              ) : (
                <button onClick={handleJoin}
                  style={{ padding: '8px 18px', background: '#f0c14b', border: '1px solid #a88734', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', color: '#111', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  🤝 Join
                </button>
              )
            )}
            <button onClick={handleCart} disabled={cartLoading}
              style={{ padding: '8px 20px', background: cartLoading ? '#e5e7eb' : 'linear-gradient(135deg,#2a5298,#1e3c72)', color: cartLoading ? '#9ca3af' : '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', cursor: cartLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {cartLoading ? '…' : '+ Add to Cart'}
            </button>
            <button onClick={handleWishlist}
              style={{ padding: '8px 16px', background: '#fff', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              ♡ Wishlist
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
════════════════════════════════════════════════════════════ */
export default function Products() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const sentinelRef = useRef(null);
  const [view, setView]               = useState('grid');
  const [sort, setSort]               = useState('featured');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [minCustom, setMinCustom]     = useState('');
  const [maxCustom, setMaxCustom]     = useState('');

  const [joinedProductIds, setJoinedProductIds] = useState(new Set());

  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    rating:   '',
  });

  // Fetch joined campaigns to show correct button state on cards.
  // Guests have no "my campaigns" — skip the call entirely so the page
  // (search, category filters, product grid) works before login.
  useEffect(() => {
    if (!isAuthenticated) { setJoinedProductIds(new Set()); return; }
    campaignService.getMyCampaigns().then(mine => {
      if (Array.isArray(mine)) {
        // Only ACTIVE or PAUSED campaigns count as "joined" — exclude CANCELLED
        const active = mine.filter(m => m.campaignStatus === 'ACTIVE' || m.campaignStatus === 'PAUSED');
        setJoinedProductIds(new Set(active.map(m => Number(m.product_id))));
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  // Sync filters when URL searchParams change (e.g. search from Header)
  useEffect(() => {
    const search   = searchParams.get('search')   || '';
    const category = searchParams.get('category') || '';
    setFilters(f => ({ ...f, search, category }));
  }, [searchParams]);

  /* ── client-side sort helper ── */
  const sortProducts = useCallback((list, sortKey) => {
    const arr = [...list];
    switch (sortKey) {
      case 'price_asc':  return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case 'price_desc': return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case 'newest':     return arr.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
      case 'rating':     return arr.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
      case 'discount':   return arr.sort((a, b) => {
        const da = a.originalPrice > a.price ? (1 - a.price / a.originalPrice) : 0;
        const db = b.originalPrice > b.price ? (1 - b.price / b.originalPrice) : 0;
        return db - da;
      });
      default: return arr;
    }
  }, []);

  /* ── fetch products ── */
  const fetchProducts = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (filters.search)   params.search   = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.rating)   params.rating   = filters.rating;

      const data = await productService.listProducts(params);
      const rawList = Array.isArray(data) ? data : (data?.products ?? []);
      const sorted  = sortProducts(rawList, sort);
      setProducts(prev => (reset ? sorted : sortProducts([...prev, ...rawList], sort)));
      setHasMore(rawList.length === 20);
    } catch {
      if (page === 1) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, sortProducts, page]);

  /* ── re-sort in place when sort changes (no re-fetch needed for client sort) ── */
  useEffect(() => {
    setProducts(prev => sortProducts(prev, sort));
  }, [sort, sortProducts]);

  useEffect(() => {
    productService.getCategories()
      .then(c => {
        const apiCats = Array.isArray(c) ? c : [];
        // Merge API categories with the fixed list, deduplicate (case-insensitive)
        const lowerFixed = FIXED_CATEGORIES.map(x => x.toLowerCase());
        const extra = apiCats.filter(cat => !lowerFixed.includes(cat.toLowerCase()));
        setCategories([...FIXED_CATEGORIES, ...extra]);
      })
      .catch(() => setCategories(FIXED_CATEGORIES));
  }, []);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.search, filters.minPrice, filters.maxPrice, filters.rating]);

  /* ── helpers ── */
  const applyPriceRange = (min, max) => {
    setMinCustom(min);
    setMaxCustom(max);
    setFilters(f => ({ ...f, minPrice: min, maxPrice: max }));
  };

  const clearAll = () => {
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '', rating: '' });
    setMinCustom('');
    setMaxCustom('');
    setSort('featured');
    setSearchParams({});
  };

  const removeFilter = (key) => {
    if (key === 'price') applyPriceRange('', '');
    else setFilters(f => ({ ...f, [key]: '' }));
  };

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next, false);
  }, [page, fetchProducts]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const activeFilters = [
    filters.search   && { key: 'search',   label: `"${filters.search}"`,  icon: '🔍' },
    filters.category && { key: 'category', label: filters.category,        icon: '📦' },
    (filters.minPrice || filters.maxPrice) && { key: 'price', label: `₹${filters.minPrice||'0'} – ₹${filters.maxPrice||'∞'}`, icon: '₹' },
    filters.rating   && { key: 'rating',   label: `${filters.rating}+ Stars`, icon: '⭐' },
  ].filter(Boolean);

  const gridRef = useRef(null);
  const [gridCols, setGridCols] = useState(5);

  useEffect(() => {
    function measure() {
      if (!gridRef.current) return;
      const w = gridRef.current.offsetWidth;
      const cols = Math.max(1, Math.floor((w + 12) / (195 + 12)));
      setGridCols(cols);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <>
      <style>{`
        @keyframes hk-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes hk-spin { to { transform: rotate(360deg); } }

        .hk-sort-pill {
          padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 500;
          cursor: pointer; border: 1.5px solid #e5e7eb; background: #fff; color: #374151;
          transition: all 0.18s; font-family: inherit; white-space: nowrap; flex-shrink: 0;
        }
        .hk-sort-pill:hover  { border-color: #2a5298; color: #2a5298; }
        .hk-sort-pill.active { background: #2a5298; color: #fff; border-color: #2a5298; }

        .hk-view-btn {
          width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
          border-radius: 6px; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer;
          transition: all 0.18s; color: #6b7280;
        }
        .hk-view-btn.active { background: #2a5298; border-color: #2a5298; color: #fff; }

        .hk-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: #eef2ff; color: #1e3c72; border: 1px solid #c7d2fe;
          padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: background 0.18s; white-space: nowrap;
        }
        .hk-chip:hover { background: #dde6ff; }
        .hk-chip-clear { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
        .hk-chip-clear:hover { background: #fecaca; }

        .hk-product-item { transition: box-shadow 0.2s, transform 0.2s; }
        .hk-product-item:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.12) !important; transform: translateY(-3px); }

        .hk-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.5); z-index: 199;
        }
        .hk-drawer {
          display: none; position: fixed; top: 0; left: 0; width: 280px; height: 100vh;
          background: #fff; z-index: 200; overflow-y: auto; padding: 20px;
          box-shadow: 4px 0 20px rgba(0,0,0,0.15);
        }
        .hk-overlay.open { display: block; }
        .hk-drawer.open  { display: block; }

        .hk-sidebar-sticky { display: block; }
        @media (max-width: 900px) {
          .hk-sidebar-sticky      { display: none !important; }
          .hk-mobile-filter-btn   { display: flex !important; }
          .hk-sort-scroll         { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
        }
        @media (max-width: 480px) {
          .hk-products-chips { padding: 8px 12px !important; }
          .hk-products-body  { padding: 10px 12px 32px !important; }
          .hk-grid-view       { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px !important; }
          .hk-sort-label      { display: none !important; }
          .hk-sort-scroll     { display: none !important; }
        }
        @media (max-width: 600px) {
          .hk-list-card-img { width: 110px !important; min-width: 110px !important; }
        }
        @media (max-width: 420px) {
          .hk-list-card     { flex-direction: column !important; }
          .hk-list-card-img { width: 100% !important; min-width: 0 !important; height: 160px !important; }
        }
      `}</style>

      <div style={{ paddingTop: 112 }}>

      {/* ── Active filter chips strip (only shown when filters are active) ── */}
      {activeFilters.length > 0 && (
        <div className="hk-products-chips" style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '10px 20px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {activeFilters.map(f => (
              <span key={f.key} className="hk-chip" onClick={() => removeFilter(f.key)}>
                {f.icon} {f.label} <b style={{ marginLeft: 2 }}>×</b>
              </span>
            ))}
            {activeFilters.length > 1 && (
              <span className="hk-chip hk-chip-clear" onClick={clearAll}>
                Clear All
              </span>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MAIN BODY  — full width
      ══════════════════════════════════════ */}
      <div style={{ background: '#f4f6fa', minHeight: '80vh' }}>
        <div className="hk-products-body" style={{ padding: '14px 20px 48px' }}>

          {/* ── Sort / View bar ── */}
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              {/* Mobile filter button */}
              <button className="hk-mobile-filter-btn"
                onClick={() => setSidebarOpen(true)}
                style={{ display: 'none', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 6, border: '1.5px solid #2a5298', background: '#eef2ff', color: '#2a5298', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M4 6h16M7 12h10M10 18h4"/>
                </svg>
                Filters
              </button>

              <span className="hk-sort-label" style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 500, flexShrink: 0 }}>Sort by:</span>

              <div className="hk-sort-scroll" style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0 }}>
                {SORT_OPTIONS.map(o => (
                  <button key={o.value} className={`hk-sort-pill${sort === o.value ? ' active' : ''}`}
                    onClick={() => setSort(o.value)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {!loading && products.length > 0 && (
                <span style={{ fontSize: '0.82rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                  <b style={{ color: '#111' }}>{products.length}</b> products
                </span>
              )}
              <div style={{ display: 'flex', gap: 4 }}>
                <button className={`hk-view-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')} title="Grid view">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="0"  y="0"  width="6" height="6" rx="1"/>
                    <rect x="10" y="0"  width="6" height="6" rx="1"/>
                    <rect x="0"  y="10" width="6" height="6" rx="1"/>
                    <rect x="10" y="10" width="6" height="6" rx="1"/>
                  </svg>
                </button>
                <button className={`hk-view-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} title="List view">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="0" y="1"  width="16" height="3" rx="1"/>
                    <rect x="0" y="7"  width="16" height="3" rx="1"/>
                    <rect x="0" y="13" width="16" height="3" rx="1"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── Layout: Sidebar + Products ── */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

            {/* Desktop sidebar */}
            <aside className="hk-sidebar-sticky"
              style={{ width: 240, flexShrink: 0, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16, position: 'sticky', top: 120, maxHeight: 'calc(100vh - 134px)', overflowY: 'auto' }}>
              <SidebarContent
                categories={categories} filters={filters} setFilters={setFilters}
                minCustom={minCustom} maxCustom={maxCustom}
                setMinCustom={setMinCustom} setMaxCustom={setMaxCustom}
                applyPriceRange={applyPriceRange} clearAll={clearAll}
                activeFilterCount={activeFilters.length}
              />
              {/* ── Sidebar Box Ad removed — now shown on Home page ── */}
            </aside>

            {/* Mobile drawer */}
            <div className={`hk-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />
            <div className={`hk-drawer${sidebarOpen ? ' open' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Filters</span>
                <button onClick={() => setSidebarOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#374151', lineHeight: 1 }}>×</button>
              </div>
              <SidebarContent
                categories={categories} filters={filters} setFilters={setFilters}
                minCustom={minCustom} maxCustom={maxCustom}
                setMinCustom={setMinCustom} setMaxCustom={setMaxCustom}
                applyPriceRange={applyPriceRange} clearAll={clearAll}
                activeFilterCount={activeFilters.length}
              />
            </div>

            {/* ── Products area ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {loading && products.length === 0 ? (
                <div className="hk-grid-view" style={{ display: 'grid', gridTemplateColumns: view === 'list' ? '1fr' : 'repeat(auto-fill,minmax(195px,1fr))', gap: 12 }}>
                  {[...Array(12)].map((_, i) => <Skeleton key={i} />)}
                </div>

              ) : products.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: '72px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 8, color: '#111' }}>No products found</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.92rem', maxWidth: 340, margin: '0 auto 28px' }}>
                    We couldn't find products matching your current search or filters.
                  </p>
                  <button onClick={clearAll}
                    style={{ padding: '10px 28px', background: 'linear-gradient(135deg,#2a5298,#1e3c72)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
                    Clear All Filters
                  </button>
                </div>

              ) : view === 'grid' ? (
                <div ref={gridRef} className="hk-grid-view" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: 12 }}>
                  {products.flatMap((p, i) => {
                    const card = (
                      <div key={p.productId} className="hk-product-item"
                        style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        <ProductCard product={p} alreadyJoined={joinedProductIds.has(p.productId)} />
                      </div>
                    );
                    if (i === gridCols - 2) {
                      return [card];
                    }
                    return [card];
                  })}
                </div>

              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {products.map(p => <ListProductCard key={p.productId} product={p} alreadyJoined={joinedProductIds.has(p.productId)} />)}
                </div>
              )}

              {/* Infinite scroll sentinel */}
              {products.length > 0 && (
                <div style={{ marginTop: 28, textAlign: 'center' }}>
                  <div ref={sentinelRef} style={{ height: 1 }} />
                  {loading && page > 1 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: '0.88rem' }}>
                      <span style={{ width: 16, height: 16, border: '2px solid #9ca3af', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'hk-spin 0.7s linear infinite' }} />
                      Loading…
                    </span>
                  )}
                  {!hasMore && (
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', padding: '12px 0' }}>
                      ✓ Showing all {products.length} products
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}