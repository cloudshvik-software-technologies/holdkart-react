import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService, cartService, wishlistService, reviewService, campaignService, profileService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { addGuestCartItem } from '../utils/guestCart.js';
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

/* ─── Earphone keyword detection ─── */
const EARPHONE_KEYWORDS = [
  'earpod', 'earphone', 'earbud', 'earbuds', 'airpod', 'tws', 'in-ear',
  'noise cancelling', 'noise canceling', 'wireless earphone', 'bluetooth earphone',
  'headphone', 'headphones', 'headset', 'neckband', 'buds', 'earpiece',
];

function isEarphoneProduct(name = '') {
  const lower = name.toLowerCase();
  return EARPHONE_KEYWORDS.some(kw => lower.includes(kw));
}

// Extract a rough "brand" from the product name (first 1-2 words)
function extractBrand(name = '') {
  const words = name.trim().split(/\s+/);
  // Common brand indicators — use first word as brand
  return words[0]?.toLowerCase() || '';
}

// Turn a specs key like "skin_type" into a readable label like "Skin Type"
function specLabel(key = '') {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/* ─── styles ─── */
const S = {
  page: {
    background: '#f4f6fa',
    minHeight: '100vh',
    paddingTop: 112,
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
    gridTemplateColumns: '500px 1fr 280px',
    gap: 20,
    alignItems: 'stretch',
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
    color: '#1f2937',
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
  fixedPriceBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 6,
    padding: '10px 12px',
    marginBottom: 14,
  },
  fixedPriceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fixedPriceLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#15803d',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  fixedPriceTag: {
    fontSize: '0.78rem',
    color: '#16a34a',
    fontWeight: 600,
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
    color: inStock ? '#16a34a' : '#b12704',
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
    background: 'rgb(240 127 34)', 
    border: '1px solid #994917',
    borderRadius: 20,
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#fff',
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
    color: active ? '#1f2937' : '#6b7280',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: active ? '2px solid #2a5298' : '2px solid transparent',
    marginBottom: -2,
    background: 'none',
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
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 24px',
  },
  specsRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '1.05rem',
  },
  specsLabel: {
    color: '#6b7280',
    minWidth: 120,
    flexShrink: 0,
  },
  specsValue: {
    color: '#1f2937',
    fontWeight: 700,
    fontSize: '1.05rem',
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
  const { holdTarget, holdPrice, retailPrice } = product;
  if (!holdTarget || holdTarget <= 0) return null;

  // holdPrice is the absolute deal price; holdTarget is the number of slots needed
  const finalPrice      = holdPrice > 0 ? holdPrice : retailPrice;
  const discountPctFull = retailPrice > 0 ? Math.round((1 - finalPrice / retailPrice) * 100) : 0;
  const safeHold        = Math.min(localHold, holdTarget);
  const pct             = Math.round((safeHold / holdTarget) * 100);
  const remaining       = holdTarget - safeHold;
  // Current effective price scales toward deal price as more people join
  const discountedPrice = safeHold > 0
    ? Math.round(retailPrice - (retailPrice - finalPrice) * (safeHold / holdTarget))
    : retailPrice;

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
        <span style={{ fontWeight: 700, color: '#1f2937' }}>Best price on hold</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 800, color: '#dc2626' }}>₹{finalPrice.toLocaleString('en-IN')}</span>
          <span style={{ background: '#dc2626', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: '0.75rem' }}>{discountPctFull}% off</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: '0.78rem', color: '#1f2937', margin: 0 }}>
            {remaining > 0
              ? `${remaining} more member${remaining !== 1 ? 's' : ''} needed to unlock the price`
              : '\uD83C\uDF89 Target reached \u2014 deal unlocked!'}
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6,
            fontSize: '0.82rem', fontWeight: 700, color: '#15803d', whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>✓</span>
            Joined this deal
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {remaining > 0 && (
              <button onClick={onAddProduct} disabled={joinLoading} style={{ ...S.joinBtn(joinLoading), flex: 1 }}>
                {joinLoading ? 'Adding\u2026' : 'Add More'}
              </button>
            )}
            <button onClick={onLeave} disabled={joinLoading} style={{ ...S.leaveBtn, flex: remaining > 0 ? '0 0 auto' : 1 }}>Leave</button>
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
  const location     = useLocation();
  const { isAuthenticated } = useAuth();
  // A listing card (or the "+N more variants on deal" popover) can deep-link
  // straight to a specific colour/size via ?variant=<id> — e.g. tapping a
  // variant row should land here with that exact variant already selected,
  // not whichever one the default "closest to target" heuristic would pick.
  const requestedVariantId = new URLSearchParams(location.search).get('variant');

  const [product, setProduct]   = useState(null);
  // ── Variants (colour / size selector) ─────────────────────────────────────
  const [variants, setVariants]             = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [selectedColor, setSelectedColor]   = useState(null);
  const [selectedSize, setSelectedSize]     = useState(null);
  const [variantWarning, setVariantWarning] = useState(false);
  const variantSectionRef = useRef(null);
  const [reviews, setReviews]         = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { images: [...], index: 0, isReview: bool }
  const [productLightbox, setProductLightbox] = useState(null); // { index: 0 }
  const [similarProducts, setSimilarProducts] = useState([]);
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

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [youMayAlsoLike, setYouMayAlsoLike] = useState([]);

  const [activeCampaign, setActiveCampaign] = useState(null);
  // Campaign row IDs (from campaignRowId in getMyCampaigns) that this customer
  // currently holds an ACTIVE/PAUSED slot in, for this product. A product can
  // run a separate campaign per colour/size, so "has joined" must be checked
  // per campaign — not just per product — otherwise joining one colour's deal
  // would incorrectly show every other colour/size as already joined too.
  const [myJoinedCampaignIds, setMyJoinedCampaignIds] = useState([]);
  // How many units the customer joined the current campaign with (mySlots
  // from getMyCampaigns) — used as the max for the "how many to leave" stepper.
  const [myJoinedQty, setMyJoinedQty] = useState(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveQty, setLeaveQty] = useState(1);
  const [joinLoading, setJoinLoading]       = useState(false);
  const [localHold, setLocalHold]           = useState(0);
  const [showJoinModal, setShowJoinModal]   = useState(false);
  const [isAddMore, setIsAddMore]           = useState(false);
  const [campaignPaused, setCampaignPaused] = useState(false); // true when seller has paused the campaign
  const [addedToCart, setAddedToCart] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(null); // { address, city, state, pincode, name }
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [manualPincode, setManualPincode] = useState('');
  const pollRef                             = useRef(null);

  // Poll campaign status every 4s while user has joined — redirect all participants when deal completes
  // BUG FIX: a product can run several campaigns at once, each scoped to a different
  // colour/size (e.g. Black / Desert / White / Natural iPhones each have their own
  // campaign row). Previously this matched purely on product_id, so it could pick up
  // *any* of those campaigns — often the wrong one — and overwrite a correct "4/5
  // joined" with another variant's "0/5", making the deal look reset a few seconds
  // after joining. Now it matches on the exact variant the shopper joined with too.
  const startPolling = useCallback((productId, holdTarget, variantId = null) => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(async () => {
      try {
        const campaigns = await campaignService.listCampaigns();
        const forProduct = Array.isArray(campaigns)
          ? campaigns.filter(c => Number(c.product_id) === Number(productId))
          : [];
        const active = variantId
          ? forProduct.find(c => Number(c.variant_id) === Number(variantId)) || null
          : forProduct.find(c => !c.variant_id) || null;
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
    // BUG FIX: this used to always set mainImg to p.images[0] — the base
    // product's default/first-uploaded photo (e.g. Green) — immediately on
    // load. For variant products, the correct variant (e.g. Blue, via a
    // ?variant= deep link or an active campaign) is only known once the
    // separate getVariants() call resolves a moment later. That gap caused a
    // visible flash: Green shows first, then swaps to Blue ~1s later once
    // variants finish loading. For products WITH variants, leave mainImg
    // blank here and let the variant-resolution effect (which fires as soon
    // as variants load) set it exactly once — so the wrong colour never
    // renders at all. Non-variant products are unaffected since there's
    // nothing to resolve.
    setMainImg(p.hasVariants ? '' : (p.images?.[0] || ''));
    setReviews((Array.isArray(r) ? r : []).map(rv => ({ ...rv, likes: rv.likes ?? 0, userVote: rv.userVote ?? null })));
    return p;
  };

  const loadCampaignStatus = async (p, variantIdOverride) => {
    if (!p?.holdTarget || p.holdTarget <= 0) return;
    try {
      const campaigns = await campaignService.listCampaigns();
      const forProduct = Array.isArray(campaigns)
        ? campaigns.filter(c => Number(c.product_id) === Number(p.productId))
        : [];
      // BUG FIX: don't just grab the first campaign for this product — several
      // colour/size variants can each be running their own deal at once. Match
      // the one for the currently selected variant (falling back to the first
      // one only when nothing is selected yet, e.g. on initial page load).
      const vid = variantIdOverride !== undefined ? variantIdOverride : (selectedVariant?.id ?? null);
      const campaign = (vid
        ? forProduct.find(c => Number(c.variant_id) === Number(vid))
        : forProduct.find(c => !c.variant_id)) || forProduct[0] || null;
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
        const mineForProduct = Array.isArray(mine)
          ? mine.filter(m => Number(m.product_id) === Number(p.productId) && (m.campaignStatus === 'ACTIVE' || m.campaignStatus === 'PAUSED'))
          : [];
        setMyJoinedCampaignIds(mineForProduct.map(m => Number(m.campaignRowId)));
        const matchedMine = mineForProduct.find(m => Number(m.campaignRowId) === Number(campaign?.id));
        setMyJoinedQty(matchedMine ? (Number(matchedMine.mySlots) || 1) : 0);
        // Start polling for all users who are already in the deal (only when ACTIVE)
        if (mineForProduct.length && campaign) startPolling(p.productId, p.holdTarget, campaign.variant_id || null);
      }
    } catch {
      /* no active campaign — fine */
    }
  };

  useEffect(() => {
    // BUG FIX: this is a client-side route change (the ProductDetail component
    // stays mounted; only the `id` param changes), and `loading` was only ever
    // set back to false in the finally below — never reset to true here. So on
    // every navigation AFTER the first (e.g. clicking a Recently Viewed or
    // You May Also Like card), the previous product's fully-rendered page —
    // old name, old price, old mainImg/colour — stayed on screen for as long
    // as the new product's network calls took, THEN swapped over. That's the
    // "shows the wrong product/variant for a second" flash. Resetting loading
    // and the product-scoped state immediately (before any await) makes the
    // page show its loading skeleton right away on every navigation, exactly
    // like a fresh page load, so nothing stale is ever visible.
    setLoading(true);
    setProduct(null);
    setVariants([]);
    setVariantsLoading(false);
    setMainImg('');
    setSelectedColor(null);
    setSelectedSize(null);
    (async () => {
      try {
        const p = await loadProduct();
        await loadCampaignStatus(p);
        // Fetch similar products with smart earphone-aware filtering
        if (p?.category) {
          try {
            const res = await productService.listProducts({ category: p.category, limit: 50 });
            const items = Array.isArray(res) ? res : (res?.products || res?.data || []);
            const others = items.filter(item => String(item.productId) !== String(p.productId));

            const currentIsEarphone = isEarphoneProduct(p.name);

            if (currentIsEarphone) {
              // Filter to earphone-type products only
              const earphones = others.filter(item => isEarphoneProduct(item.name));
              const currentBrand = extractBrand(p.name);

              // Group 1: same brand, same seller
              const sameBrandSameSeller = earphones.filter(item =>
                extractBrand(item.name) === currentBrand && item.sellerId === p.sellerId
              );
              // Group 2: same brand, different seller
              const sameBrandDiffSeller = earphones.filter(item =>
                extractBrand(item.name) === currentBrand && item.sellerId !== p.sellerId
              );
              // Group 3: different brand
              const otherBrands = earphones.filter(item =>
                extractBrand(item.name) !== currentBrand
              );

              const sorted = [
                ...sameBrandSameSeller,
                ...sameBrandDiffSeller,
                ...otherBrands,
              ].slice(0, 16);

              setSimilarProducts(sorted);
            } else {
              setSimilarProducts(others.slice(0, 12));
            }
          } catch { /* non-critical */ }
        }
        // Track this product in Recently Viewed (localStorage, max 10).
        // NOTE: at this point in the load sequence, variants/selectedColor/selectedSize
        // haven't resolved yet (they're set by a separate effect after this one runs),
        // so we can't know the exact variant being viewed here. A dedicated effect below
        // (keyed on product/selectedColor/selectedSize/mainImg) fills in the correct
        // variant image/id once that selection has actually settled.
        try {
          const stored = JSON.parse(localStorage.getItem('hk_recently_viewed') || '[]');
          const entry = {
            productId: p.productId, name: p.name, retailPrice: p.retailPrice,
            holdTarget: p.holdTarget, holdPrice: p.holdPrice, hasCampaign: p.hasCampaign,
            images: p.images, avgRating: p.avgRating,
            reviewCount: p.reviewCount, category: p.category,
            variantId: null, variantImage: null, variantColor: null, variantSize: null,
          };
          const filtered = stored.filter(x => String(x.productId) !== String(p.productId));
          const updated = [entry, ...filtered].slice(0, 10);
          localStorage.setItem('hk_recently_viewed', JSON.stringify(updated));
          // Show all except current
          setRecentlyViewed(updated.filter(x => String(x.productId) !== String(p.productId)));
        } catch { /* localStorage unavailable */ }

        // Track view server-side for personalised recommendations (logged-in only)
        if (isAuthenticated) {
          productService.trackProductView?.(p.productId);
        }

        // You May Also Like — try categories one by one until we collect 10 products
        try {
          const allCats = ['Electronics', 'Fashion', 'Beauty', 'Books', 'Health', 'Grocery', 'Sports', 'Toys', 'Automotive'];
          const otherCats = allCats.filter(c => c.toLowerCase() !== (p.category || '').toLowerCase());
          // Shuffle so we don't always hit the same category first
          const shuffled = otherCats.sort(() => Math.random() - 0.5);
          const collected = [];
          for (const cat of shuffled) {
            if (collected.length >= 10) break;
            try {
              const res2 = await productService.listProducts({ category: cat, limit: 10 });
              const items2 = Array.isArray(res2) ? res2 : (res2?.products || res2?.data || []);
              items2.forEach(item => {
                if (collected.length < 10 && !collected.find(x => x.productId === item.productId)) {
                  collected.push(item);
                }
              });
            } catch { /* skip this category */ }
          }
          // If still empty, fall back to same category excluding current product
          if (collected.length === 0) {
            try {
              const res3 = await productService.listProducts({ category: p.category, limit: 11 });
              const items3 = Array.isArray(res3) ? res3 : (res3?.products || res3?.data || []);
              items3.filter(item => String(item.productId) !== String(p.productId))
                    .slice(0, 10).forEach(item => collected.push(item));
            } catch { /* ignore */ }
          }
          if (collected.length > 0) setYouMayAlsoLike(collected);
        } catch { /* non-critical */ }
      } catch { toast.error('Product not found'); navigate('/products'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  // Fetch colour/size variants for this product (only when the seller has configured them)
  // and default-select the variant that currently has a deal/campaign running, if any —
  // falling back to the first variant otherwise, mirroring the seller portal's variant selector.
  // The customer can still freely switch colour/size afterwards.
  useEffect(() => {
    if (!product?.productId || !product?.hasVariants) { setVariants([]); setVariantsLoading(false); return; }
    setVariantsLoading(true);
    (async () => {
      try {
        const list = await productService.getVariants(product.productId);
        const arr = Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : []);
        setVariants(arr);
        if (arr.length) {
          // A deep link (e.g. the Home page's "+N more variants on deal"
          // popover) takes priority over the default heuristic below —
          // the shopper explicitly picked this colour/size before landing here.
          const requestedVariant = requestedVariantId
            ? arr.find(v => String(v.id) === String(requestedVariantId))
            : null;
          const dealCampaigns = (product.campaigns || []).filter(c => c.variantId != null);
          // BUG FIX: previously picked the first variant found in array order that
          // had ANY active deal — which could be a different variant than the one
          // the backend's top-level price fields (holdPrice/retailPrice) actually
          // reflect, since those are now resolved by highest current_hold (see
          // productService.js getProduct). Sorting by currentHold here too keeps
          // both in agreement, so the displayed variant/image always matches the
          // price shown for it.
          const bestDealCampaign = dealCampaigns.length
            ? [...dealCampaigns].sort((a, b) => (b.currentHold || 0) - (a.currentHold || 0))[0]
            : null;
          const dealVariant = bestDealCampaign
            ? arr.find(v => v.id === bestDealCampaign.variantId)
            : null;
          const defaultVariant = requestedVariant || dealVariant || arr[0];
          setSelectedColor(defaultVariant.color || null);
          setSelectedSize(defaultVariant.size || null);
        }
      } catch {
        setVariants([]);
      } finally {
        setVariantsLoading(false);
      }
    })();
  }, [product?.productId, product?.hasVariants, product?.campaigns]);

  // Switch the main image to the selected variant's own photo whenever the
  // colour/size selection changes (e.g. picking "Red" jumps the gallery to
  // the red product shots).
  //
  // BUG FIX: previously this only called setMainImg() when the newly
  // selected variant had at least one image of its own
  // (`if (v?.images?.length) setMainImg(...)`). If a variant had NO photo
  // uploaded for it — e.g. the seller only added a photo for "Blue" but not
  // "Green" — clicking "Green" left mainImg untouched, so the page kept
  // showing whatever was on screen before (Blue's photo), even though the
  // selected colour, price and stock had all correctly switched to Green.
  // That's what looked like "clicking Green redirects to Blue".
  //
  // Fix: always resolve and set an image on every colour/size change, using
  // the same fallback chain as `galleryImages` below (variant photo → base
  // product photo), so mainImg is never left stale.
  useEffect(() => {
    const v = variants.find(v => (v.color || null) === selectedColor && (v.size || null) === selectedSize);
    const fallbackImages = product?.images || [];
    const resolvedImg = v?.images?.length ? v.images[0].url : (fallbackImages[0] || '');
    setMainImg(resolvedImg);
  }, [variants, selectedColor, selectedSize, product?.images]);

  // Fill in the exact variant (colour/size/image/id) on the Recently Viewed entry
  // once the variant selection has settled — see the load-time effect above for why
  // this can't be done at initial save time. Runs for both variant and non-variant
  // products; for non-variant products selectedVariant is null and this just skips.
  //
  // BUG FIX: this used to read the `mainImg` state variable directly. Because state
  // updates aren't applied synchronously, on the very render where selectedColor just
  // switched (e.g. to Blue via a campaign/deep-link), this effect could still see the
  // PREVIOUS render's mainImg (e.g. Green) — a one-render-behind race. Normally a
  // second pass would self-correct it once mainImg finished updating, but if the
  // shopper navigated away before that second pass ran, the stale (wrong) image got
  // permanently saved to Recently Viewed. Fix: compute the resolved image directly
  // from variants/product here (same fallback chain as the mainImg effect above),
  // instead of depending on the mainImg state — so there's nothing to race.
  useEffect(() => {
    if (!product?.productId) return;
    const v = variants.find(v => (v.color || null) === selectedColor && (v.size || null) === selectedSize) || null;
    if (variants.length > 0 && !v) return; // variants exist but selection hasn't resolved yet
    const resolvedImg = v?.images?.length ? v.images[0].url : ((product?.images || [])[0] || null);
    try {
      const stored = JSON.parse(localStorage.getItem('hk_recently_viewed') || '[]');
      const idx = stored.findIndex(x => String(x.productId) === String(product.productId));
      if (idx === -1) return;
      stored[idx] = {
        ...stored[idx],
        variantId: v?.id ?? null,
        variantImage: resolvedImg,
        variantColor: selectedColor || null,
        variantSize: selectedSize || null,
      };
      localStorage.setItem('hk_recently_viewed', JSON.stringify(stored));
    } catch { /* localStorage unavailable */ }
  }, [product?.productId, product?.images, variants, selectedColor, selectedSize]);

  // Separately handle auth-dependent data (canReview) without re-fetching the whole product
  useEffect(() => {
    if (!isAuthenticated || !product) return;
    (async () => {
      try {
        const { data } = await reviewService.canReview(product.productId);
        setCanWriteReview(data?.canReview === true);
      } catch { setCanWriteReview(false); }
    })();
  }, [isAuthenticated, product?.productId]);

  useEffect(() => {
    if (!isAuthenticated || !product) return;
    campaignService.getMyCampaigns().then(mine => {
      if (Array.isArray(mine)) {
        const mineForProduct = mine.filter(
          m => Number(m.product_id) === Number(product.productId) && (m.campaignStatus === 'ACTIVE' || m.campaignStatus === 'PAUSED')
        );
        setMyJoinedCampaignIds(mineForProduct.map(m => Number(m.campaignRowId)));
      }
    }).catch(() => {});
  }, [isAuthenticated, product?.productId]);

  // Check if this product is already in the cart (persists across page visits / removes).
  // Only a REGULAR-priced row counts as "added via Add to Cart" — a DEAL row is
  // created automatically when the customer joins a Group Deal and must not make
  // the button read "Go to Cart" for a normal add they never actually did.
  // Also scoped to the exact colour/size currently selected — having "Brown / L"
  // in the cart shouldn't make "Blue / M" of the same product show "Go to Cart" too.
  useEffect(() => {
    if (!isAuthenticated || !product) return;
    cartService.getCart().then(res => {
      const items = Array.isArray(res) ? res : (res?.data?.items || res?.data || res?.items || []);
      const currentVariant = variants.find(v => (v.color || null) === selectedColor && (v.size || null) === selectedSize) || null;
      const inCart = Array.isArray(items) && items.some(item => {
        if (String(item.productId) !== String(product.productId)) return false;
        if (item.priceType === 'DEAL') return false;
        return currentVariant ? Number(item.variantId) === Number(currentVariant.id) : !item.variantId;
      });
      setAddedToCart(inCart);
    }).catch(() => {});
  }, [isAuthenticated, product?.productId, selectedColor, selectedSize, variants]);

  // Shared helper: fetch delivery estimate for a given pincode (used by manual entry,
  // saved profile address, and browser-geolocation auto-detect)
  const fetchDeliveryEstimate = useCallback(async (pincode, productId) => {
    setDeliveryLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/api/customer/product/${productId}/delivery-estimate?pincode=${pincode}`
      );
      const data = await res.json();
      if (data?.estimatedDate) {
        // Parse and format: "2025-06-12" or "12 Jun, Fri" style
        try {
          const d = new Date(data.estimatedDate);
          if (!isNaN(d)) {
            const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            setDeliveryDate(`${d.getDate()} ${months[d.getMonth()]}, ${days[d.getDay()]}`);
          } else {
            setDeliveryDate(data.estimatedDate);
          }
        } catch { setDeliveryDate(data.estimatedDate); }
      } else {
        setDeliveryDate(null);
      }
    } catch { setDeliveryDate(null); }
    finally { setDeliveryLoading(false); }
  }, []);

  // Fetch profile address and then delivery estimate
  useEffect(() => {
    if (!product) return;
    const fetchAddressAndEstimate = async () => {
      let pincode = null;
      if (isAuthenticated) {
        try {
          const profileRes = await profileService.getProfile();
          const p = profileRes?.data || profileRes;
          if (p?.pincode) {
            setDeliveryAddress({
              name: p.name || '',
              address: p.address || '',
              city: p.city || '',
              state: p.state || '',
              pincode: p.pincode,
            });
            pincode = p.pincode;
          }
        } catch { /* ignore */ }
      }
      if (pincode) {
        await fetchDeliveryEstimate(pincode, product.productId);
      }
    };
    fetchAddressAndEstimate();
  }, [isAuthenticated, product?.productId, fetchDeliveryEstimate]);

  // Auto-detect location via the browser's native geolocation prompt (same prompt Chrome
  // shows on flipkart.com) — only for users who don't already have a known pincode, and
  // only once per browser so we don't ask repeatedly. If denied/unsupported/fails, the
  // existing manual "Enter pincode" flow below keeps working exactly as before.
  useEffect(() => {
    if (!product) return;
    if (deliveryAddress?.pincode || manualPincode) return; // already have a pincode from profile/earlier
    if (typeof window === 'undefined' || !window.navigator?.geolocation) return;
    if (localStorage.getItem('locationPromptShown')) return;
    localStorage.setItem('locationPromptShown', '1');

    window.navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const pincode = data?.postcode;
          if (pincode && /^[1-9][0-9]{5}$/.test(pincode)) {
            setManualPincode(pincode);
            setDeliveryAddress(prev => ({
              ...(prev || {}),
              pincode,
              city: prev?.city || data.city || data.locality || '',
              state: prev?.state || data.principalSubdivision || '',
            }));
            await fetchDeliveryEstimate(pincode, product.productId);
          }
        } catch { /* reverse-geocoding failed — user can still enter pincode manually */ }
      },
      () => { /* user denied or location unavailable — manual entry remains available */ },
      { timeout: 8000 }
    );
  }, [product, deliveryAddress?.pincode, manualPincode, fetchDeliveryEstimate]);

  const handleSelectPincode = async (pincode) => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) return;
    setManualPincode(pincode);
    setShowAddressModal(false);
    setDeliveryAddress(prev => ({ ...(prev || {}), pincode }));
    await fetchDeliveryEstimate(pincode, product.productId);
  };

  const handleCart = async () => {
    if (addedToCart) { navigate('/cart'); return; }
    if (!requireVariantSelection()) return;
    try {
      if (isAuthenticated) {
        await cartService.addToCart({ productId: product.productId, variantId: selectedVariant?.id, quantity: qty });
      } else {
        addGuestCartItem(product, qty, selectedVariant);
      }
      toast.success('Added to cart!');
      setAddedToCart(true);
    }
    catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to add to wishlist'); navigate('/login'); return; }
    try { await wishlistService.addToWishlist({ productId: product.productId }); toast.success('Added to wishlist!'); }
    catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to purchase'); navigate('/login'); return; }
    if (!requireVariantSelection()) return;
    await handleCart();
    navigate('/cart');
  };

  /* Opens the join modal for first-time join */
  const openJoinModal = () => {
    if (!isAuthenticated) { toast.error('Please sign in to join'); navigate('/login'); return; }
    if (!requireVariantSelection()) return;
    setIsAddMore(false);
    setShowJoinModal(true);
  };

  /* Opens the join modal for adding more units when already joined */
  const openAddMoreModal = () => {
    if (!isAuthenticated) { toast.error('Please sign in'); navigate('/login'); return; }
    if (!requireVariantSelection()) return;
    setIsAddMore(true);
    setShowJoinModal(true);
  };

  /* Called by JoinDealModal after a successful join/payment */
  const handleJoinSuccess = async (qty) => {
    setShowJoinModal(false);
    // Only mark the campaign for the currently selected colour/size as joined —
    // other variants of this product may be running their own separate deals.
    if (matchedCampaign) {
      const joinedId = Number(matchedCampaign.id);
      setMyJoinedCampaignIds(prev => prev.includes(joinedId) ? prev : [...prev, joinedId]);
    }
    // Optimistically update the count immediately so UI feels responsive
    const optimisticHold = Math.min(localHold + qty, campaignHoldTarget);
    setLocalHold(optimisticHold);
    window.dispatchEvent(new CustomEvent('campaignJoined', { detail: { productId: product.productId } }));

    try {
      // Sync with real server data
      const p = await productService.getProduct(id);
      setProduct(p);
      const refreshedCampaign = hasVariants
        ? (p.campaigns || []).find(c => c.variantId != null && selectedVariant && c.variantId === selectedVariant.id)
        : (p.campaigns || []).find(c => c.variantId == null);
      const realHold = refreshedCampaign?.currentHold ?? optimisticHold;
      setLocalHold(realHold);

      if (realHold >= campaignHoldTarget) {
        // This user's join completed the deal — redirect immediately
        stopPolling();
        toast.success('🎉 Target reached! Redirecting to your cart…', { duration: 3000 });
        setTimeout(() => navigate('/cart'), 2000);
      } else {
        // Deal not yet complete — start polling so this user gets redirected when others fill remaining slots
        toast.success(`Joined with ${qty} unit${qty > 1 ? 's' : ''}! You'll be redirected to cart once the target is reached.`);
        startPolling(product.productId, campaignHoldTarget, selectedVariant?.id || null);
        await loadCampaignStatus(p);
      }
    } catch {
      if (optimisticHold >= campaignHoldTarget) {
        stopPolling();
        toast.success('🎉 Target reached! Redirecting to your cart…', { duration: 3000 });
        setTimeout(() => navigate('/cart'), 2000);
      } else {
        toast.success(`Joined with ${qty} unit${qty > 1 ? 's' : ''}! You'll be redirected to cart once the target is reached.`);
        startPolling(product.productId, campaignHoldTarget, selectedVariant?.id || null);
      }
    }
  };

  const openLeaveModal = async () => {
    if (!matchedCampaign) return;
    // BUG FIX: myJoinedQty (set inside loadCampaignStatus) is resolved against a
    // campaign row found via a separate listCampaigns() call/matching path, which
    // can disagree with `matchedCampaign` (resolved from product.campaigns) when a
    // product has more than one campaign row — e.g. after an auto-renew reset, or
    // right after the product/campaign was edited. When the two disagree, the
    // modal showed "0 units" even though the customer really holds slots. Refetch
    // fresh here, scoped to the exact matchedCampaign.id that Leave will actually
    // submit, so this can never drift out of sync again.
    let qty = myJoinedQty;
    try {
      const mine = await campaignService.getMyCampaigns();
      const mineEntry = Array.isArray(mine)
        ? mine.find(m => Number(m.campaignRowId) === Number(matchedCampaign.id))
        : null;
      if (mineEntry) qty = Number(mineEntry.mySlots) || 1;
    } catch { /* fall back to whatever we already had */ }
    setMyJoinedQty(qty);
    setLeaveQty(qty > 1 ? qty : 1);
    setShowLeaveModal(true);
  };

  const handleLeave = async (qty) => {
    if (!matchedCampaign) return;
    setJoinLoading(true);
    stopPolling(); // Stop polling — user no longer in deal
    try {
      const res = await campaignService.leaveCampaign({ campaignId: matchedCampaign.id, quantity: qty });
      toast.success(res?.message || 'Left group deal');
      setShowLeaveModal(false);
      if (!res?.remainingQuantity) {
        setMyJoinedCampaignIds(prev => prev.filter(id => id !== Number(matchedCampaign.id)));
      }
      const p = await productService.getProduct(id);
      setProduct(p);
      const refreshedCampaign = hasVariants
        ? (p.campaigns || []).find(c => c.variantId != null && selectedVariant && c.variantId === selectedVariant.id)
        : (p.campaigns || []).find(c => c.variantId == null);
      setLocalHold(refreshedCampaign?.currentHold || 0);
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
      setReviews((Array.isArray(r) ? r : []).map(rv => ({ ...rv, likes: rv.likes ?? 0, userVote: rv.userVote ?? null })));
      setReviewForm({ rating: 5, comment: '' });
      setReviewImages([]);
      setReviewImagePreviews([]);
    } catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setSubmittingReview(false); }
  };

  // Switching colour/size can move the shopper between a variant that's in
  // an active deal and one that isn't (or between two different deals with
  // different progress) — resync the joined-slot count whenever that happens.
  // Declared before the loading/!product early returns below so hook order
  // stays consistent across renders.
  useEffect(() => {
    if (!product) return;
    const hv = variants.length > 0;
    const sv = hv ? variants.find(v => (v.color || null) === selectedColor && (v.size || null) === selectedSize) || null : null;
    const mc = hv
      ? (product.campaigns || []).find(c => c.variantId != null && sv && c.variantId === sv.id) || null
      : (product.campaigns || []).find(c => c.variantId == null) || null;
    setLocalHold(mc?.currentHold || 0);
  }, [product, variants, selectedColor, selectedSize]);

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

  // ── Variant derivation ──────────────────────────────────────────────────
  // hasVariants / selectedVariant mirror the seller portal's variant model.
  // When a variant is selected, its price/stock/images take over from the
  // base product's — for products without variants, nothing here changes
  // (hasVariants is false and everything falls through to product.* as before).
  const hasVariants   = variants.length > 0;
  // Colours that have at least one size actively running a group deal are
  // shown first in the swatch list, followed by colours with no deal at all.
  const campaignVariantIds = new Set((product.campaigns || []).filter(c => c.variantId != null).map(c => c.variantId));
  const variantColors = [...new Set(variants.map(v => v.color).filter(Boolean))]
    .sort((a, b) => {
      const aHasDeal = variants.some(v => v.color === a && campaignVariantIds.has(v.id)) ? 1 : 0;
      const bHasDeal = variants.some(v => v.color === b && campaignVariantIds.has(v.id)) ? 1 : 0;
      return bHasDeal - aHasDeal;
    });
  const sizesForColor = selectedColor
    ? variants.filter(v => v.color === selectedColor).map(v => v.size).filter(Boolean)
    : [...new Set(variants.map(v => v.size).filter(Boolean))];
  const selectedVariant = hasVariants
    ? variants.find(v => (v.color || null) === selectedColor && (v.size || null) === selectedSize) || null
    : null;
  const effectiveRetailPrice = selectedVariant?.price != null ? selectedVariant.price : product.retailPrice;
  const galleryImages = (selectedVariant?.images?.length ? selectedVariant.images.map(im => im.url) : product.images) || [];
  // A product can run several campaigns at once, each scoped to a specific
  // colour/size — e.g. "Red / M" is in a deal while "Blue / L" of the same
  // product is not and is sold at the regular fixed price. Match the
  // currently selected variant against the product's active campaigns
  // (falling back to a whole-product campaign for products with no variants)
  // so the deal UI only appears for the exact combination actually on deal.
  const matchedCampaign = hasVariants
    ? (product.campaigns || []).find(c => c.variantId != null && selectedVariant && c.variantId === selectedVariant.id) || null
    : (product.campaigns || []).find(c => c.variantId == null) || null;
  // Whether the customer has joined THIS specific campaign (i.e. the deal for
  // the currently selected colour/size) — not just "joined some deal on this
  // product". Lets the customer join a different colour's deal independently.
  const hasJoined = matchedCampaign
    ? myJoinedCampaignIds.includes(Number(matchedCampaign.id))
    : false;

  // Blocks Add to Cart / Buy Now / Join Deal until a variant combination is
  // chosen (only when the product actually has variants configured).
  const requireVariantSelection = () => {
    if (!hasVariants || selectedVariant) return true;
    setVariantWarning(true);
    toast.error('Please select a colour and size before continuing');
    variantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  };

  // Switching colour/size can move the shopper between a variant that's in
  // an active deal and one that isn't (or between two different deals with
  // different progress) — resync happens in a useEffect declared earlier,
  // before this component's conditional early returns.

  const avgRating    = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) : 0;
  const hasGroupBuy  = !!matchedCampaign;
  const campaignHoldPrice  = matchedCampaign?.holdPrice  || 0;
  const campaignHoldTarget = matchedCampaign?.holdTarget || 0;
  const safeHold     = Math.min(localHold, campaignHoldTarget || 0);
  // Use holdPrice as the absolute deal price (set by seller on campaign)
  const bestGroupPrice = hasGroupBuy && campaignHoldPrice > 0
    ? campaignHoldPrice
    : effectiveRetailPrice;
  const maxDiscountPct = hasGroupBuy && effectiveRetailPrice > 0
    ? Math.round((1 - bestGroupPrice / effectiveRetailPrice) * 100)
    : 0;
  // Display price scales toward deal price proportionally as slots fill
  const displayPrice = hasGroupBuy && safeHold > 0 && campaignHoldTarget > 0
    ? Math.round(effectiveRetailPrice - (effectiveRetailPrice - bestGroupPrice) * (safeHold / campaignHoldTarget))
    : effectiveRetailPrice;
  // If the campaign is PAUSED, treat product as out of stock for all customers.
  // remainingStock is the number of units available for regular Add to Cart
  // (total stock minus slots committed to the active campaign) — uses the
  // selected variant's stock once one is chosen.
  const remainingStock = selectedVariant ? selectedVariant.availableStock : (product.remainingStock ?? product.stock);
  const inStock      = remainingStock > 0 && !campaignPaused;

  const features = [
    product.category && `Category: ${product.category}`,
    inStock          && `In Stock: ${remainingStock} unit${remainingStock !== 1 ? 's' : ''} available`,
    product.warehouseLocation && `Dispatched from: ${product.warehouseLocation}`,
    'Quality Certified by HoldKart',
    '7-Day Returns',
  ].filter(Boolean);

  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 900;

  // The Group Deal / Fixed Price box: for products with colour/size variants,
  // this is shown at the top of the right-hand Buy Box column instead of the
  // middle info column, so the deal is visible right away without scrolling
  // past the variant selector. Non-variant products keep the original placement.
  const dealBox = hasGroupBuy ? (
    <GroupBuySection
      product={{ ...product, retailPrice: effectiveRetailPrice, holdPrice: campaignHoldPrice, holdTarget: campaignHoldTarget }}
      localHold={localHold}
      onJoin={openJoinModal}
      onLeave={openLeaveModal}
      onAddProduct={openAddMoreModal}
      joinLoading={joinLoading}
      hasJoined={hasJoined}
    />
  ) : (
    <div style={S.fixedPriceBox}>
      <div style={S.fixedPriceHeader}>
        <span style={S.fixedPriceLabel}>
          <span style={{ fontSize: '1rem' }}>✓</span> Fixed Price
        </span>
        <span style={S.fixedPriceTag}>Ready to ship</span>
      </div>

      <div style={S.progressTrack}>
        <div style={{ ...S.progressFill(100), background: '#16a34a' }} />
      </div>

      <div style={{ fontSize: '0.8rem', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontWeight: 700, color: '#1f2937' }}>No group deal needed</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: '#16a34a', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: '0.75rem' }}>In stock</span>
        </div>
      </div>

      <div style={S.groupPriceRow}>
        <span style={{ ...S.groupDealPrice, color: '#15803d' }}>
          ₹{displayPrice.toLocaleString('en-IN')}
        </span>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#166534', margin: 0 }}>
        This item is available at a fixed price — no group buy required, ships right away.
      </p>
    </div>
  );

  return (
    <React.Fragment>
      <div className="hk-pd-page" style={S.page}>
      {/* Responsive overrides (mobile/tablet) — additive only, does not change desktop layout */}
      <style>{`
        @media (max-width: 900px) {
          .hk-pd-grid { grid-template-columns: 1fr !important; }
          .hk-pd-similar-grid { grid-template-columns: repeat(3, 1fr) !important; }
          /* Buy box and image col must not be sticky when columns stack */
          .hk-pd-buy-box { position: static !important; top: auto !important; }
          .hk-pd-img-col { position: static !important; top: auto !important; }
        }
        @media (max-width: 700px) {
          .hk-pd-badge-grid { grid-template-columns: 1fr !important; }
          .hk-pd-specs-grid { grid-template-columns: 1fr !important; }
          .hk-pd-lightbox-body { flex-direction: column !important; }
          .hk-pd-lightbox-panel { width: 100% !important; border-left: none !important; border-top: 1px solid #e5e7eb !important; max-height: 38vh !important; }
        }
        @media (max-width: 600px) {
          .hk-pd-similar-grid {
            display: flex !important;
            grid-template-columns: none !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x mandatory;
          }
          .hk-pd-similar-grid > div {
            flex: 0 0 calc((100% - 12px) / 2) !important;
            scroll-snap-align: start;
          }
        }
        /* Recently Viewed & You May Also Like — 2 cards on mobile, 5 on desktop */
        .hk-pd-rv-card, .hk-pd-ymal-card {
          min-width: calc((100% - 48px) / 5) !important;
          max-width: calc((100% - 48px) / 5) !important;
        }
        @media (max-width: 768px) {
          .hk-pd-rv-card, .hk-pd-ymal-card {
            min-width: calc((100% - 12px) / 2) !important;
            max-width: calc((100% - 12px) / 2) !important;
          }
          .hk-pd-scroll-arrow { display: none !important; }
        }
      `}</style>
      {/* Join modal — shared with Home/Products page cards */}
      {showJoinModal && hasGroupBuy && (
        <JoinDealModal
          product={{ ...product, retailPrice: effectiveRetailPrice }}
          variantId={selectedVariant?.id || null}
          variantLabel={selectedVariant ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(' / ') : null}
          bestGroupPrice={bestGroupPrice}
          maxDiscountPct={maxDiscountPct}
          remainingSlots={Math.max(0, campaignHoldTarget - localHold)}
          onClose={() => setShowJoinModal(false)}
          onJoinSuccess={handleJoinSuccess}
          campaignAction={isAddMore ? async (qty, paymentInfo = {}) => {
            await campaignService.addToDeal({
              productId: product.productId,
              variantId: selectedVariant?.id || null,
              quantity: qty,
              cashfreeOrderId: paymentInfo.cashfreeOrderId || null,
              depositAmount:   paymentInfo.depositAmount   || 0,
            });
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
          <span style={{ color: '#1f2937', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </span>
        </div>

        {/* ── 3-column product grid ── */}
        <div className="hk-pd-grid" style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '500px 1fr 280px',
          gap: 16,
          alignItems: 'flex-start',
          marginBottom: 20,
        }}>

          {/* ── Col 1: Images ── */}
          <div className="hk-pd-img-col" style={S.imageCol}>
            {variantsLoading ? (
              // While the variant fetch is still resolving (e.g. a ?variant= deep
              // link or an active campaign is about to select a specific colour),
              // show a neutral skeleton instead of any image — avoids a brief flash
              // of the wrong/default variant photo before the real one is ready.
              <div style={{ ...S.mainImg, background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)', backgroundSize: '400% 100%', animation: 'hkImgSkeleton 1.4s ease infinite', borderRadius: 8 }} />
            ) : (
              <div
                style={{ position: 'relative', cursor: 'zoom-in' }}
                onClick={() => setProductLightbox({ index: galleryImages?.indexOf(mainImg) >= 0 ? galleryImages.indexOf(mainImg) : 0 })}
              >
                <img
                  src={resolveSellerImg(mainImg)}
                  alt={product.name}
                  style={S.mainImg}
                  onError={e => { e.target.src = FALLBACK_IMG; }}
                />
              </div>
            )}
            <style>{`@keyframes hkImgSkeleton { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }`}</style>
            {/* Click to see full view */}
            <div
              onClick={() => setProductLightbox({ index: galleryImages?.indexOf(mainImg) >= 0 ? galleryImages.indexOf(mainImg) : 0 })}
              style={{ textAlign: 'center', marginBottom: 10, cursor: 'pointer' }}
            >
              <span style={{ fontSize: '0.8rem', color: '#2a5298', textDecoration: 'underline', fontWeight: 500 }}>
                Click to see full view
              </span>
            </div>
            {galleryImages?.length > 1 && (
              <div style={S.thumbRow}>
                {galleryImages.map((img, i) => (
                  <img
                    key={i}
                    src={resolveSellerImg(img)}
                    alt=""
                    onClick={() => setMainImg(img)}
                    onMouseEnter={() => setMainImg(img)}
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
                {maxDiscountPct > 0 && (
                  <span style={{ fontSize: '0.88rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                    ₹{effectiveRetailPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p style={S.taxNote}>Inclusive of all taxes</p>
            </div>

            {/* ── Variant selector (colour / size) — mirrors the seller portal's
                 variant swatches; only rendered when the seller has configured
                 variants for this product. Selecting a combination updates the
                 price, stock and (if that colour has its own photos) the gallery. ── */}
            {hasVariants && (
              <div ref={variantSectionRef} style={{
                marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e7eb',
                ...(variantWarning && !selectedVariant ? { outline: '2px solid #dc2626', outlineOffset: 6, borderRadius: 6 } : {}),
              }}>
                {variantColors.length > 0 && (
                  <div style={{ marginBottom: sizesForColor.length ? 14 : 0 }}>
                    <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: 8 }}>
                      Colour: <strong style={{ color: '#1f2937' }}>{selectedColor || 'Select'}</strong>
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {variantColors.map(color => {
                        const rep = variants.find(v => v.color === color); // representative variant for thumb/price
                        const thumb = rep?.images?.[0]?.url;
                        const active = color === selectedColor;
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              setSelectedColor(color);
                              setVariantWarning(false);
                              const stillValid = variants.some(v => v.color === color && v.size === selectedSize);
                              if (!stillValid) {
                                const firstForColor = variants.find(v => v.color === color);
                                setSelectedSize(firstForColor?.size || null);
                              }
                            }}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                              padding: 6, width: 76, borderRadius: 6, cursor: 'pointer',
                              background: '#fff', fontFamily: 'inherit',
                              border: active ? '2px solid #2a5298' : '1px solid #d1d5db',
                              boxShadow: active ? '0 0 0 1px #2a5298' : 'none',
                            }}
                          >
                            <img
                              src={resolveSellerImg(thumb)}
                              alt={color}
                              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, background: '#f9fafb' }}
                              onError={e => { e.target.src = FALLBACK_IMG; }}
                            />
                            <span style={{ fontSize: '0.72rem', color: '#374151', textAlign: 'center', lineHeight: 1.2 }}>{color}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sizesForColor.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: 8 }}>
                      Size: <strong style={{ color: '#1f2937' }}>{selectedSize || 'Select'}</strong>
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {[...new Set(sizesForColor)].map(size => {
                        const active = size === selectedSize;
                        const variantForSize = variants.find(v => v.color === selectedColor && v.size === size);
                        const outOfStock = variantForSize && variantForSize.availableStock <= 0;
                        const hasDeal = variantForSize && campaignVariantIds.has(variantForSize.id);
                        return (
                          <button
                            key={size}
                            disabled={outOfStock}
                            onClick={() => { setSelectedSize(size); setVariantWarning(false); }}
                            title={hasDeal ? 'Group deal available on this size' : undefined}
                            style={{
                              position: 'relative',
                              minWidth: 44, padding: '8px 14px', borderRadius: 6,
                              background: outOfStock ? '#f3f4f6' : '#fff', fontFamily: 'inherit',
                              border: active ? '2px solid #2a5298' : hasDeal ? '1px solid #16a34a' : '1px solid #d1d5db',
                              boxShadow: active ? '0 0 0 1px #2a5298' : 'none',
                              color: outOfStock ? '#9ca3af' : '#1f2937',
                              fontWeight: 600, fontSize: '0.85rem',
                              cursor: outOfStock ? 'not-allowed' : 'pointer',
                              textDecoration: outOfStock ? 'line-through' : 'none',
                            }}
                          >
                            {size}
                            {hasDeal && !outOfStock && (
                              <span style={{
                                position: 'absolute', top: -7, right: -7,
                                background: '#16a34a', color: '#fff',
                                fontSize: '0.55rem', fontWeight: 700, lineHeight: 1,
                                borderRadius: 8, padding: '2px 4px',
                                whiteSpace: 'nowrap', boxShadow: '0 0 0 2px #fff',
                              }}>
                                DEAL
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {sizesForColor.some(size => {
                      const v = variants.find(vv => vv.color === selectedColor && vv.size === size);
                      return v && campaignVariantIds.has(v.id);
                    }) && (
                      <p style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: 6, marginBottom: 0 }}>
                        ● Sizes marked DEAL have an active group deal at a lower price
                      </p>
                    )}
                  </div>
                )}

                {variantWarning && !selectedVariant && (
                  <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 8, marginBottom: 0 }}>
                    Please select a colour and size to continue.
                  </p>
                )}
              </div>
            )}

            {/* Group Deal — center column box; Join button opens the shared modal.
                 For products with colour/size variants, this box is shown at the
                 top of the right-hand Buy Box column instead (see Col 3 below),
                 so it stays visible right next to the variant selector. */}
            {!hasVariants && dealBox}

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
          <div className="hk-pd-buy-box" style={S.buyBox}>
            {/* For variant products, the deal box moves here (top-right) so it's
                 visible alongside colour/size selection instead of further down.
                 The negative side margins let it break out of the Buy Box's own
                 padding so it's as wide as the box was in the middle column. */}
            {hasVariants && (
              <div style={{ margin: '-4px -20px 14px', padding: '0 8px' }}>
                {dealBox}
              </div>
            )}

            <p style={S.buyBoxPrice}>
              <span style={{ fontSize: '1rem', verticalAlign: 'super' }}>₹</span>
              {displayPrice.toLocaleString('en-IN')}
            </p>

            {/* Delivery details */}
            <div style={{ marginBottom: 10 }}>
              {/* Address row */}
              <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 8, background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ fontSize: '1rem', marginTop: 1 }}></span>
                  <div style={{ flex: 1 }}>
                    {deliveryAddress?.pincode ? (
                      <div>
                        <span style={{ fontWeight: 700, color: '#1e3c72' }}>
                          {deliveryAddress.name ? deliveryAddress.name.split(' ')[0].toUpperCase() + '  ' : ''}
                        </span>
                        <span style={{ color: '#374151' }}>
                          {[deliveryAddress.address, deliveryAddress.city, deliveryAddress.state, deliveryAddress.pincode].filter(Boolean).join(', ')}
                        </span>
                        <span
                          onClick={() => setShowAddressModal(true)}
                          style={{ marginLeft: 8, color: '#2a5298', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}
                        >Change</span>
                      </div>
                    ) : (
                      <div>
                        <span style={{ color: '#6b7280' }}>Location not set </span>
                        <span
                          onClick={() => setShowAddressModal(true)}
                          style={{ color: '#2a5298', cursor: 'pointer', fontWeight: 600 }}
                        >Select delivery location ›</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Delivery date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, paddingTop: 6, borderTop: '1px solid #e0e7ff' }}>
                  <span style={{ fontSize: '1rem' }}></span>
                  {deliveryLoading ? (
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Checking delivery…</span>
                  ) : deliveryDate ? (
                    <span style={{ fontWeight: 700, color: '#111' }}>Delivery by {deliveryDate}</span>
                  ) : deliveryAddress?.pincode ? (
                    <span style={{ color: '#b45309', fontSize: '0.8rem' }}>Delivery estimate unavailable</span>
                  ) : (
                    <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Enter pincode to see delivery date</span>
                  )}
                </div>
              </div>

              {/* Sold by */}
              {product.sellerName && (
                <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 4 }}>
                  <span style={{ color: '#6b7280' }}>Sold by: </span>
                  <span style={{ color: '#2a5298', fontWeight: 600 }}>{product.sellerName}</span>
                </div>
              )}
              <div style={S.deliveryRow}>
                <span style={S.deliveryLabel}>Ships from:</span>
                <span>HoldKart Warehouse</span>
              </div>
            </div>

            <div style={S.divider} />

            {campaignPaused && (
              <p style={{ fontSize: '0.78rem', color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, padding: '8px 12px', marginBottom: 10 }}>
                This campaign is temporarily paused. New purchases are unavailable right now.
              </p>
            )}

            {inStock && (
              <>

                {/* Buy box buttons */}
                {hasGroupBuy && hasJoined ? (
                  <>
                    <button style={S.addToCartBtn} onClick={handleCart}>
                      {addedToCart ? 'Go to Cart' : 'Add to Cart'}
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
                          {addedToCart ? 'Go to Cart' : 'Add to Cart'}
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
                        <button style={S.addToCartBtn} onClick={handleCart}>{addedToCart ? 'Go to Cart' : 'Add to Cart'}</button>
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
            <div className="hk-pd-badge-grid" style={S.badgeGrid}>
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
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>Product Description</h2>
              <p style={{ lineHeight: 1.8, color: '#374151' }}>{product.description || 'No description available.'}</p>

              {product.specs && Object.keys(product.specs).length > 0 && (
                <>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', margin: '24px 0 16px' }}>Product Details</h2>
                  <div className="hk-pd-specs-grid" style={S.specsGrid}>
                    {Object.entries(product.specs)
                      .filter(([key, value]) => value !== '' && value != null && !key.toLowerCase().startsWith('ship'))
                      .map(([key, value]) => (
                        <div key={key} style={S.specsRow}>
                          <span style={S.specsLabel}>{specLabel(key)}</span>
                          <span style={S.specsValue}>{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0 0 4px 4px', padding: 24 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: 20 }}>
                Customer Reviews
              </h2>

              {reviews.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 700, color: '#1f2937', lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
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
                  <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.95rem', color: '#1f2937' }}>Write a Review</h3>
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
                      style={{ padding: '9px 24px', background: 'rgb(240 127 34)', border: '1px solid #994917',
                        borderRadius: 20, fontWeight: 700, fontSize: '0.88rem', color: '#fff', cursor: submittingReview ? 'not-allowed' : 'pointer',
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
                      {/* Header: avatar + name + stars + date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2a5298', color: '#fff',
                              fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', flexShrink: 0 }}>
                              {(r.customerName || 'C')[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1f2937' }}>
                              {r.customerName || 'Customer'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <StarRating rating={r.rating} size="0.85rem" />
                            <span style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#15803d',
                              border: '1px solid #bbf7d0', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                              ✓ Verified Purchase
                            </span>
                          </div>
                        </div>
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                          {new Date(r.created_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Comment */}
                      {r.comment && (
                        <p style={{ color: '#374151', fontSize: '0.88rem', lineHeight: 1.7, marginTop: 8 }}>{r.comment}</p>
                      )}

                      {/* Review images — thumbnails with lightbox */}
                      {r.images && r.images.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                          {r.images.map((imgPath, imgIdx) => {
                            const resolved = resolveReviewImg(imgPath);
                            const isLast = imgIdx === 3 && r.images.length > 4;
                            if (imgIdx >= 4) return null;
                            return (
                              <div
                                key={imgIdx}
                                onClick={() => setLightbox({ images: r.images.map(p => resolveReviewImg(p)), index: imgIdx })}
                                style={{ position: 'relative', width: 80, height: 80, borderRadius: 8,
                                  overflow: 'hidden', border: '2px solid #e5e7eb', cursor: 'zoom-in', flexShrink: 0 }}
                              >
                                <img src={resolved} alt={`Review photo ${imgIdx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  onError={e => { e.target.parentElement.style.display = 'none'; }} />
                                {isLast && (
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                                    +{r.images.length - 3}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Like / Dislike */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
                        paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Helpful?</span>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const reviewId = r.id;
                            const alreadyLiked = r.userVote === 'like';
                            // Optimistic update using total count
                            setReviews(prev => prev.map(rv => {
                              if (rv.id !== reviewId) return rv;
                              return {
                                ...rv,
                                userVote: alreadyLiked ? null : 'like',
                                likes: alreadyLiked ? Math.max((rv.likes || 1) - 1, 0) : (rv.likes || 0) + 1,
                                dislikes: rv.userVote === 'dislike' ? Math.max((rv.dislikes || 1) - 1, 0) : (rv.dislikes || 0),
                              };
                            }));
                            try {
                              // Server returns { likes, userVote } — interceptor already unwraps res.data
                              const res = await reviewService.toggleReviewLike(reviewId);
                              setReviews(prev => prev.map(rv =>
                                rv.id === reviewId
                                  ? { ...rv, likes: Number(res.likes), userVote: res.userVote }
                                  : rv
                              ));
                            } catch {
                              // Revert optimistic update on error
                              setReviews(prev => prev.map(rv => {
                                if (rv.id !== reviewId) return rv;
                                return {
                                  ...rv,
                                  userVote: alreadyLiked ? 'like' : null,
                                  likes: alreadyLiked ? (rv.likes || 0) + 1 : Math.max((rv.likes || 1) - 1, 0),
                                  dislikes: rv.userVote === 'dislike' ? Math.max((rv.dislikes || 1) - 1, 0) : (rv.dislikes || 0),
                                };
                              }));
                            }
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                            border: `1px solid ${r.userVote === 'like' ? '#2a5298' : '#d1d5db'}`,
                            borderRadius: 20, background: r.userVote === 'like' ? '#eef2ff' : '#fff',
                            color: r.userVote === 'like' ? '#2a5298' : '#374151',
                            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24"
                            fill={r.userVote === 'like' ? '#2a5298' : 'none'}
                            stroke={r.userVote === 'like' ? '#2a5298' : '#6b7280'} strokeWidth="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                          </svg>
                          {r.likes || 0}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setReviews(prev => prev.map(rv => {
                              if (rv.id !== r.id) return rv;
                              const alreadyDisliked = rv.userVote === 'dislike';
                              return {
                                ...rv,
                                userVote: alreadyDisliked ? null : 'dislike',
                                dislikes: alreadyDisliked ? Math.max((rv.dislikes || 1) - 1, 0) : (rv.dislikes || 0) + 1,
                                likes:    rv.userVote === 'like' ? Math.max((rv.likes || 1) - 1, 0) : (rv.likes || 0),
                              };
                            }));
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                            border: `1px solid ${r.userVote === 'dislike' ? '#dc2626' : '#d1d5db'}`,
                            borderRadius: 20, background: r.userVote === 'dislike' ? '#fef2f2' : '#fff',
                            color: r.userVote === 'dislike' ? '#dc2626' : '#374151',
                            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24"
                            fill={r.userVote === 'dislike' ? '#dc2626' : 'none'}
                            stroke={r.userVote === 'dislike' ? '#dc2626' : '#6b7280'} strokeWidth="2">
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                            <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                          </svg>
                          {r.dislikes || 0}
                        </button>
                      </div>
                    </div>
                  ))}
                  {reviews.length > 2 && (
                    <div style={{ textAlign: 'center', marginTop: 8, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                      <button
                        onClick={() => setShowAllReviews(p => !p)}
                        style={{ background: 'none', border: '1.5px solid #FF6B00', borderRadius: 20,
                          color: '#FF6B00', fontWeight: 700, fontSize: '0.88rem',
                          padding: '8px 28px', cursor: 'pointer', fontFamily: 'inherit' }}
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

        {/* ── Similar Products (earphone-aware) ── */}
        {similarProducts.length > 0 && (() => {
          const currentIsEarphone = isEarphoneProduct(product.name);
          const currentBrand = extractBrand(product.name);

          // Navigate to product and scroll page to top
          const goToProduct = (productId) => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            navigate(`/product/${productId}`);
          };

          // Reusable product card — fixed width so exactly 5 fit per row in the grid
          const renderCard = (item) => {
            const itemImg = resolveSellerImg(item.images?.[0] || '');
            const hasDiscount = item.holdTarget > 0;
            const discountedPrice = hasDiscount
              ? Math.round(item.retailPrice * (1 - item.holdTarget / 100))
              : item.retailPrice;
            return (
              <div
                key={item.productId}
                onClick={() => goToProduct(item.productId)}
                style={{ background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: '100%', aspectRatio: '1', background: '#f9fafb', overflow: 'hidden' }}>
                  <img src={itemImg} alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={e => { e.target.src = FALLBACK_IMG; }} />
                </div>
                <div style={{ padding: '10px 10px 12px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#1f2937', fontWeight: 500, lineHeight: 1.35,
                    marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#b12704' }}>
                      ₹{discountedPrice.toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                        ₹{item.retailPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  {hasDiscount && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#15803d', marginTop: 2, display: 'block' }}>
                      {item.holdTarget}% off (Group Deal)
                    </span>
                  )}
                </div>
              </div>
            );
          };

          // 5-per-row wrapping grid (no scroll, products wrap to next line)
          const renderGrid = (items) => (
            <div className="hk-pd-similar-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 12,
            }}>
              {items.map(item => renderCard(item))}
            </div>
          );

          const brandLabel = currentBrand.charAt(0).toUpperCase() + currentBrand.slice(1);

          // For earphone products, split into 3 groups
          const sameBrandSameSeller = currentIsEarphone
            ? similarProducts.filter(item => extractBrand(item.name) === currentBrand && item.sellerId === product.sellerId)
            : [];
          const sameBrandDiffSeller = currentIsEarphone
            ? similarProducts.filter(item => extractBrand(item.name) === currentBrand && item.sellerId !== product.sellerId)
            : [];
          const otherBrands = currentIsEarphone
            ? similarProducts.filter(item => extractBrand(item.name) !== currentBrand)
            : [];

          return (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {currentIsEarphone ? '🎧 More Earphones & Headphones' : 'Similar Products'}
                </h2>
                <span
                  onClick={() => navigate(`/products?category=${product.category}`)}
                  style={{ fontSize: '0.82rem', color: '#2a5298', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                >
                  See all in {product.category}
                </span>
              </div>

              {currentIsEarphone ? (
                <>
                  {sameBrandSameSeller.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2a5298',
                        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
                        borderLeft: '3px solid #2a5298', paddingLeft: 8, margin: '0 0 10px 0' }}>
                        {brandLabel} — Same Seller
                      </p>
                      {renderGrid(sameBrandSameSeller)}
                    </div>
                  )}
                  {sameBrandDiffSeller.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1',
                        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
                        borderLeft: '3px solid #0369a1', paddingLeft: 8, margin: '0 0 10px 0' }}>
                        {brandLabel} — Other Sellers
                      </p>
                      {renderGrid(sameBrandDiffSeller)}
                    </div>
                  )}
                  {otherBrands.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280',
                        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
                        borderLeft: '3px solid #9ca3af', paddingLeft: 8, margin: '0 0 10px 0' }}>
                        Other Brands
                      </p>
                      {renderGrid(otherBrands)}
                    </div>
                  )}
                </>
              ) : (
                renderGrid(similarProducts)
              )}
            </div>
          );
        })()}

        {/* ── Recently Viewed ── */}
        {recentlyViewed.length > 0 && (() => {
          // BUG FIX: previously navigated with no variant, so clicking a Recently
          // Viewed card (e.g. the Green shirt the shopper actually looked at) could
          // land on the product page defaulting to a different colour. Pass the
          // stored variantId along, same as the campaign deep-link elsewhere.
          const goToProduct = (pid, variantId) => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            navigate(`/product/${pid}${variantId ? `?variant=${variantId}` : ''}`);
          };
          // Each card is exactly 1/5 of container minus gaps; scroll by one full "page" of 5
          const CARD_W = 'calc((100% - 48px) / 5)'; // 4 gaps × 12px = 48px
          const SCROLL_AMT = 900;
          const rvScrollId = 'rv-scroll-track';
          return (
            <div style={{ marginTop: 36 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>Recently Viewed</h2>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#111', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={() => navigate('/products')}>
                  <span style={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1 }}>→</span>
                </div>
              </div>

              {/* Carousel with left/right arrow buttons */}
              <div style={{ position: 'relative' }}>
                {/* Left arrow */}
                <button
                  className="hk-pd-scroll-arrow"
                  onClick={() => document.getElementById(rvScrollId)?.scrollBy({ left: -SCROLL_AMT, behavior: 'smooth' })}
                  style={{ position: 'absolute', left: -18, top: '42%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #d1d5db',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
                    color: '#374151', fontWeight: 700 }}>‹</button>

                {/* Scrollable track — hidden scrollbar, snaps 5 at a time */}
                <div id={rvScrollId} style={{
                  display: 'flex', gap: 12, overflowX: 'auto',
                  scrollbarWidth: 'none', msOverflowStyle: 'none',
                  paddingBottom: 4,
                }}>
                  <style>{`#${rvScrollId}::-webkit-scrollbar{display:none}`}</style>

                  {recentlyViewed.map(item => {
                    // BUG FIX: previously always used item.images?.[0] — the base
                    // product's default photo — ignoring which variant the shopper
                    // actually viewed. Use the stored variantImage (captured from the
                    // exact colour/size they had selected) first, falling back to the
                    // base product image only for non-variant products / old entries
                    // saved before this fix.
                    const img = resolveSellerImg(item.variantImage || item.images?.[0] || '');
                    // BUG FIX: previously used item.holdTarget (number of participants
                    // needed, e.g. 5) as a discount PERCENTAGE. Compute the real
                    // discount from holdPrice vs retailPrice instead.
                    const hasDiscount = item.hasCampaign && item.holdPrice > 0 && item.retailPrice > 0 && item.holdPrice < item.retailPrice;
                    const discPrice = hasDiscount ? item.holdPrice : item.retailPrice;
                    const discPct = hasDiscount
                      ? Math.round(((item.retailPrice - item.holdPrice) / item.retailPrice) * 100)
                      : 0;
                    const isTrending = item.reviewCount > 10;
                    const isBestseller = item.avgRating >= 4.5;
                    return (
                      <div key={item.productId} className="hk-pd-rv-card" onClick={() => goToProduct(item.productId, item.variantId)}
                        style={{ minWidth: CARD_W, maxWidth: CARD_W, flexShrink: 0,
                          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                          overflow: 'hidden', cursor: 'pointer',
                          transition: 'box-shadow 0.15s, transform 0.15s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}
                      >
                        {/* Image + badges */}
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#f4f6fa', overflow: 'hidden' }}>
                          <img src={img} alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={e => { e.target.src = FALLBACK_IMG; }} />
                          {isTrending && !isBestseller && (
                            <div style={{ position: 'absolute', top: 8, left: 8, background: '#ff6b35',
                              color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                              Trending
                            </div>
                          )}
                          {isBestseller && (
                            <div style={{ position: 'absolute', top: 8, right: 8, background: '#2a5298',
                              color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                              Bestseller
                            </div>
                          )}
                          {item.avgRating > 0 && (
                            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.72)',
                              color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 7px',
                              borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {item.avgRating.toFixed(1)} <span style={{ color: '#ca8a04' }}>★</span>
                              {item.reviewCount > 0 && <span style={{ color: '#bbb', fontWeight: 400 }}>({item.reviewCount})</span>}
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div style={{ padding: '10px 10px 12px' }}>
                          <p style={{ fontSize: '0.8rem', color: '#1f2937', fontWeight: 500, lineHeight: 1.35,
                            marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.name}
                          </p>
                          {discPct > 0 && (
                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', margin: '0 0 3px' }}>
                              {discPct}% OFF
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>
                              ₹{discPrice.toLocaleString('en-IN')}
                            </span>
                            {discPct > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                                ₹{item.retailPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right arrow */}
                <button
                  className="hk-pd-scroll-arrow"
                  onClick={() => document.getElementById(rvScrollId)?.scrollBy({ left: SCROLL_AMT, behavior: 'smooth' })}
                  style={{ position: 'absolute', right: -18, top: '42%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #d1d5db',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
                    color: '#374151', fontWeight: 700 }}>›</button>
              </div>
            </div>
          );
        })()}

        {/* ── You May Also Like ── */}
        {(() => {
          if (youMayAlsoLike.length === 0) return null;
          const goToProduct = (pid) => { window.scrollTo({ top: 0, behavior: 'instant' }); navigate(`/product/${pid}`); };
          const CARD_W = 'calc((100% - 48px) / 5)';
          const SCROLL_AMT = 900;
          const ymalScrollId = 'ymal-scroll-track';
          return (
            <div style={{ marginTop: 36, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>You May Also Like</h2>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#e5e7eb', color: '#6b7280',
                  padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em' }}>AD</span>
              </div>

              <div style={{ position: 'relative' }}>
                {/* Left arrow */}
                <button
                  className="hk-pd-scroll-arrow"
                  onClick={() => document.getElementById(ymalScrollId)?.scrollBy({ left: -SCROLL_AMT, behavior: 'smooth' })}
                  style={{ position: 'absolute', left: -18, top: '42%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #d1d5db',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
                    color: '#374151', fontWeight: 700 }}>‹</button>

                {/* Scrollable track */}
                <div id={ymalScrollId} style={{
                  display: 'flex', gap: 12, overflowX: 'auto',
                  scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 4,
                }}>
                  <style>{`#${ymalScrollId}::-webkit-scrollbar{display:none}`}</style>

                  {youMayAlsoLike.map(item => {
                    // BUG FIX (image): this card used item.images?.[0] — the product's
                    // raw/default image list — which always shows whichever photo the
                    // seller uploaded first (e.g. Green), regardless of which variant's
                    // deal is actually running or how many people have joined it.
                    // item.imageUrl is the field the backend already resolves correctly
                    // (campaignVariantImage || images[0]) — i.e. the photo of whichever
                    // variant has the highest-joined ACTIVE campaign (see BEST_CAMPAIGN_ID
                    // in productService.js, ORDER BY current_hold DESC). Use that instead
                    // so the card always shows the same variant a customer would land on.
                    const img = resolveSellerImg(item.imageUrl || item.images?.[0] || '');
                    // BUG FIX (discount %): this previously treated item.holdTarget — the
                    // number of participants needed to complete the group deal (e.g. 5) —
                    // as if it were a discount PERCENTAGE, producing nonsense like "5% OFF"
                    // for a deal that's actually 18% off. Compute the real discount from
                    // holdPrice vs retailPrice instead, same as the main ProductCard does.
                    const hasDiscount = item.hasCampaign && item.holdPrice > 0 && item.retailPrice > 0 && item.holdPrice < item.retailPrice;
                    const discPrice = hasDiscount ? item.holdPrice : item.retailPrice;
                    const discPct = hasDiscount
                      ? Math.round(((item.retailPrice - item.holdPrice) / item.retailPrice) * 100)
                      : 0;
                    return (
                      <div key={item.productId} className="hk-pd-ymal-card" onClick={() => goToProduct(item.productId)}
                        style={{ minWidth: CARD_W, maxWidth: CARD_W, flexShrink: 0,
                          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                          overflow: 'hidden', cursor: 'pointer',
                          transition: 'box-shadow 0.15s, transform 0.15s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#f4f6fa', overflow: 'hidden' }}>
                          <img src={img} alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={e => { e.target.src = FALLBACK_IMG; }} />
                          {item.avgRating > 0 && (
                            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.72)',
                              color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '3px 7px',
                              borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {item.avgRating.toFixed(1)} <span style={{ color: '#ca8a04' }}>★</span>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '10px 10px 12px' }}>
                          <p style={{ fontSize: '0.8rem', color: '#1f2937', fontWeight: 500, lineHeight: 1.35,
                            marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.name}
                          </p>
                          {discPct > 0 && (
                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', margin: '0 0 3px' }}>
                              {discPct}% OFF
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>
                              ₹{discPrice.toLocaleString('en-IN')}
                            </span>
                            {discPct > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                                ₹{item.retailPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right arrow */}
                <button
                  className="hk-pd-scroll-arrow"
                  onClick={() => document.getElementById(ymalScrollId)?.scrollBy({ left: SCROLL_AMT, behavior: 'smooth' })}
                  style={{ position: 'absolute', right: -18, top: '42%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1px solid #d1d5db',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
                    color: '#374151', fontWeight: 700 }}>›</button>
              </div>
            </div>
          );
        })()}

      </div>
    </div>

    {/* ── Leave Group Deal Modal (choose how many units to leave) ── */}
    {showLeaveModal && (
      <div
        onClick={() => !joinLoading && setShowLeaveModal(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 380, padding: '24px 24px 20px' }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', color: '#1f2937' }}>Leave Group Deal</h3>
          <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: '#6b7280' }}>
            You joined this deal with {myJoinedQty} {myJoinedQty === 1 ? 'unit' : 'units'}. How many would you like to leave?
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 22 }}>
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
          <p style={{ margin: '0 0 18px', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center' }}>
            {leaveQty >= myJoinedQty
              ? "You'll leave the deal completely."
              : `You'll still have ${myJoinedQty - leaveQty} ${myJoinedQty - leaveQty === 1 ? 'unit' : 'units'} in this deal.`}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowLeaveModal(false)}
              disabled={joinLoading}
              style={{ flex: 1, padding: '10px 0', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >Cancel</button>
            <button
              type="button"
              onClick={() => handleLeave(leaveQty)}
              disabled={joinLoading}
              style={{ flex: 1, padding: '10px 0', borderRadius: 4, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >{joinLoading ? 'Leaving…' : 'Confirm'}</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Product Image Lightbox Modal (Amazon-style) ── */}
    {productLightbox && galleryImages?.length > 0 && (() => {
      const imgs = galleryImages.map(resolveSellerImg);
      const idx = productLightbox.index;
      const setIdx = (i) => setProductLightbox({ index: i });
      return (
        <div
          onClick={() => setProductLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 8, width: '95vw', maxWidth: 1100,
              height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
          >
            {/* Header: IMAGES tab only + close */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '0 24px', flexShrink: 0 }}>
              <button style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.95rem', color: '#1f2937',
                background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'default', borderBottom: '2.5px solid #1f2937', marginBottom: -1 }}>
                IMAGES
              </button>
              <button
                onClick={() => setProductLightbox(null)}
                style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: '#f3f4f6', cursor: 'pointer', fontSize: '1.2rem', color: '#374151',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
              >✕</button>
            </div>

            {/* Body: main image left, info+thumbs right */}
            <div className="hk-pd-lightbox-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
              {/* Main image area */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '32px 40px', position: 'relative', background: '#fff', minWidth: 0 }}>
                {imgs.length > 1 && (
                  <button
                    onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)}
                    style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                      width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.10)',
                      border: 'none', color: '#222', fontSize: '1.6rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                      transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.10)'}
                  >‹</button>
                )}
                <img
                  src={imgs[idx]}
                  alt={product.name}
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 6,
                    transition: 'opacity 0.15s' }}
                  onError={e => { e.target.src = FALLBACK_IMG; }}
                />
                {imgs.length > 1 && (
                  <button
                    onClick={() => setIdx((idx + 1) % imgs.length)}
                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                      width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.10)',
                      border: 'none', color: '#222', fontSize: '1.6rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                      transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.10)'}
                  >›</button>
                )}
                {/* Image counter */}
                {imgs.length > 1 && (
                  <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '0.78rem', fontWeight: 600,
                    padding: '4px 12px', borderRadius: 20 }}>
                    {idx + 1} / {imgs.length}
                  </div>
                )}
              </div>

              {/* Right panel: title + thumbnail grid */}
              <div className="hk-pd-lightbox-panel" style={{ width: 320, borderLeft: '1px solid #e5e7eb', padding: '24px 20px',
                overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                  {product.name}
                </p>
                {product.category && (
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>
                    Category: <strong style={{ color: '#1f2937' }}>{product.category}</strong>
                  </p>
                )}
                <div style={{ height: 1, background: '#e5e7eb' }} />
                {/* Thumbnail grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {imgs.map((src, i) => (
                    <div
                      key={i}
                      onClick={() => setIdx(i)}
                      style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                        border: i === idx ? '2.5px solid #2a5298' : '1.5px solid #e5e7eb',
                        opacity: i === idx ? 1 : 0.7,
                        transition: 'all 0.15s', boxShadow: i === idx ? '0 0 0 3px #dbeafe' : 'none' }}
                      onMouseEnter={e => { if (i !== idx) e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { if (i !== idx) e.currentTarget.style.opacity = '0.7'; }}
                    >
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.src = FALLBACK_IMG; }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })()}

    {/* ── Review Image Lightbox Modal ── */}
    {lightbox && (
      <div onClick={() => setLightbox(null)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => setLightbox(null)}
          style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.15)',
            border: 'none', color: '#fff', fontSize: '1.5rem', width: 40, height: 40,
            borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10 }}>✕</button>
        <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
          {lightbox.index + 1} / {lightbox.images.length}
        </div>
        {lightbox.images.length > 1 && (
          <button
            onClick={e => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length })); }}
            style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '1.5rem',
              width: 48, height: 48, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        )}
        <img src={lightbox.images[lightbox.index]} alt=""
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8,
            boxShadow: '0 4px 40px rgba(0,0,0,0.5)' }} />
        {lightbox.images.length > 1 && (
          <button
            onClick={e => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length })); }}
            style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '1.5rem',
              width: 48, height: 48, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        )}
        {lightbox.images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 8, padding: '0 20px',
            overflowX: 'auto', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            {lightbox.images.map((src, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: i })); }}
                style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
                  cursor: 'pointer', opacity: i === lightbox.index ? 1 : 0.6, transition: 'all 0.15s',
                  border: i === lightbox.index ? '2.5px solid #FF6B00' : '2px solid rgba(255,255,255,0.25)' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    )}
    {/* ── Address / Pincode Selection Modal ── */}
    {showAddressModal && (
      <div
        onClick={() => setShowAddressModal(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
            padding: '24px 20px 32px', boxShadow: '0 -4px 32px rgba(0,0,0,0.15)' }}
        >
          {/* Handle */}
          <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 99, margin: '0 auto 20px' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>Select delivery address</h3>
            <button onClick={() => setShowAddressModal(false)}
              style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#6b7280', cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>

          {/* Pincode input */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8,
              padding: '0 12px', background: '#f9fafb' }}>
              <span style={{ color: '#9ca3af', marginRight: 8, fontSize: '0.9rem' }}>🔍</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter pincode"
                value={manualPincode}
                onChange={e => setManualPincode(e.target.value.replace(/\D/g, ''))}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.9rem',
                  color: '#1f2937', width: '100%', padding: '10px 0' }}
              />
            </div>
            <button
              onClick={() => handleSelectPincode(manualPincode)}
              disabled={!/^[1-9][0-9]{5}$/.test(manualPincode)}
              style={{ padding: '10px 18px', background: /^[1-9][0-9]{5}$/.test(manualPincode) ? '#2a5298' : '#e5e7eb',
                color: /^[1-9][0-9]{5}$/.test(manualPincode) ? '#fff' : '#9ca3af',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: /^[1-9][0-9]{5}$/.test(manualPincode) ? 'pointer' : 'not-allowed' }}
            >
              Apply
            </button>
          </div>

          <div style={{ height: 1, background: '#e5e7eb', margin: '16px 0' }} />

          {/* Saved address */}
          <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 12 }}>Saved addresses</p>
          {isAuthenticated && deliveryAddress?.pincode ? (
            <div
              onClick={() => { setShowAddressModal(false); }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                border: '1.5px solid #2a5298', borderRadius: 8, cursor: 'pointer', background: '#f0f4ff' }}
            >
              <span style={{ fontSize: '1.2rem', marginTop: 2 }}>🏠</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e3c72', margin: '0 0 2px' }}>HOME</p>
                <p style={{ fontSize: '0.82rem', color: '#374151', margin: 0 }}>
                  {[deliveryAddress.address, deliveryAddress.city, deliveryAddress.state, deliveryAddress.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2a5298', fontSize: '0.88rem', padding: '4px 0' }}>
              <span style={{ fontSize: '1.1rem' }}>👤</span>
              {isAuthenticated
                ? <span style={{ color: '#6b7280' }}>No saved address — add one in your profile</span>
                : <span style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>Login to see saved addresses</span>
              }
            </div>
          )}
        </div>
      </div>
    )}
    </React.Fragment>
  );
}