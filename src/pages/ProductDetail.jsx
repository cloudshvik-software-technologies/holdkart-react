import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, cartService, wishlistService, reviewService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from '../components/StarRating.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f0f4f8'/%3E%3Crect x='220' y='110' width='160' height='130' rx='14' fill='%23d1d9e6'/%3E%3Ccircle cx='300' cy='148' r='26' fill='%23a0aec0'/%3E%3Cpath d='M230 235 Q300 165 370 235Z' fill='%23a0aec0'/%3E%3Ctext x='300' y='315' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

// Returns a relative /seller-uploads/... path so Vite proxy handles it in dev
// and the same origin serves it in production — no hardcoded localhost port.
function resolveSellerImg(url) {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith('http')) return url; // already absolute (external CDN etc.)
  const normalised = url.startsWith('/uploads')
    ? url.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${url.startsWith('/') ? '' : '/'}${url}`;
  return normalised; // relative path — browser resolves against current origin
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [mainImg, setMainImg] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('desc');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, r] = await Promise.all([productService.getProduct(id), reviewService.getProductReviews(id)]);
        setProduct(p);
        setMainImg(p.images?.[0] || '');
        setReviews(Array.isArray(r) ? r : []);
      } catch { toast.error('Product not found'); navigate('/products'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const getImgUrl = (url) => resolveSellerImg(url);

  const handleCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try { await cartService.addToCart({ productId: product.productId, quantity: qty }); toast.success('Added to cart!'); } catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try { await wishlistService.addToWishlist({ productId: product.productId }); toast.success('Added to wishlist!'); } catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    await handleCart();
    navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      await reviewService.addReview({ productId: product.productId, ...reviewForm });
      toast.success('Review submitted!');
      const r = await reviewService.getProductReviews(id);
      setReviews(Array.isArray(r) ? r : []);
      setReviewForm({ rating: 5, comment: '' });
    } catch(e) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setSubmittingReview(false); }
  };

  if (loading) return <div className="page-wrap" style={{ textAlign: 'center', paddingTop: 120 }}><div style={{ fontSize: '2rem' }}>Loading…</div></div>;
  if (!product) return null;

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) : 0;

  return (
    <div className="page-wrap">
      <button onClick={() => navigate(-1)} style={{ color: 'var(--blue)', fontWeight: 500, fontSize: '0.9rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}>← Back</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
        {/* Images */}
        <div>
          <img src={getImgUrl(mainImg)} alt={product.name} style={{ width: '100%', borderRadius: 16, aspectRatio: '4/3', objectFit: 'cover', boxShadow: 'var(--shadow)' }} onError={e => e.target.src = FALLBACK_IMG} />
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {product.images.map((img, i) => (
                <img key={i} src={getImgUrl(img)} alt="" onClick={() => setMainImg(img)} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: mainImg === img ? '2px solid var(--blue)' : '2px solid transparent', transition: 'border 0.2s' }} />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span style={{ background: 'var(--blue-pale)', color: 'var(--blue)', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600 }}>{product.category}</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '12px 0 8px', lineHeight: 1.2 }}>{product.name}</h1>
          {reviews.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <StarRating rating={avgRating} />
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--blue-dark)' }}>₹{product.retailPrice?.toLocaleString()}</span>
            {product.holdPrice && product.holdPrice !== product.retailPrice && (
              <span style={{ fontSize: '1rem', color: 'var(--muted)', textDecoration: 'line-through' }}>₹{product.holdPrice?.toLocaleString()}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Quantity:</span>
            <div className="qty-control">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{qty}</span>
              <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}>+</button>
            </div>
            <span style={{ fontSize: '0.82rem', color: product.stock > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
              {product.stock > 0 ? `✓ In Stock (${product.stock})` : '✗ Out of Stock'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '14px' }} onClick={handleBuyNow} disabled={!product.stock}>Buy Now</button>
            <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '14px' }} onClick={handleCart} disabled={!product.stock}>🛒 Add to Cart</button>
            <button onClick={handleWishlist} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '14px 18px', fontWeight: 600, cursor: 'pointer' }}>♡</button>
          </div>
          <div style={{ marginTop: 24, padding: 16, background: 'var(--blue-pale)', borderRadius: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['📦', 'Quality Certified'], ['🔄', '7-Day Returns'], ['🛡️', 'Warranty'], ['🚚', 'Fast Delivery']].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 500, color: 'var(--blue-dark)' }}>{icon} {label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        {[['desc', 'Description'], ['reviews', `Reviews (${reviews.length})`]].map(([key, label]) => (
          <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'desc' && (
        <div className="card">
          <p style={{ lineHeight: 1.8, color: 'var(--text)' }}>{product.description || 'No description available.'}</p>
        </div>
      )}

      {tab === 'reviews' && (
        <div>
          {isAuthenticated && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Write a Review</h3>
              <form onSubmit={handleReviewSubmit}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(s => (
                    <button type="button" key={s} onClick={() => setReviewForm(p => ({ ...p, rating: s }))} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: s <= reviewForm.rating ? '#f59e0b' : '#e5e7eb' }}>★</button>
                  ))}
                </div>
                <div className="form-group">
                  <textarea rows={3} placeholder="Share your experience…" value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} />
                </div>
                <button type="submit" className="btn-primary btn-sm" disabled={submittingReview}>{submittingReview ? 'Submitting…' : 'Submit Review'}</button>
              </form>
            </div>
          )}
          {reviews.length === 0 ? (
            <div className="empty-state"><div className="icon">⭐</div><h3>No reviews yet</h3><p>Be the first to review this product</p></div>
          ) : reviews.map(r => (
            <div key={r.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{r.customerName || 'Customer'}</span>
                  <div style={{ marginTop: 4 }}><StarRating rating={r.rating} size="0.85rem" /></div>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{new Date(r.created_date).toLocaleDateString()}</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}