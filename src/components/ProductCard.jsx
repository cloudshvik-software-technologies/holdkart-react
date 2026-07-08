import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating.jsx';
import JoinDealModal from './JoinDealModal.jsx';
import { cartService, wishlistService, campaignService, productService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { addGuestCartItem } from '../utils/guestCart.js';
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
  const [showVariantPopover, setShowVariantPopover] = useState(false);
  const [variantDeals, setVariantDeals]   = useState([]);
  const [variantDealsLoading, setVariantDealsLoading] = useState(false);
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
    if (alreadyJoined && product.holdTarget > 0) {
      startPolling(product.productId, product.holdTarget);
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [alreadyJoined, product.productId]);

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

  // BUG FIX: the card shows the "best" deal variant's photo/price (e.g. the White
  // iPhone with 4/5 joined), but clicking it used to land on the product page with
  // no ?variant param — so the detail page's default-selection logic fell back to
  // whichever variant it found first (often a different colour, e.g. Black), not
  // the one actually pictured on the card. Passing the variant along keeps them in sync.
  const handleCardClick = () => {
    const suffix = product.campaignVariantId ? `?variant=${product.campaignVariantId}` : '';
    navigate(`/product/${product.productId}${suffix}`);
  };

  const handleCart = async (e) => {
    e.stopPropagation();
    setCartLoading(true);
    try {
      if (isAuthenticated) {
        await cartService.addToCart({ productId: product.productId, quantity: 1 });
      } else {
        addGuestCartItem(product, 1);
      }
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to cart');
    } finally { setCartLoading(false); }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please sign in to add to wishlist'); return; }
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
    if (!isAuthenticated) { toast.error('Please sign in to join the group deal'); return; }
    if (product.hasVariants) {
      // Confirm the product actually still has variant options configured
      // (the hasVariants flag can be stale) before sending the shopper to
      // the detail page. If it turns out there are none, join immediately.
      try {
        const list = await productService.getVariants(product.productId);
        if (Array.isArray(list) && list.length > 0) {
          navigate(`/product/${product.productId}${product.campaignVariantId ? `?variant=${product.campaignVariantId}` : ''}`);
          return;
        }
      } catch {
        navigate(`/product/${product.productId}${product.campaignVariantId ? `?variant=${product.campaignVariantId}` : ''}`);
        return;
      }
    }
    setShowJoinModal(true);
  };

  // Opens the "+N more variants on deal" popover, listing every colour/size
  // that currently has an active group deal so the shopper can jump straight
  // to whichever one they actually want (this card only ever shows one).
  const handleShowVariantDeals = async (e) => {
    e.stopPropagation();
    setShowVariantPopover(true);
    if (variantDeals.length || variantDealsLoading) return;
    setVariantDealsLoading(true);
    try {
      const [fullProduct, variantList] = await Promise.all([
        productService.getProduct(product.productId),
        productService.getVariants(product.productId),
      ]);
      const variants = Array.isArray(variantList) ? variantList : [];
      const campaigns = (fullProduct?.campaigns || []).filter(c => c.variantId != null);
      const rows = campaigns.map(c => {
        const v = variants.find(vv => vv.id === c.variantId);
        return {
          variantId: c.variantId,
          label: c.variantLabel || [v?.color, v?.size].filter(Boolean).join(' / '),
          color: v?.color || null,
          size: v?.size || null,
          image: v?.images?.[0]?.url || null,
          dealPrice: c.holdPrice,
          target: c.holdTarget,
          currentHold: c.currentHold,
        };
      }).sort((a, b) => (b.currentHold / (b.target || 1)) - (a.currentHold / (a.target || 1)));
      setVariantDeals(rows);
    } catch {
      setVariantDeals([]);
    } finally {
      setVariantDealsLoading(false);
    }
  };

  const handleSelectVariantDeal = (variantId) => {
    setShowVariantPopover(false);
    navigate(`/product/${product.productId}?variant=${variantId}`);
  };

  const handleJoinSuccess = (qty) => {
    setShowJoinModal(false);
    setHasJoined(true);
    const optimisticHold = Math.min(localHold + qty, product.holdTarget);
    setLocalHold(optimisticHold);
    window.dispatchEvent(new CustomEvent('campaignJoined', { detail: { productId: product.productId } }));

    if (optimisticHold >= product.holdTarget) {
      toast.success('🎉 Target reached! Redirecting to your cart…', { duration: 3000 });
      setTimeout(() => navigate('/cart'), 2000);
    } else {
      toast.success(`Joined with ${qty} unit${qty > 1 ? 's' : ''}! You'll be redirected to cart once the target is reached.`);
      startPolling(product.productId, product.holdTarget);
    }
  };

  const hasGroupDeal   = product.holdTarget > 0;
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
          remainingSlots={Math.max(0, product.holdTarget - localHold)}
          onClose={() => setShowJoinModal(false)}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
      {showVariantPopover && createPortal(
        <div
          onClick={(e) => { e.stopPropagation(); setShowVariantPopover(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, padding: '18px 16px',
              width: '100%', maxWidth: 380, maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
              fontFamily: "'Segoe UI', Arial, sans-serif",
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>Variants on deal</h3>
              <button
                onClick={() => setShowVariantPopover(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>

            {variantDealsLoading ? (
              <p style={{ fontSize: '0.82rem', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>Loading…</p>
            ) : variantDeals.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>No other variant deals right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {variantDeals.map(v => {
                  const pct = v.target > 0 ? Math.min(100, Math.round((v.currentHold / v.target) * 100)) : 0;
                  return (
                    <div
                      key={v.variantId}
                      onClick={() => handleSelectVariantDeal(v.variantId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                    >
                      <img
                        src={resolveImgSrc(v.image)}
                        alt={v.label || 'Variant'}
                        style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, background: '#f3f4f6', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111', margin: 0 }}>{v.label || 'Variant'}</p>
                        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', margin: '4px 0' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#16a34a' : '#2a5298', borderRadius: 99 }} />
                        </div>
                        <p style={{ fontSize: '0.68rem', color: '#6b7280', margin: 0 }}>{v.currentHold}/{v.target} joined</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>₹{Number(v.dealPrice).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      <div
        onClick={handleCardClick}
        style={{
          background: '#fff', borderRadius: 4, border: '1px solid #e3e6e6',
          overflow: 'hidden', cursor: 'pointer', display: 'flex',
          flexDirection: 'column', height: '100%',
          transition: 'box-shadow 0.2s, border-color 0.2s',
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
        <div className="hk-prodcard-img" style={{ background: '#f9fafb', overflow: 'hidden', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgSrc(FALLBACK_IMG)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Body */}
        <div style={{ padding: '6px 8px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: 2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {product.category}
          </p>
          <p style={{
            fontWeight: 500, fontSize: '0.88rem', color: '#1f2937',
            marginBottom: 3, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.3em',
          }}>
            {product.name}
          </p>

          {/* Which variant this card's deal price/photo belongs to, and whether other
              variants of the same product also have a deal running right now.
              Placed right under the product name so it reads as part of "what
              product/variant is this" rather than being mixed in with the buttons. */}
          {hasGroupDeal && (product.campaignVariantLabel || product.otherVariantDealsCount > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, flexWrap: 'nowrap', marginTop: 4, marginBottom: 10, minWidth: 0 }}>
              {product.campaignVariantLabel && (
                <span style={{
                  fontSize: '0.66rem', fontWeight: 700, color: '#374151', background: '#f3f4f6',
                  border: '1px solid #e5e7eb', borderRadius: 3, padding: '1px 5px',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {product.campaignVariantLabel}
                </span>
              )}
              {product.otherVariantDealsCount > 0 && (
                <button
                  onClick={handleShowVariantDeals}
                  className="hk-variant-deal-badge"
                  title="See all variants running a deal"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    fontSize: '0.66rem', fontWeight: 800, color: '#fff',
                    background: 'linear-gradient(135deg, #f97316, #dc2626)',
                    border: 'none', borderRadius: 20, padding: '3px 8px 3px 6px',
                    cursor: 'pointer', boxShadow: '0 1px 4px rgba(220,38,38,0.35)',
                    animation: 'hkVariantPulse 1.8s ease-in-out infinite',
                    minWidth: 0, flex: '0 1 auto', overflow: 'hidden',
                  }}
                >
                  <span aria-hidden="true" style={{ flexShrink: 0 }}>🔥</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    +{product.otherVariantDealsCount} more deal{product.otherVariantDealsCount > 1 ? 's' : ''}
                  </span>
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, height: '1rem', overflow: 'hidden' }}>
            {product.avgRating > 0 ? (
              <>
                <StarRating rating={product.avgRating} size="0.8rem" />
                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>({product.reviewCount})</span>
              </>
            ) : <span style={{ display: 'block' }} />}
          </div>


          {/* Group Deal progress (deal products) / stock & shipping info (non-deal products) —
              same skeleton sizing in both cases so the Price/Buttons row stays aligned
              across a grid row, whether or not that product has a running deal. */}
          <div style={{ marginBottom: 5 }}>
            <div style={{ height: 4, background: hasGroupDeal ? '#e5e7eb' : '#dcfce7', borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
              {hasGroupDeal ? (
                <div style={{
                  height: '100%', width: `${progressPct}%`, borderRadius: 99,
                  background: progressPct >= 100 ? '#16a34a' : '#2a5298',
                  transition: 'width 0.4s ease',
                }} />
              ) : (
                <div style={{ height: '100%', width: '100%', borderRadius: 99, background: '#16a34a' }} />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              {hasGroupDeal ? (
                <>
                  <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                    <span style={{ fontWeight: 700, color: '#1e3c72' }}>{safeHold}/{product.holdTarget}</span> joined
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>Group Deal</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700 }}>✓ In Stock</span>
                  <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>Fixed Price</span>
                </>
              )}
            </div>
            <div style={{ fontSize: '0.68rem', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 5, minHeight: '2.3em' }}>
              {hasGroupDeal ? (
                <>
                  <span style={{ color: '#1f2937', fontWeight: 700, fontSize: '0.67rem' }}>Best price on hold</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#dc2626', fontWeight: 800 }}>₹{bestGroupPrice.toLocaleString('en-IN')}</span>
                    <span className="hk-discount-badge" style={{ background: '#dc2626', color: '#fff', borderRadius: 3, padding: '1px 4px', whiteSpace: 'nowrap', flexShrink: 0 }}>{maxDiscountPct}% off</span>
                  </div>
                </>
              ) : (
                <span style={{ color: '#6b7280', fontSize: '0.65rem' }}>Ready to ship — no group deal needed</span>
              )}
            </div>
          </div>


          {/* Price */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1f2937' }}>
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <p style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 1 }}>Inclusive of all taxes</p>
          </div>

          {/* Buttons — pinned to the bottom of the card (marginTop: 'auto') so Join/Add
              to Cart line up across every card in a grid row, no matter how much
              badge/variant content ("Blue / L", "+1 more deal", etc.) sits above them. */}
          <div className="hk-card-btn-row" style={{ display: 'flex', gap: 6, minWidth: 0, marginTop: 'auto' }}>
            {hasGroupDeal && (
              hasJoined ? (
                <button disabled className="hk-card-btn" style={{
                  flex: 1, padding: '6px 8px', whiteSpace: 'nowrap',
                  background: '#d1fae5', border: '1px solid #6ee7b7',
                  borderRadius: 4, fontWeight: 700, fontSize: '0.78rem',
                  color: '#065f46', cursor: 'default',
                  minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  ✓ Joined
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  className="hk-card-btn"
                  style={{
                    flex: 1, padding: '6px 8px', whiteSpace: 'nowrap',
                    background: 'rgb(240 127 34)', border: '1px solid #994917',
                    borderRadius: 4, fontWeight: 700, fontSize: '0.78rem',
                    color: '#fff', cursor: 'pointer',
                    minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  Join
                </button>
              )
            )}
            <button
              onClick={handleCart}
              disabled={cartLoading}
              className="hk-card-btn"
              style={{
                flex: 1, padding: hasGroupDeal ? '6px 8px' : '6px 0', whiteSpace: 'nowrap',
                background: cartLoading ? '#e5e7eb' : 'linear-gradient(135deg, #2a5298, #1e3c72)',
                border: 'none', borderRadius: 4,
                fontWeight: 700, fontSize: '0.78rem',
                color: cartLoading ? '#9ca3af' : '#fff',
                cursor: cartLoading ? 'not-allowed' : 'pointer',
                minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {cartLoading ? '…' : 'Add to Cart'}
            </button>
          </div>

          <style>{`
            @keyframes hkVariantPulse {
              0%, 100% { box-shadow: 0 1px 4px rgba(220,38,38,0.35); transform: scale(1); }
              50% { box-shadow: 0 2px 10px rgba(220,38,38,0.55); transform: scale(1.035); }
            }
            .hk-variant-deal-badge:hover { filter: brightness(1.08); animation-play-state: paused; }
            /* ── Shrink deal-product action buttons on narrow/responsive screens so
                 Join + Add to Cart never get cut off / overflow the card width ── */
            @media (max-width: 768px) {
              .hk-card-btn-row { gap: 4px !important; }
              .hk-card-btn { padding: 6px 4px !important; font-size: 0.7rem !important; }
              .hk-discount-badge { padding: 1px 3px !important; font-size: 0.62rem !important; }
            }
            @media (max-width: 480px) {
              .hk-card-btn { padding: 6px 3px !important; font-size: 0.66rem !important; }
              .hk-discount-badge { font-size: 0.6rem !important; }
            }
            @media (max-width: 360px) {
              .hk-card-btn { padding: 5px 2px !important; font-size: 0.6rem !important; }
            }
          `}</style>
        </div>
      </div>
    </>
  );
}