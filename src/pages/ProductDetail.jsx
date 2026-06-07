import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, cartService, wishlistService, reviewService, campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from '../components/StarRating.jsx';
import JoinDealModal from '../components/JoinDealModal.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f0f4f8'/%3E%3Crect x='220' y='110' width='160' height='130' rx='14' fill='%23d1d9e6'/%3E%3Ccircle cx='300' cy='148' r='26' fill='%23a0aec0'/%3E%3Cpath d='M230 235 Q300 165 370 235Z' fill='%23a0aec0'/%3E%3Ctext x='300' y='315' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

const CUSTOMER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

// Review images are served by the customer backend under /uploads/reviews/
function resolveReviewImg(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return CUSTOMER_URL + (path.startsWith('/') ? path : '/' + path);
}

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
  productGrid: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr 280px',
    gap: 20,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  imageCol: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    padding: '10px 12px',
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
  groupDealBox: {
    background: '#f0f4ff',
    border: '1px solid #bfcfec',
    borderRadius: 6,
    padding: '10px 12px',
    marginBottom: 14,
  },
  groupDealHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
    marginBottom: 6,
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
    marginBottom: 6,
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
function GroupBuySection({ product, localHold, onJoin, onLeave, onAddProduct, joinLoading, hasJoined }) {
  const { holdTarget, retailPrice } = product;
  if (!holdTarget || holdTarget <= 0) return null;

  const safeHold        = Math.min(localHold, holdTarget);
  const discountedPrice = Math.round(retailPrice * (1 - safeHold / 100));
  const finalPrice      = Math.round(retailPrice * (1 - holdTarget / 100));
  const pct             = Math.round((safeHold / holdTarget) * 100);
  const remaining       = holdTarget - safeHold;

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

      <div style={{ fontSize: '0.8rem', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontWeight: 700, color: '#0f1111' }}>Best price on hold</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 800, color: '#dc2626' }}>₹{finalPrice.toLocaleString('en-IN')}</span>
          <span style={{ background: '#dc2626', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: '0.75rem' }}>{holdTarget}% off</span>
        </div>
      </div>

      <div style={S.groupPriceRow}>
        <span style={S.groupDealPrice}>
          ₹{discountedPrice.toLocaleString('en-IN')}
        </span>
        {safeHold > 0 && (
          <span style={S.groupDealOriginal}>₹{retailPrice.toLocaleString('en-IN')}</span>
        )}
      </div>

      {!hasJoined ? (
        <button onClick={onJoin} disabled={joinLoading} style={S.joinBtn(joinLoading)}>
          {joinLoading ? 'Joining\u2026' : 'Join Group Deal'}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: '0.78rem', color: '#0f1111', margin: 0 }}>
            {remaining > 0
              ? `${remaining} more member${remaining !== 1 ? 's' : ''} needed to unlock the price`
              : '\uD83C\uDF89 Target reached \u2014 deal unlocked!'}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, padding: '7px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>
               Joined this deal
            </div>
            <button onClick={onLeave} disabled={joinLoading} style={S.leaveBtn}>Leave</button>
          </div>
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
  const [reviews, setReviews]         = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [mainImg, setMainImg]         = useState('');
  const [qty, setQty]           = useState(1);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('desc');
  const [reviewForm, setReviewForm]         = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canWriteReview, setCanWriteReview]     = useState(false);   // true only if customer has purchased this product
  const [reviewImages, setReviewImages]         = useState([]);      // File objects chosen by user
  const [reviewImagePreviews, setReviewImagePreviews] = useState([]); // data-URL previews
  const fileInputRef = useRef(null);

  const [activeCampaign, setActiveCampaign] = useState(null);
  const [hasJoined, setHasJoined]           = useState(false);
  const [joinLoading, setJoinLoading]       = useState(false);
  const [localHold, setLocalHold]           = useState(0);
  const [showJoinModal, setShowJoinModal]   = useState(false);
  const [isAddMore, setIsAddMore]           = useState(false);
  const [campaignPaused, setCampaignPaused] = useState(false); // true when seller has paused the campaign
  const pollRef                             = useRef(null);

  // Poll campaign status every 4s while user has joined — redirect all participants when deal completes
  const startPolling = useCallback((productId, holdTarget) => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(async () => {
      try {
        const campaigns = await campaignService.listCampaigns();
        const active = Array.isArray(campaigns)
          ? campaigns.find(c => Number(c.product_id) === Number(productId))
          : null;
        if (!active) {
          // Campaign no longer active — deal completed or cancelled
          clearInterval(pollRef.current);
          pollRef.current = null;
          // Check if product is in cart at DEAL price (means deal completed)
          const mine = await campaignService.getMyCampaigns();
          const stillJoined = Array.isArray(mine)
            ? mine.some(m => Number(m.product_id) === Number(productId) && m.campaignStatus === 'ACTIVE')
            : false;
          if (!stillJoined) {
            toast.success('🎉 Group deal completed! Redirecting to your cart…', { duration: 3000 });
            setTimeout(() => navigate('/cart'), 2000);
          }
        } else {
          setLocalHold(Number(active.current_hold));
          if (Number(active.current_hold) >= holdTarget) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            toast.success('🎉 Group deal completed! Redirecting to your cart…', { duration: 3000 });
            setTimeout(() => navigate('/cart'), 2000);
          }
        }
      } catch { /* ignore poll errors */ }
    }, 4000);
  }, [navigate]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // Stop polling when component unmounts
  useEffect(() => () => stopPolling(), [stopPolling]);

  const loadProduct = async () => {
    const [p, r] = await Promise.all([
      productService.getProduct(id),
      reviewService.getProductReviews(id),
    ]);
    if (!p) throw new Error('Product not found');
    setProduct(p);
    setLocalHold(p.currentHold || 0);
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
      if (campaign) setLocalHold(campaign.current_hold);

      // Check if this product's campaign is paused
      try {
        const statusRes = await campaignService.getProductCampaignStatus(p.productId);
        const status = statusRes?.status || statusRes?.data?.status || null;
        setCampaignPaused(status === 'PAUSED');
      } catch { setCampaignPaused(false); }

      if (isAuthenticated) {
        const mine   = await campaignService.getMyCampaigns();
        const joined = Array.isArray(mine)
          ? mine.some(m => Number(m.product_id) === Number(p.productId) && (m.campaignStatus === 'ACTIVE' || m.campaignStatus === 'PAUSED'))
          : false;
        setHasJoined(joined);
        // Start polling for all users who are already in the deal (only when ACTIVE)
        if (joined && campaign) startPolling(p.productId, p.holdTarget);
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
        // Check if the current customer has purchased this product (for review eligibility)
        if (isAuthenticated) {
          try {
            const { data } = await reviewService.canReview(p.productId);
            setCanWriteReview(data?.canReview === true);
          } catch { setCanWriteReview(false); }
        }
      } catch { toast.error('Product not found'); navigate('/products'); }
      finally { setLoading(false); }
    })();
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !product) return;
    campaignService.getMyCampaigns().then(mine => {
      if (Array.isArray(mine)) {
        const joined = mine.some(
          m => Number(m.product_id) === Number(product.productId) && (m.campaignStatus === 'ACTIVE' || m.campaignStatus === 'PAUSED')
        );
        setHasJoined(joined);
      }
    }).catch(() => {});
  }, [isAuthenticated, product?.productId]);

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

  /* Opens the join modal for first-time join */
  const openJoinModal = () => {
    if (!isAuthenticated) { toast.error('Please sign in to join'); navigate('/login'); return; }
    setIsAddMore(false);
    setShowJoinModal(true);
  };

  /* Opens the join modal for adding more units when already joined */
  const openAddMoreModal = () => {
    if (!isAuthenticated) { toast.error('Please sign in'); navigate('/login'); return; }
    setIsAddMore(true);
    setShowJoinModal(true);
  };

  /* Called by JoinDealModal after a successful join/payment */
  const handleJoinSuccess = async (qty) => {
    setShowJoinModal(false);
    setHasJoined(true);
    // Optimistically update the count immediately so UI feels responsive
    const optimisticHold = Math.min(localHold + qty, product.holdTarget);
    setLocalHold(optimisticHold);
    window.dispatchEvent(new CustomEvent('campaignJoined', { detail: { productId: product.productId } }));

    try {
      // Sync with real server data
      const p = await productService.getProduct(id);
      setProduct(p);
      const realHold = p.currentHold || optimisticHold;
      setLocalHold(realHold);

      if (realHold >= product.holdTarget) {
        // This user's join completed the deal — redirect immediately
        stopPolling();
        toast.success('🎉 Target reached! Redirecting to your cart…', { duration: 3000 });
        setTimeout(() => navigate('/cart'), 2000);
      } else {
        // Deal not yet complete — start polling so this user gets redirected when others fill remaining slots
        toast.success(`Joined with ${qty} unit${qty > 1 ? 's' : ''}! You'll be redirected to cart once the target is reached.`);
        startPolling(product.productId, product.holdTarget);
        await loadCampaignStatus(p);
      }
    } catch {
      if (optimisticHold >= product.holdTarget) {
        stopPolling();
        toast.success('🎉 Target reached! Redirecting to your cart…', { duration: 3000 });
        setTimeout(() => navigate('/cart'), 2000);
      } else {
        toast.success(`Joined with ${qty} unit${qty > 1 ? 's' : ''}! You'll be redirected to cart once the target is reached.`);
        startPolling(product.productId, product.holdTarget);
      }
    }
  };

  /* Add more units when already joined */
  const handleAddProduct = async () => {
    if (!isAuthenticated) { toast.error('Please sign in'); navigate('/login'); return; }
    setJoinLoading(true);
    try {
      await campaignService.addToDeal({ productId: product.productId });
      const p = await productService.getProduct(id);
      setProduct(p);
      const realHold = p.currentHold || 0;
      setLocalHold(realHold);
      window.dispatchEvent(new CustomEvent('campaignJoined', { detail: { productId: product.productId } }));
      if (realHold >= product.holdTarget) {
        stopPolling();
        toast.success('🎉 Target reached! Redirecting to your cart…', { duration: 3000 });
        setTimeout(() => navigate('/cart'), 2000);
      } else {
        toast.success('Added to deal! You\'ll be redirected to cart once the target is reached.');
        await loadCampaignStatus(p);
      }
    } catch(e) {
      toast.error(e?.response?.data?.message || 'Failed to add to deal');
    } finally { setJoinLoading(false); }
  };

  const handleLeave = async () => {
    if (!activeCampaign) return;
    setJoinLoading(true);
    stopPolling(); // Stop polling — user no longer in deal
    try {
      await campaignService.leaveCampaign({ campaignId: activeCampaign.id });
      toast.success('Left group deal');
      setHasJoined(false);
      const p = await productService.getProduct(id);
      setProduct(p);
      setLocalHold(p.currentHold || 0);
      await loadCampaignStatus(p);
    } catch(e) { toast.error(e?.response?.data?.message || 'Failed to leave'); }
    finally { setJoinLoading(false); }
  };

  const handleReviewImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const combined = [...reviewImages, ...files].slice(0, 5); // max 5
    setReviewImages(combined);
    const previews = combined.map(f => URL.createObjectURL(f));
    setReviewImagePreviews(previews);
  };

  const removeReviewImage = (index) => {
    const newFiles = reviewImages.filter((_, i) => i !== index);
    const newPreviews = reviewImagePreviews.filter((_, i) => i !== index);
    setReviewImages(newFiles);
    setReviewImagePreviews(newPreviews);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please sign in to submit a review'); navigate('/login'); return; }
    if (!canWriteReview) { toast.error('Only customers who have purchased this product can write a review.'); return; }
    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('productId', product.productId);
      formData.append('rating', reviewForm.rating);
      formData.append('comment', reviewForm.comment);
      reviewImages.forEach(img => formData.append('reviewImages', img));
      await reviewService.addReview(formData);
      toast.success('Review submitted!');
      const r = await reviewService.getProductReviews(id);
      setReviews(Array.isArray(r) ? r : []);
      setReviewForm({ rating: 5, comment: '' });
      setReviewImages([]);
      setReviewImagePreviews([]);
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
  const safeHold     = Math.min(localHold, product.holdTarget || 0);
  const discountPct  = safeHold;
  const displayPrice = hasGroupBuy && discountPct > 0
    ? Math.round(product.retailPrice * (1 - discountPct / 100))
    : product.retailPrice;
  // If the campaign is PAUSED, treat product as out of stock for all customers.
  // (Existing holders can view the page but cannot buy.)
  const inStock      = product.stock > 0 && !campaignPaused;
  const maxDiscountPct = hasGroupBuy ? product.holdTarget : 0;
  const bestGroupPrice = hasGroupBuy
    ? Math.round(product.retailPrice * (1 - maxDiscountPct / 100))
    : product.retailPrice;

  const features = [
    product.category && `Category: ${product.category}`,
    inStock          && `In Stock: ${product.stock} units available`,
    product.warehouseLocation && `Dispatched from: ${product.warehouseLocation}`,
    'Quality Certified by HoldKart',
    '7-Day Returns',
  ].filter(Boolean);

  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 900;

  return (
    <div style={S.page}>
      {/* Join modal — shared with Home/Products page cards */}
      {showJoinModal && hasGroupBuy && (
        <JoinDealModal
          product={product}
          bestGroupPrice={bestGroupPrice}
          maxDiscountPct={maxDiscountPct}
          remainingSlots={Math.max(0, product.holdTarget - localHold)}
          onClose={() => setShowJoinModal(false)}
          onJoinSuccess={handleJoinSuccess}
          campaignAction={isAddMore ? async (qty) => {
            await campaignService.addToDeal({ productId: product.productId, quantity: qty });
          } : undefined}
        />
      )}

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
              <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                <span style={S.mainPrice}>
                  <span style={S.priceSymbol}>₹</span>
                  {displayPrice.toLocaleString('en-IN')}
                </span>
                {discountPct > 0 && (
                  <span style={{ fontSize: '0.88rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                    ₹{product.retailPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p style={S.taxNote}>Inclusive of all taxes</p>
            </div>

            {/* Group Deal — center column box; Join button opens the shared modal */}
            {hasGroupBuy && (
              <GroupBuySection
                product={product}
                localHold={localHold}
                onJoin={openJoinModal}
                onLeave={handleLeave}
                onAddProduct={handleAddProduct}
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
              {inStock ? 'In Stock' : campaignPaused ? 'Out of Stock' : 'Currently Unavailable'}
            </p>
            {campaignPaused && (
              <p style={{ fontSize: '0.78rem', color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, padding: '8px 12px', marginBottom: 10 }}>
                This campaign is temporarily paused. New purchases are unavailable right now.
              </p>
            )}

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

                {/* Buy box buttons */}
                {hasGroupBuy && hasJoined ? (
                  <>
                    <button style={S.addToCartBtn} onClick={handleCart}>
                      Add to Cart
                    </button>
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4, marginBottom: 10, textAlign: 'center' }}>
                      Buys at regular price with no discount
                    </p>
                    <button
                      onClick={openAddMoreModal}
                      style={{ ...S.buyNowBtn, cursor: 'pointer' }}
                    >
                      Add to Deal
                    </button>
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>
                      Added to cart at deal price once target is reached
                    </p>
                  </>
                ) : (
                  <>
                    {hasGroupBuy ? (
                      <>
                        <button style={S.addToCartBtn} onClick={handleCart}>
                          Add to Cart
                        </button>
                        <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4, marginBottom: 10, textAlign: 'center' }}>
                          Buys at regular price with no discount
                        </p>
                        {/* Buy box Join Group Deal — opens the same popup modal */}
                        <button
                          onClick={openJoinModal}
                          style={{ ...S.buyNowBtn, cursor: 'pointer' }}
                        >
                          Join Group Deal
                        </button>
                        <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>
                          Added to cart at deal price once target is reached
                        </p>
                      </>
                    ) : (
                      <>
                        <button style={S.addToCartBtn} onClick={handleCart}>Add to Cart</button>
                        <button style={S.buyNowBtn} onClick={handleBuyNow}>Buy Now</button>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <span style={S.wishlistLink} onClick={handleWishlist}>Add to Wishlist</span>

            <div style={S.divider} />

            {/* Trust badges */}
            <div style={S.badgeGrid}>
              {[['📦', 'Quality Certified'], ['🔄', '7-Day Returns'], ['🛡️', 'Warranty'], ['🚚', 'Fast Delivery']].map(([icon, label]) => (
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

              {/* Review form — only for customers who purchased this product */}
              {isAuthenticated && canWriteReview && (
                <div style={{ ...S.reviewCard, marginBottom: 24, background: '#fafbfc', border: '1px solid #e0e7ff' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.95rem', color: '#0f1111' }}>Write a Review</h3>
                  <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 14 }}>
                    ✅ Verified Purchase — you can review this product
                  </p>
                  <form onSubmit={handleReviewSubmit}>
                    {/* Star rating */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Rating</p>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1,2,3,4,5].map(s => (
                          <button type="button" key={s} onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                            style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                              color: s <= reviewForm.rating ? '#f0a500' : '#d1d5db', transition: 'color 0.1s' }}>
                            ★
                          </button>
                        ))}
                        <span style={{ marginLeft: 8, fontSize: '0.82rem', color: '#6b7280', alignSelf: 'center' }}>
                          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
                        </span>
                      </div>
                    </div>

                    {/* Comment */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Review</p>
                      <textarea
                        rows={3}
                        placeholder="Share your experience with this product — what did you like or dislike?"
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 6,
                          fontSize: '0.9rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Image upload — Flipkart-style */}
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                        Add Photos <span style={{ fontWeight: 400, color: '#9ca3af' }}>(up to 5)</span>
                      </p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {reviewImagePreviews.map((src, idx) => (
                          <div key={idx} style={{ position: 'relative', width: 72, height: 72, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => removeReviewImage(idx)}
                              style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                                background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%',
                                fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              ✕
                            </button>
                          </div>
                        ))}
                        {reviewImages.length < 5 && (
                          <button type="button" onClick={() => fileInputRef.current?.click()}
                            style={{ width: 72, height: 72, border: '1.5px dashed #a0aec0', borderRadius: 6, background: '#f9fafb',
                              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#6b7280' }}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📷</span>
                            <span style={{ fontSize: '0.65rem' }}>Add Photo</span>
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                          onChange={handleReviewImageChange}
                        />
                      </div>
                    </div>

                    <button type="submit"
                      style={{ padding: '9px 24px', background: '#f0c14b', border: '1px solid #a88734',
                        borderRadius: 20, fontWeight: 700, fontSize: '0.88rem', cursor: submittingReview ? 'not-allowed' : 'pointer',
                        opacity: submittingReview ? 0.7 : 1 }}
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
              ) : (
                <>
                  {(showAllReviews ? reviews : reviews.slice(0, 2)).map(r => (
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
                      {/* Review images */}
                      {r.images && r.images.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          {r.images.map((imgPath, imgIdx) => (
                            <a key={imgIdx} href={resolveReviewImg(imgPath)} target="_blank" rel="noreferrer"
                              style={{ display: 'block', width: 72, height: 72, borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                              <img src={resolveReviewImg(imgPath)} alt={`Review photo ${imgIdx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { e.target.style.display = 'none'; }} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {reviews.length > 2 && (
                    <div style={{ textAlign: 'center', marginTop: 8, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                      <button
                        onClick={() => setShowAllReviews(p => !p)}
                        style={{
                          background: 'none', border: '1.5px solid #e47911', borderRadius: 20,
                          color: '#e47911', fontWeight: 700, fontSize: '0.88rem',
                          padding: '8px 28px', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {showAllReviews ? 'Show less' : `See all ${reviews.length} reviews`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}