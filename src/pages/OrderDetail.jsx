import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, reviewService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';

const fmtDate = (d, short = false) => {
  if (!d) return '—';
  const date = new Date(d);
  if (short) return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* Build a timeline of tracking steps from order data */
const buildTimeline = (order) => {
  const steps = [];
  const status = order.order_status;
  const created = order.created_date || order.created_at;
  const statusFlow = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const idx = statusFlow.indexOf(status);

  if (created) {
    steps.push({ label: 'Order Confirmed', date: fmtDate(created, true), time: new Date(created).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), done: true });
  }
  if (idx >= 3 || status === 'Shipped' || status === 'Delivered') {
    steps.push({ label: 'Shipped', date: fmtDate(created, true), time: 'Via Courier', done: true });
  }
  if (status === 'Delivered') {
    const deliveredDate = order.delivered_date || order.updated_at;
    steps.push({ label: 'Out For Delivery', date: fmtDate(deliveredDate, true), time: '', done: true });
    steps.push({ label: 'Delivered', date: fmtDate(deliveredDate, true), time: new Date(deliveredDate || created).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), done: true });
  }
  return steps;
};

export default function OrderDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdates, setShowUpdates] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [writeReview, setWriteReview] = useState({ rating: 0, comment: '', submitting: false, hover: 0, images: [], previews: [] });
  const [tracking, setTracking]       = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const handleReviewImages = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...writeReview.images, ...files].slice(0, 5);
    const newPreviews = newImages.map(f => URL.createObjectURL(f));
    setWriteReview(p => ({ ...p, images: newImages, previews: newPreviews }));
  };

  const removeReviewImage = (i) => {
    const images = writeReview.images.filter((_, idx) => idx !== i);
    const previews = writeReview.previews.filter((_, idx) => idx !== i);
    setWriteReview(p => ({ ...p, images, previews }));
  };

  const handleSubmitReview = async () => {
    if (!writeReview.rating) { alert('Please select a star rating.'); return; }
    setWriteReview(p => ({ ...p, submitting: true }));
    try {
      const fd = new FormData();
      fd.append('productId', order.product_id);
      fd.append('rating', writeReview.rating);
      fd.append('comment', writeReview.comment);
      writeReview.images.forEach(img => fd.append('reviewImages', img));
      await reviewService.addReview(fd);
      await fetchMyReview(order.id);
    } catch {
      alert('Failed to submit review. Please try again.');
    } finally {
      setWriteReview(p => ({ ...p, submitting: false }));
    }
  };

  const fetchMyReview = async (orderId) => {
    setReviewLoading(true);
    try {
      const data = await reviewService.getMyReview(orderId);
      setMyReview(data?.review || null);
    } catch {
      setMyReview(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview || deletingReview) return;
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setDeletingReview(true);
    try {
      await reviewService.deleteReview(myReview.id);
      setMyReview(null);
    } catch {
      alert('Failed to delete review. Please try again.');
    } finally {
      setDeletingReview(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    orderService.getOrder(id).then(ord => {
      setOrder(ord);
      if (ord?.order_status === 'Delivered') fetchMyReview(ord.id);
      // Fetch live Shiprocket tracking if order has an AWB code
      if (ord?.awb_code) {
        setTrackLoading(true);
        orderService.trackOrder(id)
          .then(t => setTracking(t?.tracking || null))
          .catch(() => setTracking(null))
          .finally(() => setTrackLoading(false));
      }
    }).catch(() => navigate('/orders')).finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  if (loading) return <div className="page-wrap">Loading…</div>;
  if (!order) return null;

  const timeline = buildTimeline(order);
  const total = Number(order.order_amount) || 0;
  const isCOD = (order.payment_method || '').toUpperCase().includes('COD') || (order.payment_method || '').toUpperCase().includes('CASH');
  const handlingFee = 0;
  const promiseFee = 0;
  const basePrice = total;

  const breadcrumb = [
    { label: 'Home', path: '/home' },
    { label: 'My Account', path: '/profile' },
    { label: 'My Orders', path: '/orders' },
    { label: order.order_number, path: null },
  ];

  return (
    <>
      <style>{`
        .od-wrap {
          padding: 100px 24px 60px;
          max-width: 1060px;
          margin: 0 auto;
        }
        .od-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.82rem; color: var(--muted);
          margin-bottom: 20px; flex-wrap: wrap;
        }
        .od-breadcrumb a { color: var(--muted); cursor: pointer; }
        .od-breadcrumb a:hover { color: var(--blue); }
        .od-breadcrumb .sep { color: #d1d5db; }
        .od-breadcrumb .cur { color: var(--text); font-weight: 500; }

        .od-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 760px) {
          .od-grid { grid-template-columns: 1fr; }
        }

        /* ── Left cards ── */
        .od-card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.07);
          padding: 20px;
          margin-bottom: 16px;
          font-size: 0.9rem;
        }

        /* tracking note */
        .od-track-note {
          font-size: 0.85rem;
          color: var(--text);
          line-height: 1.6;
          margin-bottom: 6px;
        }
        .od-manage-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 0 0;
          border-top: 1px solid var(--border);
          margin-top: 12px;
          font-size: 0.9rem; font-weight: 500; color: var(--text); cursor: pointer;
        }
        .od-manage-row svg { color: var(--muted); }

        /* product row */
        .od-prod-row {
          display: flex; gap: 16px; align-items: flex-start;
        }
        .od-prod-img {
          width: 80px; height: 80px; object-fit: contain;
          flex-shrink: 0; border-radius: 8px; background: #f9fafb;
          border: 1px solid var(--border);
        }
        .od-prod-img-placeholder {
          width: 80px; height: 80px; flex-shrink: 0; border-radius: 8px;
          background: #f9fafb; border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem;
        }
        .od-prod-name { font-weight: 600; font-size: 0.93rem; line-height: 1.4; margin-bottom: 4px; }
        .od-prod-variant { color: var(--muted); font-size: 0.82rem; margin-bottom: 4px; }
        .od-prod-seller { color: var(--muted); font-size: 0.82rem; margin-bottom: 6px; }
        .od-prod-price { font-weight: 700; font-size: 1rem; }

        /* timeline */
        .od-timeline { margin-top: 16px; }
        .od-tl-item {
          display: flex; align-items: flex-start; gap: 12px;
          position: relative; padding-bottom: 16px;
        }
        .od-tl-item:last-child { padding-bottom: 0; }
        .od-tl-dot-wrap {
          display: flex; flex-direction: column; align-items: center;
          flex-shrink: 0;
        }
        .od-tl-dot {
          width: 24px; height: 24px; border-radius: 50%;
          background: #16a34a;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 0.75rem; font-weight: 700;
          flex-shrink: 0;
        }
        .od-tl-line {
          width: 2px; flex: 1; background: #16a34a;
          min-height: 16px; margin-top: 2px;
        }
        .od-tl-label { font-weight: 600; font-size: 0.9rem; }
        .od-tl-date { color: var(--muted); font-size: 0.82rem; }

        .od-see-all {
          color: var(--blue); font-weight: 600; font-size: 0.88rem;
          cursor: pointer; display: flex; align-items: center; gap: 4px;
          margin-top: 14px; background: none; border: none;
        }

        /* chat */
        .od-chat-btn {
          width: 100%; border: none; background: none;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px; color: var(--text); font-size: 0.9rem; font-weight: 500;
          cursor: pointer; border-top: 1px solid var(--border); margin-top: 16px;
        }

        /* star rating */
        .od-stars { display: flex; gap: 6px; justify-content: center; margin-top: 12px; }
        .od-star { font-size: 1.6rem; color: #d1d5db; cursor: pointer; transition: color 0.15s; }
        .od-star:hover, .od-star.active { color: #f59e0b; }
        .od-rate-label { font-size: 0.85rem; color: var(--muted); display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }

        /* review display */
        .od-review-box {
          border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px;
        }
        .od-review-stars { display: flex; gap: 2px; margin-bottom: 6px; }
        .od-review-star { font-size: 1.2rem; }
        .od-review-comment { font-size: 0.88rem; color: var(--text); line-height: 1.5; margin-bottom: 10px; }
        .od-review-meta { font-size: 0.78rem; color: var(--muted); margin-bottom: 10px; }
        .od-delete-review-btn {
          display: inline-flex; align-items: center; gap: 6px;
          border: 1.5px solid #ef4444; border-radius: 8px; background: #fff;
          padding: 6px 14px; color: #ef4444; font-weight: 600;
          font-size: 0.82rem; cursor: pointer; font-family: inherit;
          transition: background 0.15s;
        }
        .od-delete-review-btn:hover { background: #fef2f2; }
        .od-delete-review-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .od-star-btn { background: none; border: none; font-size: 1.6rem; cursor: pointer; padding: 0 2px; line-height: 1; transition: transform 0.1s; }
        .od-star-btn:hover { transform: scale(1.2); }
        .od-review-textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; font-size: 0.88rem; font-family: inherit; resize: vertical; min-height: 80px; box-sizing: border-box; margin-top: 10px; }
        .od-review-textarea:focus { outline: none; border-color: #2a5298; }
        .od-submit-review-btn { margin-top: 12px; background: #e47911; color: #fff; border: none; border-radius: 20px; padding: 8px 22px; font-size: 0.88rem; font-weight: 600; cursor: pointer; font-family: inherit; }
        .od-submit-review-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .od-submit-review-btn:hover:not(:disabled) { background: #c96a00; }
        .od-img-upload-label { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; cursor: pointer; font-size: 0.84rem; color: #2a5298; font-weight: 500; border: 1px dashed #90a8d4; border-radius: 6px; padding: 7px 14px; }
        .od-img-upload-label:hover { background: #f0f4ff; }
        .od-img-previews { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .od-img-preview-wrap { position: relative; width: 72px; height: 72px; }
        .od-img-preview { width: 72px; height: 72px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
        .od-img-remove { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }

        /* order number footer */
        .od-order-num {
          font-size: 0.82rem; color: var(--muted);
          padding-top: 14px; border-top: 1px solid var(--border);
          margin-top: 16px; display: flex; align-items: center; gap: 6px;
        }

        /* ── Shipment tracking ── */
        .od-track-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .od-track-title { font-weight: 700; font-size: 0.95rem; }
        .od-track-badge {
          font-size: 0.75rem; font-weight: 700; padding: 3px 10px;
          border-radius: 20px; background: #dcfce7; color: #15803d;
        }
        .od-track-badge.pending { background: #fef9c3; color: #854d0e; }
        .od-track-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.83rem; color: var(--muted); margin-bottom: 6px;
        }
        .od-track-row span:last-child { color: var(--text); font-weight: 500; }
        .od-track-activities { margin-top: 14px; border-top: 1px solid var(--border); padding-top: 14px; }
        .od-track-act-item {
          display: flex; gap: 10px; align-items: flex-start; padding-bottom: 12px;
          position: relative;
        }
        .od-track-act-item:last-child { padding-bottom: 0; }
        .od-track-act-dot {
          width: 10px; height: 10px; border-radius: 50%; background: #2a5298;
          flex-shrink: 0; margin-top: 4px;
        }
        .od-track-act-dot.latest { background: #16a34a; width: 12px; height: 12px; }
        .od-track-act-line {
          position: absolute; left: 4px; top: 14px;
          width: 2px; height: calc(100% - 10px); background: #e5e7eb;
        }
        .od-track-act-item:last-child .od-track-act-line { display: none; }
        .od-track-act-desc { font-size: 0.83rem; color: var(--text); line-height: 1.45; }
        .od-track-act-time { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }


        .od-right-card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.07);
          padding: 20px;
          margin-bottom: 16px;
          font-size: 0.9rem;
        }
        .od-right-title { font-weight: 700; font-size: 0.95rem; margin-bottom: 14px; }
        .od-delivery-row {
          display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px;
        }
        .od-delivery-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .od-delivery-label { font-weight: 500; font-size: 0.85rem; }
        .od-delivery-val { color: var(--muted); font-size: 0.82rem; line-height: 1.5; }
        .od-person-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 4px;
        }

        /* price detail */
        .od-price-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 5px 0; font-size: 0.88rem;
        }
        .od-price-row.strike { color: var(--muted); text-decoration: line-through; }
        .od-price-row .val-strike { text-decoration: line-through; color: var(--muted); }
        .od-price-total {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0 0; font-weight: 700; font-size: 0.95rem;
          border-top: 1px dashed var(--border); margin-top: 8px;
        }
        .od-fees-sub {
          padding-left: 14px;
        }
        .od-fees-sub .od-price-row { color: var(--muted); font-size: 0.82rem; }
        .od-paid-by {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0 0; font-size: 0.88rem;
          border-top: 1px solid var(--border); margin-top: 8px;
        }

        /* download invoice btn */
        .od-dl-btn {
          width: 100%; border: 1.5px solid var(--border); background: #fff;
          border-radius: 8px; padding: 12px; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 12px; color: var(--text); transition: background 0.15s;
        }
        .od-dl-btn:hover { background: #f4f6fa; }

        /* ── MODAL ── */
        .od-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          z-index: 1000; display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .od-modal {
          background: #fff; border-radius: 12px;
          width: 100%; max-width: 480px; max-height: 80vh;
          display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .od-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px; border-bottom: 1px solid var(--border);
        }
        .od-modal-title { font-weight: 700; font-size: 1rem; }
        .od-modal-close {
          background: none; border: none; font-size: 1.3rem; cursor: pointer;
          color: var(--muted); line-height: 1; padding: 2px 6px;
        }
        .od-modal-body { overflow-y: auto; padding: 20px; flex: 1; }

        /* modal timeline */
        .od-mtl-item {
          position: relative; padding-left: 28px; padding-bottom: 20px;
        }
        .od-mtl-item:last-child { padding-bottom: 0; }
        .od-mtl-dot {
          position: absolute; left: 0; top: 4px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #16a34a; border: 2px solid #16a34a;
          display: flex; align-items: center; justify-content: center;
        }
        .od-mtl-line {
          position: absolute; left: 7px; top: 20px;
          width: 2px; height: calc(100% - 16px); background: #16a34a;
        }
        .od-mtl-item:last-child .od-mtl-line { display: none; }
        .od-mtl-header {
          font-weight: 700; font-size: 0.92rem; margin-bottom: 6px;
        }
        .od-mtl-header .od-mtl-time { font-weight: 400; color: var(--muted); font-size: 0.83rem; }
        .od-mtl-sub { font-size: 0.83rem; color: var(--text); margin-bottom: 2px; }
        .od-mtl-subtime { font-size: 0.78rem; color: var(--muted); }
      `}</style>

      <div className="od-wrap">
        {/* Breadcrumb */}
        <div className="od-breadcrumb">
          {breadcrumb.map((b, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span className="sep">›</span>}
              {b.path
                ? <a onClick={() => navigate(b.path)}>{b.label}</a>
                : <span className="cur">{b.label}</span>
              }
            </span>
          ))}
        </div>

        <div className="od-grid">
          {/* ─── LEFT ─── */}
          <div>
            {/* Product + status card */}
            <div className="od-card">
              <div className="od-prod-row">
                {order.product_image
                  ? <img src={order.product_image} alt={order.product_name} className="od-prod-img" />
                  : <div className="od-prod-img-placeholder">📦</div>
                }
                <div style={{ flex: 1 }}>
                  <div className="od-prod-name">{order.product_name}</div>
                  {order.variant && <div className="od-prod-variant">{order.variant}</div>}
                  {order.sellerName && <div className="od-prod-seller">Seller: {order.sellerName}</div>}
                  <div className="od-prod-price">₹{Number(order.order_amount).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="od-timeline">
                {timeline.map((step, i) => (
                  <div key={i} className="od-tl-item">
                    <div className="od-tl-dot-wrap">
                      <div className="od-tl-dot">✓</div>
                      {i < timeline.length - 1 && <div className="od-tl-line" />}
                    </div>
                    <div>
                      <div className="od-tl-label">{step.label}, {step.date}</div>
                      {step.time && <div className="od-tl-date">{step.time}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <button className="od-see-all" onClick={() => setShowUpdates(true)}>
                See All Updates ›
              </button>

              <div className="od-chat-btn" onClick={() => navigate('/complaints')}>
                <span>💬</span> Chat with us
              </div>
            </div>

            {/* Rate your experience */}
            {order.order_status === 'Delivered' && !reviewLoading && myReview && (
              <div className="od-card">
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>Your Review</div>
                <div className="od-review-box">
                  <div className="od-review-stars">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className="od-review-star" style={{ color: s <= myReview.rating ? '#16a34a' : '#d1d5db' }}>★</span>
                    ))}
                  </div>
                  {myReview.comment && (
                    <div className="od-review-comment">{myReview.comment}</div>
                  )}
                  {myReview.created_date && (
                    <div className="od-review-meta">Reviewed on {fmtDate(myReview.created_date)}</div>
                  )}
                  <button
                    className="od-delete-review-btn"
                    onClick={handleDeleteReview}
                    disabled={deletingReview}
                  >
                    {deletingReview ? 'Deleting…' : 'Delete Review'}
                  </button>
                </div>
              </div>
            )}

            {order.order_status === 'Delivered' && !reviewLoading && !myReview && (
              <div className="od-card">
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Rate this product</div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 12 }}>Share your experience to help other buyers</div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      className="od-star-btn"
                      style={{ color: s <= (writeReview.hover || writeReview.rating) ? '#16a34a' : '#d1d5db' }}
                      onMouseEnter={() => setWriteReview(p => ({ ...p, hover: s }))}
                      onMouseLeave={() => setWriteReview(p => ({ ...p, hover: 0 }))}
                      onClick={() => setWriteReview(p => ({ ...p, rating: s }))}
                    >★</button>
                  ))}
                  {writeReview.rating > 0 && (
                    <span style={{ fontSize: '0.82rem', color: '#6b7280', alignSelf: 'center', marginLeft: 6 }}>
                      {['','Terrible','Poor','Average','Good','Excellent'][writeReview.rating]}
                    </span>
                  )}
                </div>
                <textarea
                  className="od-review-textarea"
                  placeholder="Write your review here (optional)..."
                  value={writeReview.comment}
                  onChange={e => setWriteReview(p => ({ ...p, comment: e.target.value }))}
                />
                <div>
                  <label className="od-img-upload-label">
                    📷 Add Photos {writeReview.images.length > 0 && `(${writeReview.images.length}/5)`}
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleReviewImages} />
                  </label>
                  {writeReview.previews.length > 0 && (
                    <div className="od-img-previews">
                      {writeReview.previews.map((src, i) => (
                        <div key={i} className="od-img-preview-wrap">
                          <img src={src} className="od-img-preview" alt="" />
                          <button className="od-img-remove" onClick={() => removeReviewImage(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="od-submit-review-btn"
                  onClick={handleSubmitReview}
                  disabled={writeReview.submitting || !writeReview.rating}
                >
                  {writeReview.submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            )}

            {/* ── Shipment Tracking — only shown when AWB code exists ── */}
            {order.awb_code && (
              <div className="od-card">
                <div className="od-track-header">
                  <div className="od-track-title">🚚 Shipment Tracking</div>
                  {trackLoading && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Loading…</span>
                  )}
                  {!trackLoading && tracking && (
                    <span className={`od-track-badge ${tracking.currentStatus === 'Delivered' ? '' : 'pending'}`}>
                      {tracking.currentStatus}
                    </span>
                  )}
                </div>

                {/* AWB + Courier info */}
                <div className="od-track-row">
                  <span>AWB Number</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {order.awb_code}
                    <span style={{ cursor: 'pointer', color: 'var(--blue)', fontSize: '0.85rem' }}
                      onClick={() => navigator.clipboard?.writeText(order.awb_code)}>⧉</span>
                  </span>
                </div>
                {tracking?.courierName && (
                  <div className="od-track-row">
                    <span>Courier</span>
                    <span>{tracking.courierName}</span>
                  </div>
                )}
                {tracking?.etd && (
                  <div className="od-track-row">
                    <span>Expected Delivery</span>
                    <span>{fmtDate(tracking.etd)}</span>
                  </div>
                )}

                {/* No tracking data yet */}
                {!trackLoading && !tracking && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 6 }}>
                    Tracking details will appear once the courier picks up your order.
                  </p>
                )}

                {/* Activity timeline */}
                {!trackLoading && tracking?.activities?.length > 0 && (
                  <div className="od-track-activities">
                    {tracking.activities.slice(0, 5).map((act, i) => (
                      <div key={i} className="od-track-act-item">
                        <div className={`od-track-act-dot${i === 0 ? ' latest' : ''}`} />
                        {i < Math.min(tracking.activities.length, 5) - 1 && (
                          <div className="od-track-act-line" />
                        )}
                        <div>
                          <div className="od-track-act-desc">
                            {act.activity || act.sr_status || act.status || '—'}
                          </div>
                          {(act.date || act.updated_at) && (
                            <div className="od-track-act-time">
                              {new Date(act.date || act.updated_at).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                              {act.location ? ` · ${act.location}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Order number */}
            <div className="od-card" style={{ padding: '14px 20px' }}>
              <div className="od-order-num">
                Order #{order.order_number}
                <span style={{ cursor: 'pointer', color: 'var(--blue)', fontSize: '0.85rem' }}
                  onClick={() => navigator.clipboard?.writeText(order.order_number)}>⧉</span>
              </div>
            </div>
          </div>

          {/* ─── RIGHT ─── */}
          <div>
            {/* Delivery details */}
            <div className="od-right-card">
              <div className="od-right-title">Delivery details</div>
              <div className="od-delivery-row">
                <div className="od-delivery-icon">🏠</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="od-delivery-label">Home</span>
                  </div>
                  <div className="od-delivery-val">
                    {[order.address, order.city, order.state, order.pincode].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
              <div className="od-person-row">
                <div className="od-delivery-icon">👤</div>
                <div className="od-delivery-val">
                  {order.customer_name}
                  {order.customer_phone && ` ${order.customer_phone}`}
                </div>
              </div>
            </div>

            {/* Price details */}
            {(() => {
              const prodAmt   = Number(order.order_amount) || 0;
              const phFee     = Number(order.payment_handling_fee) || 0;
              const pfFee     = Number(order.platform_fee)         || 0;
              const ppFee     = Number(order.protect_promise_fee)  || 0;
              const totalFees = phFee + pfFee + ppFee;
              const grandTotal = prodAmt + totalFees;
              return (
                <div className="od-right-card">
                  <div className="od-right-title">Price details</div>

                  <div className="od-price-row">
                    <span>Listing price</span>
                    <span className="val-strike">₹{prodAmt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="od-price-row">
                    <span>Selling price</span>
                    <span>₹{prodAmt.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Total fees — only show if any fee exists */}
                  {totalFees > 0 && (
                    <>
                      <div className="od-price-row" style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setFeesOpen(f => !f)}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          Total fees <span style={{ fontSize: '0.8rem' }}>{feesOpen ? '∧' : '∨'}</span>
                        </span>
                        <span>₹{totalFees}</span>
                      </div>
                      {feesOpen && (
                        <div className="od-fees-sub">
                          {phFee > 0 && <div className="od-price-row"><span style={{ borderBottom: '1px dotted #9ca3af' }}>Payment Handling Fee</span><span>₹{phFee}</span></div>}
                          {pfFee > 0 && <div className="od-price-row"><span style={{ borderBottom: '1px dotted #9ca3af' }}>Platform fee</span><span>₹{pfFee}</span></div>}
                          {ppFee > 0 && <div className="od-price-row"><span style={{ borderBottom: '1px dotted #9ca3af' }}>Protect Promise Fee</span><span>₹{ppFee}</span></div>}
                        </div>
                      )}
                    </>
                  )}

                  <div className="od-price-total">
                    <span>Total amount</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="od-paid-by">
                    <span>Paid By</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                      {isCOD ? '💵' : '💳'} {isCOD ? 'Cash On Delivery' : (order.payment_method || 'Online')}
                    </span>
                  </div>

                  <button className="od-dl-btn" onClick={() => navigate(`/invoice/${id}`)}>
                    ⬇ Download Invoice
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── See All Updates Modal ── */}
      {showUpdates && (
        <div className="od-modal-overlay" onClick={() => setShowUpdates(false)}>
          <div className="od-modal" onClick={e => e.stopPropagation()}>
            <div className="od-modal-head">
              <div className="od-modal-title">Order Updates</div>
              <button className="od-modal-close" onClick={() => setShowUpdates(false)}>✕</button>
            </div>
            <div className="od-modal-body">
              {/* Detailed timeline */}
              {(() => {
                const created = order.created_date || order.created_at;
                const delivered = order.delivered_date || order.updated_at;
                const createdFmt = d => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + " '" + new Date(d).getFullYear().toString().slice(2);
                const timeFmt = d => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + (d ? '' : '');

                const events = [];

                events.push({
                  stage: 'Order Confirmed',
                  when: `${createdFmt(created)} - ${timeFmt(created)}`,
                  subs: [
                    { text: 'Your Order has been placed.', when: `${createdFmt(created)} - ${timeFmt(created)}` },
                    { text: 'Seller has processed your order.', when: null },
                    { text: 'Your item has been picked up by delivery partner.', when: null },
                  ]
                });

                if (['Shipped', 'Delivered'].includes(order.order_status)) {
                  events.push({
                    stage: 'Shipped',
                    when: `${createdFmt(created)} - ${timeFmt(created)}`,
                    subs: [
                      { text: `${order.sellerName || 'Courier Partner'}`, when: null, bold: true },
                      { text: 'Your item has been shipped.', when: `${createdFmt(created)} - ${timeFmt(created)}` },
                      { text: 'Your item has been received in the hub nearest to you', when: null },
                    ]
                  });
                }

                if (order.order_status === 'Delivered') {
                  events.push({
                    stage: 'Out For Delivery',
                    when: `${createdFmt(delivered)} - ${timeFmt(delivered)}`,
                    subs: [
                      { text: 'Your item is out for delivery', when: `${createdFmt(delivered)} - ${timeFmt(delivered)}` },
                    ]
                  });
                  events.push({
                    stage: 'Delivered',
                    when: `${createdFmt(delivered)} - ${timeFmt(delivered)}`,
                    subs: [
                      { text: 'Your item has been delivered', when: `${createdFmt(delivered)} - ${timeFmt(delivered)}` },
                    ]
                  });
                }

                return events.map((ev, i) => (
                  <div key={i} className="od-mtl-item">
                    <div className="od-mtl-dot">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />
                    </div>
                    <div className="od-mtl-line" />
                    <div className="od-mtl-header">
                      {ev.stage} <span className="od-mtl-time">{ev.when}</span>
                    </div>
                    {ev.subs.map((s, j) => (
                      <div key={j}>
                        <div className="od-mtl-sub" style={s.bold ? { fontWeight: 600 } : {}}>{s.text}</div>
                        {s.when && <div className="od-mtl-subtime">{s.when}</div>}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}