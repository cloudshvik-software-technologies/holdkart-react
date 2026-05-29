import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, cartService, wishlistService, reviewService, campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from '../components/StarRating.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f0f4f8'/%3E%3Crect x='220' y='110' width='160' height='130' rx='14' fill='%23d1d9e6'/%3E%3Ccircle cx='300' cy='148' r='26' fill='%23a0aec0'/%3E%3Cpath d='M230 235 Q300 165 370 235Z' fill='%23a0aec0'/%3E%3Ctext x='300' y='315' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

function resolveSellerImg(url) {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith('http')) return url;
  const normalised = url.startsWith('/uploads')
    ? url.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${url.startsWith('/') ? '' : '/'}${url}`;
  return normalised;
}

/* ─── styles ─── */
const S = {
  page: {
    background: '#f4f6fa',
    minHeight: '100vh',
    paddingTop: 100,
    paddingBottom: 60,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 16px',
  },
  breadcrumb: {
    fontSize: '0.8rem',
    color: '#6b7280',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  breadcrumbLink: {
    color: '#2a5298',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  /* Main product area */
  productGrid: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr 280px',
    gap: 20,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  /* Image column */
  imageCol: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    padding: 16,
    position: 'sticky',
    top: 100,
  },
  mainImg: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'contain',
    borderRadius: 4,
    marginBottom: 12,
    background: '#f9fafb',
  },
  thumbRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  thumb: {
    width: 56,
    height: 56,
    objectFit: 'cover',
    borderRadius: 4,
    cursor: 'pointer',
    border: '2px solid transparent',
    padding: 2,
    transition: 'border-color 0.15s',
    background: '#f9fafb',
  },
  thumbActive: {
    borderColor: '#2a5298',
  },
  /* Center info column */
  infoCol: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    padding: '20px 24px',
  },
  categoryBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#2a5298',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
    display: 'block',
  },
  productTitle: {
    fontSize: '1.45rem',
    fontWeight: 400,
    lineHeight: 1.35,
    color: '#0f1111',
    marginBottom: 10,
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 14,
    borderBottom: '1px solid #e5e7eb',
    marginBottom: 14,
  },
  ratingCount: {
    fontSize: '0.82rem',
    color: '#2a5298',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  priceSection: {
    paddingBottom: 14,
    borderBottom: '1px solid #e5e7eb',
    marginBottom: 14,
  },
  listPrice: {
    fontSize: '0.82rem',
    color: '#6b7280',
    marginBottom: 2,
  },
  listPriceCross: {
    textDecoration: 'line-through',
  },
  mainPrice: {
    fontSize: '2rem',
    fontWeight: 400,
    color: '#b12704',
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  priceSymbol: {
    fontSize: '1.1rem',
    verticalAlign: 'super',
    lineHeight: 1,
  },
  savingsBadge: {
    display: 'inline-block',
    background: '#2a5298',
    color: '#fff',
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 3,
    marginLeft: 8,
    verticalAlign: 'middle',
  },
  taxNote: {
    fontSize: '0.72rem',
    color: '#6b7280',
    marginTop: 4,
  },
  /* Group deal */
  groupDealBox: {
    background: '#f0f4ff',
    border: '1px solid #bfcfec',
    borderRadius: 6,
    padding: 16,
    marginBottom: 14,
  },
  groupDealHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupDealLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#1e3c72',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  groupDealCount: {
    fontSize: '0.78rem',
    color: '#4f7ccc',
    fontWeight: 600,
  },
  progressTrack: {
    height: 6,
    background: '#dbeafe',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    borderRadius: 99,
    background: pct >= 100 ? '#16a34a' : '#2a5298',
    transition: 'width 0.4s ease',
  }),
  groupPriceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 12,
  },
  groupDealPrice: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#1e3c72',
  },
  groupDealOriginal: {
    fontSize: '0.88rem',
    color: '#9ca3af',
    textDecoration: 'line-through',
  },
  groupDealSavings: {
    fontSize: '0.78rem',
    fontWeight: 700,
    background: '#fef9c3',
    color: '#854d0e',
    borderRadius: 4,
    padding: '2px 7px',
  },
  groupDealHint: {
    fontSize: '0.78rem',
    color: '#4f7ccc',
    fontStyle: 'italic',
  },
  joinBtn: (loading) => ({
    width: '100%',
    padding: '10px',
    background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #2a5298, #1e3c72)',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    fontWeight: 700,
    fontSize: '0.88rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s',
  }),
  joinedBox: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  joinedTag: {
    flex: 1,
    padding: '9px 12px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 6,
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#15803d',
  },
  leaveBtn: {
    padding: '9px 14px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: '0.8rem',
    color: '#6b7280',
    cursor: 'pointer',
    fontWeight: 500,
  },
  /* About / features */
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  featureItem: {
    fontSize: '0.88rem',
    color: '#374151',
    padding: '4px 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureBullet: {
    color: '#2a5298',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 1,
  },
  /* Buy box */
  buyBox: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    padding: 20,
    position: 'sticky',
    top: 100,
  },
  buyBoxPrice: {
    fontSize: '1.75rem',
    fontWeight: 400,
    color: '#b12704',
    marginBottom: 4,
  },
  deliveryRow: {
    fontSize: '0.82rem',
    color: '#374151',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
  },
  deliveryLabel: {
    color: '#6b7280',
    flexShrink: 0,
  },
  deliveryVal: {
    color: '#374151',
    fontWeight: 600,
  },
  stockStatus: (inStock) => ({
    fontSize: '1rem',
    fontWeight: 600,
    color: inStock ? '#007600' : '#b12704',
    marginBottom: 12,
  }),
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    fontSize: '0.88rem',
    color: '#374151',
  },
  qtySelect: {
    padding: '5px 10px',
    border: '1px solid #ccc',
    borderRadius: 6,
    background: '#f7f8f8',
    fontSize: '0.88rem',
    cursor: 'pointer',
    outline: 'none',
  },
  qtyCtrl: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 34,
    height: 34,
    background: '#f9fafb',
    border: 'none',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#374151',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  qtyVal: {
    width: 40,
    textAlign: 'center',
    fontWeight: 600,
    fontSize: '0.95rem',
    borderLeft: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    lineHeight: '34px',
    height: 34,
    display: 'block',
  },
  addToCartBtn: {
    width: '100%',
    padding: '10px',
    background: '#f0c14b',
    border: '1px solid #a88734',
    borderRadius: 20,
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#111',
    cursor: 'pointer',
    marginBottom: 8,
    transition: 'background 0.15s',
  },
  buyNowBtn: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(135deg, #2a5298, #1e3c72)',
    border: 'none',
    borderRadius: 20,
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#fff',
    cursor: 'pointer',
    marginBottom: 12,
    transition: 'opacity 0.15s',
  },
  wishlistLink: {
    display: 'block',
    textAlign: 'center',
    fontSize: '0.82rem',
    color: '#2a5298',
    cursor: 'pointer',
    marginBottom: 14,
    textDecoration: 'underline',
  },
  divider: {
    height: 1,
    background: '#e5e7eb',
    margin: '12px 0',
  },
  soldByRow: {
    fontSize: '0.8rem',
    color: '#374151',
    display: 'flex',
    justifyContent: 'space-between',
  },
  soldByLabel: { color: '#6b7280' },
  soldByVal: { color: '#2a5298', fontWeight: 600 },
  /* Trust badges */
  badgeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTop: '1px solid #e5e7eb',
  },
  badgeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.75rem',
    color: '#374151',
    fontWeight: 500,
  },
  /* Tabs */
  tabNav: {
    display: 'flex',
    borderBottom: '2px solid #e5e7eb',
    marginBottom: 20,
    background: '#fff',
    borderRadius: '4px 4px 0 0',
  },
  tabBtn: (active) => ({
    padding: '14px 22px',
    fontWeight: active ? 700 : 400,
    fontSize: '0.9rem',
    color: active ? '#0f1111' : '#6b7280',
    borderBottom: active ? '2px solid #2a5298' : '2px solid transparent',
    marginBottom: -2,
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #2a5298' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.15s',
  }),
  descCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '0 0 4px 4px',
    padding: '24px',
    lineHeight: 1.8,
    fontSize: '0.9rem',
    color: '#374151',
  },
  reviewCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    padding: 20,
    marginBottom: 12,
  },
};

/* ─────────────────────────────────────────────────────────
   GROUP BUY SECTION
─────────────────────────────────────────────────────────── */
function GroupBuySection({ product, onJoin, onLeave, joinLoading, hasJoined }) {
  const { holdTarget, currentHold = 0, retailPrice } = product;
  if (!holdTarget || holdTarget <= 0) return null;

  const safeHold      = Math.min(currentHold, holdTarget);
  const discountPct   = safeHold;
  const discountedPrice = Math.round(retailPrice * (1 - discountPct / 100));
  const pct           = Math.round((safeHold / holdTarget) * 100);

  return (
    <div style={S.groupDealBox}>
      <div style={S.groupDealHeader}>
        <span style={S.groupDealLabel}>
          <span style={{ fontSize: '1rem' }}></span> Group Deal
        </span>
        <span style={S.groupDealCount}>{safeHold} / {holdTarget} joined</span>
      </div>

      <div style={S.progressTrack}>
        <div style={S.progressFill(pct)} />
      </div>

      <div style={S.groupPriceRow}>
        <span style={S.groupDealPrice}>
          ₹{discountedPrice.toLocaleString('en-IN')}
        </span>
        {discountPct > 0 && (
          <>
            <span style={S.groupDealOriginal}>₹{retailPrice.toLocaleString('en-IN')}</span>
            <span style={S.groupDealSavings}>{discountPct}% off</span>
          </>
        )}
        {discountPct === 0 && (
          <span style={S.groupDealHint}>Be first — every member adds 1% off</span>
        )}
      </div>

      {!hasJoined ? (
        <button onClick={onJoin} disabled={joinLoading} style={S.joinBtn(joinLoading)}>
          {joinLoading ? 'Joining…' : 'Join Group Deal'}
        </button>
      ) : (
        <div style={S.joinedBox}>
          <div style={S.joinedTag}>✓ Joined — buying at {discountPct}% off</div>
          <button onClick={onLeave} disabled={joinLoading} style={S.leaveBtn}>Leave</button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════
   MAIN PAGE
══════════════════════════════ */
export default function ProductDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [mainImg, setMainImg]   = useState('');
  const [qty, setQty]           = useState(1);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('desc');
  const [reviewForm, setReviewForm]         = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [activeCampaign, setActiveCampaign] = useState(null);
  const [hasJoined, setHasJoined]           = useState(false);
  const [joinLoading, setJoinLoading]       = useState(false);

  const loadProduct = async () => {
    const [p, r] = await Promise.all([
      productService.getProduct(id),
      reviewService.getProductReviews(id),
    ]);
    setProduct(p);
    setMainImg(p.images?.[0] || '');
    setReviews(Array.isArray(r) ? r : []);
    return p;
  };

  const loadCampaignStatus = async (p) => {
    if (!p?.holdTarget || p.holdTarget <= 0) return;
    try {
      const campaigns = await campaignService.listCampaigns();
      const campaign  = Array.isArray(campaigns)
        ? campaigns.find(c => Number(c.product_id) === Number(p.productId))
        : null;
      setActiveCampaign(campaign || null);
      if (isAuthenticated) {
        const mine   = await campaignService.getMyCampaigns();
        const joined = Array.isArray(mine)
          ? mine.some(m => Number(m.product_id) === Number(p.productId) && m.campaignStatus === 'ACTIVE')
          : false;
        setHasJoined(joined);
      }
    } catch {
      /* no active campaign — fine */
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const p = await loadProduct();
        await loadCampaignStatus(p);
      } catch { toast.error('Product not found'); navigate('/products'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleCart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to add items to cart'); navigate('/login'); return; }
    try { await cartService.addToCart({ productId: product.productId, quantity: qty }); toast.success('Added to cart!'); }
    catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to add to wishlist'); navigate('/login'); return; }
    try { await wishlistService.addToWishlist({ productId: product.productId }); toast.success('Added to wishlist!'); }
    catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to purchase'); navigate('/login'); return; }
    await handleCart();
    navigate('/cart');
  };

  const handleJoin = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to join'); navigate('/login'); return; }
    setJoinLoading(true);
    try {
      /* Use start-or-join so it works even if no campaign has been created yet */
      await campaignService.startOrJoinCampaign({ productId: product.productId });
      toast.success('Joined group deal!');
      setHasJoined(true);
      const p = await productService.getProduct(id);
      setProduct(p);
      await loadCampaignStatus(p);
    } catch(e) { toast.error(e?.response?.data?.message || 'Failed to join'); }
    finally { setJoinLoading(false); }
  };

  const handleLeave = async () => {
    if (!activeCampaign) return;
    setJoinLoading(true);
    try {
      await campaignService.leaveCampaign({ campaignId: activeCampaign.id });
      toast.success('Left group deal');
      setHasJoined(false);
      const p = await productService.getProduct(id);
      setProduct(p);
      await loadCampaignStatus(p);
    } catch(e) { toast.error(e?.response?.data?.message || 'Failed to leave'); }
    finally { setJoinLoading(false); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please sign in to submit a review'); navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      await reviewService.addReview({ productId: product.productId, ...reviewForm });
      toast.success('Review submitted!');
      const r = await reviewService.getProductReviews(id);
      setReviews(Array.isArray(r) ? r : []);
      setReviewForm({ rating: 5, comment: '' });
    } catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #eef2ff', borderTopColor: '#2a5298', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading product…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
  if (!product) return null;

  const avgRating    = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) : 0;
  const hasGroupBuy  = product.holdTarget > 0;
  const safeHold     = Math.min(product.currentHold || 0, product.holdTarget || 0);
  const discountPct  = safeHold;
  const displayPrice = hasGroupBuy && discountPct > 0
    ? Math.round(product.retailPrice * (1 - discountPct / 100))
    : product.retailPrice;
  const inStock      = product.stock > 0;

  const features = [
    product.category && `Category: ${product.category}`,
    inStock          && `In Stock: ${product.stock} units available`,
    product.warehouseLocation && `Dispatched from: ${product.warehouseLocation}`,
    'Quality Certified by HoldKart',
    '7-Day Returns',
  ].filter(Boolean);

  /* responsive: collapse to 2-col on narrow */
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 900;

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Breadcrumb */}
        <div style={S.breadcrumb}>
          <span style={S.breadcrumbLink} onClick={() => navigate('/')}>Home</span>
          <span>›</span>
          <span style={S.breadcrumbLink} onClick={() => navigate('/products')}>Products</span>
          <span>›</span>
          {product.category && (
            <>
              <span style={S.breadcrumbLink} onClick={() => navigate(`/products?category=${product.category}`)}>{product.category}</span>
              <span>›</span>
            </>
          )}
          <span style={{ color: '#0f1111', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </span>
        </div>

        {/* ── 3-column product grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '320px 1fr 268px',
          gap: 16,
          alignItems: 'flex-start',
          marginBottom: 20,
        }}>

          {/* ── Col 1: Images ── */}
          <div style={S.imageCol}>
            <img
              src={resolveSellerImg(mainImg)}
              alt={product.name}
              style={S.mainImg}
              onError={e => { e.target.src = FALLBACK_IMG; }}
            />
            {product.images?.length > 1 && (
              <div style={S.thumbRow}>
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={resolveSellerImg(img)}
                    alt=""
                    onClick={() => setMainImg(img)}
                    style={{ ...S.thumb, ...(mainImg === img ? S.thumbActive : {}) }}
                    onError={e => { e.target.src = FALLBACK_IMG; }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Col 2: Product Info ── */}
          <div style={S.infoCol}>
            <span style={S.categoryBadge}>{product.category}</span>
            <h1 style={S.productTitle}>{product.name}</h1>

            {/* Rating */}
            {reviews.length > 0 && (
              <div style={S.ratingRow}>
                <StarRating rating={avgRating} />
                <span style={S.ratingCount} onClick={() => setTab('reviews')}>
                  {avgRating.toFixed(1)} · {reviews.length} rating{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Price */}
            <div style={S.priceSection}>
              {discountPct > 0 && (
                <p style={S.listPrice}>
                  M.R.P.: <span style={S.listPriceCross}>₹{product.retailPrice.toLocaleString('en-IN')}</span>
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                <span style={S.mainPrice}>
                  <span style={S.priceSymbol}>₹</span>
                  {displayPrice.toLocaleString('en-IN')}
                </span>
                {discountPct > 0 && (
                  <span style={{ fontSize: '0.82rem', color: '#007600', fontWeight: 600 }}>
                    Save {discountPct}% with group deal
                    <span style={S.savingsBadge}>{discountPct}% off</span>
                  </span>
                )}
              </div>
              <p style={S.taxNote}>Inclusive of all taxes</p>
            </div>

            {/* Group Deal */}
            {hasGroupBuy && (
              <GroupBuySection
                product={product}
                onJoin={handleJoin}
                onLeave={handleLeave}
                joinLoading={joinLoading}
                hasJoined={hasJoined}
              />
            )}

            {/* About this item */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f1111', marginBottom: 10 }}>
                About this item
              </p>
              {product.description ? (
                <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#374151' }}>
                  {product.description}
                </p>
              ) : (
                <p style={{ fontSize: '0.88rem', color: '#6b7280' }}>No description available.</p>
              )}
            </div>

            {/* Feature bullets */}
            <ul style={S.featuresList}>
              {features.map((f, i) => (
                <li key={i} style={S.featureItem}>
                  <span style={S.featureBullet}>›</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Buy Box ── */}
          <div style={S.buyBox}>
            <p style={S.buyBoxPrice}>
              <span style={{ fontSize: '1rem', verticalAlign: 'super' }}>₹</span>
              {displayPrice.toLocaleString('en-IN')}
            </p>

            {/* Delivery */}
            <div style={{ marginBottom: 10 }}>
              <div style={S.deliveryRow}>
                <span style={S.deliveryLabel}>Delivery:</span>
                <span style={S.deliveryVal}>FREE delivery available</span>
              </div>
              <div style={S.deliveryRow}>
                <span style={S.deliveryLabel}>Ships from:</span>
                <span>HoldKart Warehouse</span>
              </div>
              <div style={S.deliveryRow}>
                <span style={S.deliveryLabel}>Sold by:</span>
                <span style={{ color: '#2a5298', fontWeight: 600 }}>HoldKart</span>
              </div>
            </div>

            <div style={S.divider} />

            <p style={S.stockStatus(inStock)}>
              {inStock ? 'In Stock' : 'Currently Unavailable'}
            </p>

            {inStock && (
              <>
                {/* Qty */}
                <div style={S.qtyRow}>
                  <span>Qty:</span>
                  <div style={S.qtyCtrl}>
                    <button style={S.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                    <span style={S.qtyVal}>{qty}</span>
                    <button style={S.qtyBtn} onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}>+</button>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    (max {product.stock})
                  </span>
                </div>

                <button style={S.addToCartBtn} onClick={handleCart}>Add to Cart</button>
                <button style={S.buyNowBtn} onClick={handleBuyNow}>Buy Now</button>
              </>
            )}

            <span style={S.wishlistLink} onClick={handleWishlist}>Add to Wishlist</span>

            <div style={S.divider} />

            {/* Trust badges */}
            <div style={S.badgeGrid}>
              {[['📦', 'Quality Certified'], ['🔄', '7-Day Returns'], ['🛡️', 'Warranty', ], ['🚚', 'Fast Delivery']].map(([icon, label]) => (
                <div key={label} style={S.badgeItem}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs: Description + Reviews ── */}
        <div>
          <div style={S.tabNav}>
            {[['desc', 'Product Description'], ['reviews', `Customer Reviews (${reviews.length})`]].map(([key, label]) => (
              <button key={key} style={S.tabBtn(tab === key)} onClick={() => setTab(key)}>{label}</button>
            ))}
          </div>

          {tab === 'desc' && (
            <div style={S.descCard}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f1111', marginBottom: 16 }}>Product Description</h2>
              <p style={{ lineHeight: 1.8, color: '#374151' }}>{product.description || 'No description available.'}</p>
            </div>
          )}

          {tab === 'reviews' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0 0 4px 4px', padding: 24 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f1111', marginBottom: 20 }}>
                Customer Reviews
              </h2>

              {reviews.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 700, color: '#0f1111', lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
                    <StarRating rating={avgRating} />
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>out of 5</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const pct   = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: '0.78rem', color: '#2a5298', width: 38, flexShrink: 0 }}>{star} star</span>
                          <div style={{ flex: 1, height: 10, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#f0a500', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#6b7280', width: 30, flexShrink: 0 }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isAuthenticated && (
                <div style={{ ...S.reviewCard, marginBottom: 24, background: '#fafbfc' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.95rem' }}>Write a Customer Review</h3>
                  <form onSubmit={handleReviewSubmit}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      {[1,2,3,4,5].map(s => (
                        <button type="button" key={s} onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                          style={{ fontSize: '1.6rem', background: 'none', border: 'none', cursor: 'pointer',
                            color: s <= reviewForm.rating ? '#f0a500' : '#d1d5db', transition: 'color 0.1s' }}>
                          ★
                        </button>
                      ))}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <textarea
                        rows={3}
                        placeholder="Share your experience with this product…"
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 6,
                          fontSize: '0.9rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                    <button type="submit"
                      style={{ padding: '8px 20px', background: '#f0c14b', border: '1px solid #a88734',
                        borderRadius: 20, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                      disabled={submittingReview}>
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⭐</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>No reviews yet</h3>
                  <p style={{ fontSize: '0.88rem' }}>Be the first to review this product</p>
                </div>
              ) : reviews.map(r => (
                <div key={r.id} style={S.reviewCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f1111', marginBottom: 4 }}>
                        {r.customerName || 'Customer'}
                      </div>
                      <StarRating rating={r.rating} size="0.85rem" />
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                      {new Date(r.created_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ color: '#374151', fontSize: '0.88rem', lineHeight: 1.7, marginTop: 8 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
