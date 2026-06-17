import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/index.js';
import { returnOrder as returnOrderApi } from '../services/order.service.js';
import { addReview } from '../services/review.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const fmtShort = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const PERIOD_OPTIONS = [
  { label: 'Past 3 months',  value: '3m' },
  { label: 'Past 6 months',  value: '6m' },
  { label: 'This year',      value: 'year' },
  { label: 'Last year',      value: 'lastyear' },
  { label: 'All time',       value: 'all' },
];

const FILTER_TABS = [
  { key: 'all',       label: 'Orders' },
  { key: 'open',      label: 'Open Orders' },
  { key: 'shipped',   label: 'Not Yet Delivered' },
  { key: 'cancelled', label: 'Cancelled Orders' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_DOT = {
  Pending:                { color: '#e47911', text: '#e47911' },
  Confirmed:              { color: '#2a5298', text: '#2a5298' },
  Processing:             { color: '#c7511f', text: '#c7511f' },
  Shipped:                { color: '#007600', text: '#007600' },
  Delivered:              { color: '#007600', text: '#007600' },
  Cancelled:              { color: '#c40000', text: '#c40000' },
  Returned:               { color: '#666',    text: '#666'    },
  'Cancellation Requested': { color: '#b7860b', text: '#b7860b' },
  'Return Requested':       { color: '#b7860b', text: '#b7860b' },
};

const CANCEL_REASONS = [
  'I want to change my delivery address',
  'I want to change the item or size',
  'I no longer need this item',
  'I found a better price elsewhere',
  'I ordered by mistake',
  'Expected delivery time is too long',
  'Other reason',
];

const RETURN_REASONS = [
  'Item is defective or damaged',
  'Item does not match description',
  'Wrong item was delivered',
  'Item is of poor quality',
  'I changed my mind',
  'Missing parts or accessories',
  'Other reason',
];

function matchesPeriod(order, period) {
  const d = new Date(order.created_date || order.created_at);
  const now = new Date();
  if (period === '3m')       return d >= new Date(now.setMonth(now.getMonth() - 3));
  if (period === '6m')       return d >= new Date(now.setMonth(now.getMonth() - 6));
  if (period === 'year')     return d.getFullYear() === new Date().getFullYear();
  if (period === 'lastyear') return d.getFullYear() === new Date().getFullYear() - 1;
  return true;
}

function matchesTab(order, tab) {
  const s = (order.order_status || '').toLowerCase();
  if (tab === 'all')       return true;
  if (tab === 'open')      return ['pending', 'confirmed', 'processing', 'cancellation requested'].includes(s);
  if (tab === 'shipped')   return s === 'shipped';
  if (tab === 'cancelled') return s === 'cancelled' || s === 'returned';
  if (tab === 'delivered') return s === 'delivered';
  return true;
}

/* ─── Cancel / Return Modal ───────────────────────────────────── */
function CancelModal({ order, onClose, onConfirm, submitting, mode = 'cancel' }) {
  // steps: 'reason' → 'resolution' → 'confirm' → 'done'
  const [step,       setStep]      = useState('reason');
  const [reason,     setReason]    = useState('');
  const [custom,     setCustom]    = useState('');
  const [resolution, setResolution] = useState(''); // 'Refund' | 'Replace'

  const isReturn        = mode === 'return';
  const isDelivered     = order.order_status === 'Delivered';
  const isPreShipment   = ['Pending', 'Confirmed'].includes(order.order_status);
  const approverLabel   = isPreShipment ? 'Holdkart' : 'the seller';
  const isOnline        = (order.payment_method || '').toLowerCase() === 'online';
  // COD orders: no money collected, so no refund card — show cancellation request instead
  const isCOD           = !isOnline;
  // Replacement card: delivered orders only
  const showReplacement = isDelivered;
  // COD + not delivered = single "Request Cancellation" card, no resolution choices
  const isCODCancelOnly = isCOD && !isDelivered;

  const hasReplacement  = !!(order.has_replacement || order.resolution_type === 'Replace');
  const reasons         = isReturn ? RETURN_REASONS : CANCEL_REASONS;
  const modalTitle      = isReturn ? 'Return / Replace Item' : 'Cancel Order';
  const reasonLabel     = isReturn ? 'Why do you want to return this item?' : 'Why do you want to cancel this item?';
  const doneTitle       = isReturn ? '🔄 Refund Request Submitted!' : '✅ Request Submitted!';
  const selectedReason  = reason === 'Other reason' ? custom.trim() : reason;
  const canProceed      = reason && (reason !== 'Other reason' || custom.trim().length > 0);

  const orderNum = order.order_number || String(order.id || order._id || '').slice(-8).toUpperCase();

  const handleConfirm = async () => {
    await onConfirm(order.id || order._id, selectedReason, resolution);
    setStep('done');
  };

  /* Step 1 — Reason */
  if (step === 'reason') return (
    <div className="cm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cm-box">
        <div className="cm-header">
          <h2 className="cm-title">{modalTitle}</h2>
          <button className="cm-close" onClick={onClose}>✕</button>
        </div>

        <div className="cm-order-info">
          <div className="cm-order-thumb">
            {order.product_image
              ? <img src={order.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              : <span style={{ fontSize: '1.8rem' }}>📦</span>}
          </div>
          <div>
            <div className="cm-order-name">{order.product_name}</div>
            <div className="cm-order-meta">Order #{orderNum} &nbsp;·&nbsp; Qty: {order.quantity || 1}</div>
            <div className="cm-order-meta">₹{(order.order_amount || 0).toLocaleString('en-IN')} &nbsp;·&nbsp; {order.payment_method || 'COD'}</div>
          </div>
        </div>

        <div className="cm-divider" />
        <p className="cm-label">{reasonLabel}</p>

        <div className="cm-reasons">
          {reasons.map(r => (
            <label key={r} className={`cm-reason ${reason === r ? 'selected' : ''}`}>
              <input type="radio" name="cancel_reason" value={r} checked={reason === r}
                onChange={() => setReason(r)} className="cm-radio" />
              <span>{r}</span>
            </label>
          ))}
        </div>

        {reason === 'Other reason' && (
          <textarea className="cm-textarea" placeholder="Please describe your reason..."
            value={custom} onChange={e => setCustom(e.target.value)} maxLength={300} rows={3} />
        )}

        <div className="cm-footer">
          <button className="cm-btn-outline" onClick={onClose}>Keep Order</button>
          <button className="cm-btn-primary" disabled={!canProceed}
            onClick={() => {
              if (isCODCancelOnly) {
                setResolution('Refund');
                setStep('confirm');
              } else {
                setStep('resolution');
              }
            }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  /* Step 2 — Resolution: Refund or Replace */
  if (step === 'resolution') return (
    <div className="cm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cm-box">
        <div className="cm-header">
          <h2 className="cm-title">How would you like to resolve this?</h2>
          <button className="cm-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '20px 20px 8px' }}>
          <p style={{ fontSize: '0.88rem', color: '#565959', marginBottom: 16 }}>
            {isPreShipment
              ? isOnline
                ? "Your order will be cancelled immediately and a refund will be initiated to your original payment method."
                : "Your order will be cancelled immediately. No charges apply."
              : "Your request will be sent to the seller for approval. Please choose how you'd like to proceed once approved:"}
          </p>

          {/* Refund option — online payments only */}
          {isOnline && (
            <label className={`cm-res-card ${resolution === 'Refund' ? 'selected' : ''}`}>
              <input type="radio" name="resolution" value="Refund"
                checked={resolution === 'Refund'} onChange={() => setResolution('Refund')}
                className="cm-radio" />
              <div className="cm-res-icon">💳</div>
              <div className="cm-res-body">
                <div className="cm-res-title">Request a Refund</div>
                <div className="cm-res-sub">
                  ₹{(order.order_amount || 0).toLocaleString('en-IN')} will be refunded to your original payment method within <strong>5–7 business days</strong> after {approverLabel} approves.
                </div>
              </div>
            </label>
          )}

          {/* Replace option — delivered orders only (both COD and online) */}
          {showReplacement && (
            !hasReplacement ? (
              <label className={`cm-res-card ${resolution === 'Replace' ? 'selected' : ''}`}>
                <input type="radio" name="resolution" value="Replace"
                  checked={resolution === 'Replace'} onChange={() => setResolution('Replace')}
                  className="cm-radio" />
                <div className="cm-res-icon">🔄</div>
                <div className="cm-res-body">
                  <div className="cm-res-title">Request a Replacement</div>
                  <div className="cm-res-sub">
                    The seller will send a replacement item once they approve your request. No additional charge.
                  </div>
                </div>
              </label>
            ) : (
              <div className="cm-res-card" style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}>
                <div className="cm-res-icon">🔄</div>
                <div className="cm-res-body">
                  <div className="cm-res-title">Request a Replacement</div>
                  <div className="cm-res-sub" style={{ color: '#c40000' }}>
                    A replacement has already been used for this product. Only one replacement is allowed per order.
                  </div>
                </div>
              </div>
            )
          )}

          <div className="cm-seller-notice">
            <span>ℹ️</span>
            <span>
              {isPreShipment
                ? isOnline
                  ? "Refund will be processed immediately upon cancellation."
                  : "Your order will be cancelled right away."
                : "Your request will be reviewed by the seller. You'll be notified once they respond."}
            </span>
          </div>
        </div>

        <div className="cm-footer">
          <button className="cm-btn-outline" onClick={() => setStep('reason')}>Back</button>
          <button className="cm-btn-primary" disabled={!resolution}
            onClick={() => setStep('confirm')}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  /* Step 3 — Confirm */
  if (step === 'confirm') return (
    <div className="cm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cm-box">
        <div className="cm-header">
          <h2 className="cm-title">Confirm Request</h2>
          <button className="cm-close" onClick={onClose}>✕</button>
        </div>

        <div className="cm-confirm-body">
          <div className="cm-confirm-icon">⚠️</div>
          <p className="cm-confirm-text">
            {isCODCancelOnly
              ? <>Cancel order for <strong>{order.product_name}</strong>?</>
              : <>Submit {isReturn ? 'return' : 'cancellation'} + <strong>{resolution}</strong> request for <strong>{order.product_name}</strong>?</>}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <div className="cm-reason-chip">
              <span className="cm-reason-chip-label">Reason:</span> {selectedReason}
            </div>
            {!isCODCancelOnly && (
              <div className={`cm-reason-chip ${resolution === 'Replace' ? 'replace' : 'refund'}`}>
                <span className="cm-reason-chip-label">Resolution:</span> {resolution}
              </div>
            )}
          </div>

          <div className="cm-seller-notice" style={{ textAlign: 'left' }}>
            <span>ℹ️</span>
            <div>
              {isPreShipment ? (
                <>
                  <strong>{isOnline ? 'Order will be cancelled & refund initiated immediately' : 'Order will be cancelled immediately'}</strong>
                  <div style={{ fontSize: '0.8rem', marginTop: 2 }}>
                    {isOnline
                      ? `Your order will be cancelled and ₹${(order.order_amount || 0).toLocaleString('en-IN')} will be refunded to your original payment method within 5–7 business days.`
                      : 'Your order will be cancelled right away. No charges apply.'}
                  </div>
                </>
              ) : (
                <>
                  <strong>Pending seller approval</strong>
                  <div style={{ fontSize: '0.8rem', marginTop: 2 }}>
                    Your order status will change to <em>"{isReturn ? 'Return Requested' : 'Cancellation Requested'}"</em>. The seller will review and approve or reject within 24–48 hours.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="cm-footer">
          <button className="cm-btn-outline" onClick={() => isCODCancelOnly ? setStep('reason') : setStep('resolution')}>Back</button>
          <button className="cm-btn-danger" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );

  /* Step 4 — Done */
  return (
    <div className="cm-overlay">
      <div className="cm-box">
        <div className="cm-done-body">
          <div className="cm-done-icon">{isReturn ? '🔄' : '✅'}</div>
          <h2 className="cm-done-title" style={{ color: isReturn ? '#007185' : '#007600' }}>{doneTitle}</h2>
          <p className="cm-done-sub">
            {isCODCancelOnly
              ? <>Your order <strong>#{orderNum}</strong> has been <strong>cancelled successfully</strong>.</>
              : isPreShipment && isOnline
                ? <>Your order <strong>#{orderNum}</strong> has been cancelled and a <strong>refund of ₹{(order.order_amount || 0).toLocaleString('en-IN')}</strong> has been initiated.</>
                : <>Your <strong>{resolution} request</strong> for order <strong>#{orderNum}</strong> has been sent to {isPreShipment ? 'Holdkart' : 'the seller'}.</>}
          </p>
          <div className="cm-seller-notice" style={{ marginTop: 16, textAlign: 'left' }}>
            <span>🔔</span>
            <div style={{ fontSize: '0.83rem', color: '#565959' }}>
              {isCODCancelOnly
                ? 'Your order has been cancelled. No charges apply.'
                : isPreShipment && isOnline
                  ? 'Your refund will reflect in your original payment method within 5–7 business days.'
                  : isPreShipment
                    ? 'Your order has been cancelled. No charges apply.'
                    : <>You'll receive a notification once the seller approves or rejects your request. This usually takes <strong>24–48 hours</strong>.</>}
            </div>
          </div>
        </div>
        <div className="cm-footer" style={{ justifyContent: 'center' }}>
          <button className="cm-btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Review Modal ────────────────────────────────────────────── */
function ReviewModal({ order, onClose }) {
  const [rating,      setRating]      = useState(0);
  const [hovered,     setHovered]     = useState(0);
  const [comment,     setComment]     = useState('');
  const [images,      setImages]      = useState([]);   // File[]
  const [previews,    setPreviews]    = useState([]);   // dataURL[]
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const fileRef = useRef();

  const orderId  = order.id || order._id || '';
  const orderNum = order.order_number || String(orderId).slice(-8).toUpperCase();

  const handleFiles = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5 - images.length);
    if (!valid.length) return;
    setImages(prev => [...prev, ...valid]);
    valid.forEach(f => {
      const r = new FileReader();
      r.onload = e => setPreviews(prev => [...prev, e.target.result]);
      r.readAsDataURL(f);
    });
  };

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a star rating'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('productId', order.product_id);
      fd.append('rating', rating);
      fd.append('comment', comment.trim());
      images.forEach(img => fd.append('reviewImages', img));
      await addReview(fd);
      setDone(true);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="cm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cm-box" style={{ maxWidth: 520 }}>
        <div className="cm-header">
          <h2 className="cm-title">{done ? 'Review Submitted!' : 'Write a Review'}</h2>
          <button className="cm-close" onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className="cm-done-body">
            <div className="cm-done-icon">⭐</div>
            <h2 className="cm-done-title" style={{ color: '#e47911' }}>Thank you for your review!</h2>
            <p className="cm-done-sub">Your feedback helps other buyers make better decisions.</p>
            <div style={{ marginTop: 24 }}>
              <button className="cm-btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <>
            {/* Product info */}
            <div className="cm-order-info">
              <div className="cm-order-thumb">
                {order.product_image
                  ? <img src={order.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                  : <span style={{ fontSize: '1.8rem' }}>📦</span>}
              </div>
              <div>
                <div className="cm-order-name">{order.product_name}</div>
                <div className="cm-order-meta">Order #{orderNum}</div>
              </div>
            </div>
            <div className="cm-divider" />

            <div style={{ padding: '16px 20px' }}>
              {/* Star rating */}
              <p className="cm-label" style={{ padding: 0, marginBottom: 10 }}>Your Rating *</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    style={{
                      fontSize: '2rem', cursor: 'pointer', lineHeight: 1,
                      color: s <= (hovered || rating) ? '#e47911' : '#d5d9d9',
                      transition: 'color 0.1s',
                    }}>★</span>
                ))}
                {(hovered || rating) > 0 && (
                  <span style={{ fontSize: '0.85rem', color: '#e47911', fontWeight: 600, marginLeft: 6 }}>
                    {LABELS[hovered || rating]}
                  </span>
                )}
              </div>

              {/* Comment */}
              <p className="cm-label" style={{ padding: 0, marginBottom: 6, marginTop: 14 }}>Your Review</p>
              <textarea
                className="cm-textarea"
                style={{ width: '100%', margin: 0, boxSizing: 'border-box' }}
                placeholder="What did you like or dislike about this product?"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#aaa', marginTop: 2 }}>{comment.length}/1000</div>

              {/* Image upload */}
              <p className="cm-label" style={{ padding: 0, marginBottom: 8, marginTop: 14 }}>Add Photos <span style={{ fontWeight: 400, color: '#999' }}>(optional, max 5)</span></p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: 70, height: 70 }}>
                    <img src={src} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e8e8' }} />
                    <button onClick={() => removeImage(i)} style={{
                      position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
                      background: '#c40000', border: 'none', color: '#fff', fontSize: '0.6rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}>✕</button>
                  </div>
                ))}
                {images.length < 5 && (
                  <div onClick={() => fileRef.current?.click()} style={{
                    width: 70, height: 70, border: '2px dashed #d5d9d9', borderRadius: 6,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#888', fontSize: '0.7rem', gap: 4,
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>📷</span>
                    Add
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
              </div>
            </div>

            <div className="cm-footer">
              <button className="cm-btn-outline" onClick={onClose}>Cancel</button>
              <button className="cm-btn-primary" onClick={handleSubmit} disabled={submitting || !rating}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Order Card ──────────────────────────────────────────────── */
function OrderCard({ order, onCancelClick, onReturnClick, onReviewClick }) {
  const navigate = useNavigate();
  const status   = order.order_status || 'Pending';
  const style    = STATUS_DOT[status] || STATUS_DOT.Pending;
  const orderId  = order.id || order._id || '';
  const orderNum = order.order_number || String(orderId).slice(-8).toUpperCase();
  const subOrderNum = order.sub_order_number || null;
  const productId = order.product_id || '';
  // What the customer actually paid for this product = item price (deal-locked
  // price minus deposit, if it was a deal) + shipping for this item.
  const itemTotal = (Number(order.order_amount) || 0) + (Number(order.delivery_charge) || 0);

  const isDelivered     = status === 'Delivered';
  const isCancelled     = status === 'Cancelled' || status === 'Returned';
  const isRequested     = status === 'Cancellation Requested';
  const isReturnRequested = status === 'Return Requested';
  // Can cancel before shipment OR once shipped (refund only, seller approves when shipped)
  const canCancel       = ['Pending', 'Confirmed', 'Shipped'].includes(status);

  return (
    <div className="amz-card">
      <div className="amz-card-head">
        <div className="amz-card-head-cols">
          <div className="amz-head-col">
            <span className="amz-head-label">ORDER PLACED</span>
            <span className="amz-head-value">{fmtShort(order.created_date || order.created_at)}</span>
          </div>
          <div className="amz-head-col">
            <span className="amz-head-label">TOTAL</span>
            <span className="amz-head-value">₹{itemTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="amz-head-col">
            <span className="amz-head-label">PAYMENT</span>
            <span className="amz-head-value">{order.payment_method || 'Online'}</span>
          </div>
        </div>
        <div className="amz-card-head-right">
          <span className="amz-head-label">ORDER ID: {subOrderNum || orderNum}</span>
          <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
            <button className="amz-link" onClick={() => navigate(`/order/${orderId}`)}>View order details</button>
            <span className="amz-head-divider">|</span>
            <button className="amz-link" onClick={() => navigate(`/invoice/${orderId}`)}>Invoice</button>
          </div>
        </div>
      </div>

      <div className="amz-card-body">
        <div className="amz-status-line">
          {isDelivered ? (
            <span style={{ fontWeight: 700, color: '#007600', fontSize: '1rem' }}>
              ✔ Delivered {fmt(order.updated_at || order.created_date || order.created_at)}
            </span>
          ) : isCancelled ? (
            <span style={{ fontWeight: 700, color: '#c40000', fontSize: '1rem' }}>✖ {status}</span>
          ) : isRequested ? (
            <span style={{ fontWeight: 700, color: '#b7860b', fontSize: '1rem' }}>
              🕐 Cancellation Requested — Pending seller approval
            </span>
          ) : isReturnRequested ? (
            <span style={{ fontWeight: 700, color: '#b7860b', fontSize: '1rem' }}>
              🔄 Return Requested — Pending seller approval
            </span>
          ) : (
            <span style={{ fontWeight: 700, color: style.text, fontSize: '1rem' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                background: style.color, marginRight: 6, verticalAlign: 'middle' }} />
              {status}
            </span>
          )}
        </div>

        <div className="amz-body-row">
          {order.product_image ? (
            <img src={order.product_image} alt={order.product_name} className="amz-prod-img"
              onClick={() => productId && navigate(`/product/${productId}`)}
              style={{ cursor: productId ? 'pointer' : 'default' }}
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div className="amz-prod-img-placeholder"
              onClick={() => productId && navigate(`/product/${productId}`)}
              style={{ cursor: productId ? 'pointer' : 'default' }}>
              <span style={{ fontSize: '2rem' }}>📦</span>
            </div>
          )}

          <div className="amz-prod-info">
            <div className="amz-prod-name"
              onClick={() => productId && navigate(`/product/${productId}`)}
              style={{ cursor: productId ? 'pointer' : 'default' }}>
              {order.product_name}
            </div>
            {order.category && <div className="amz-prod-meta">{order.category}</div>}
            <div className="amz-prod-meta">
              Qty: {order.quantity || 1}
              {order.size && <> &nbsp;·&nbsp; Size: {order.size}</>}
            </div>

            {!isCancelled && !isRequested && !isReturnRequested && <OrderProgress status={status} />}

            {isRequested && (
              <div className="amz-requested-badge">
                🕐 Awaiting seller response · You'll be notified within 24–48 hrs
              </div>
            )}

            {isReturnRequested && (
              <div className="amz-requested-badge" style={{ background: '#eef6ff', borderColor: '#90c2f5', color: '#1a56a0' }}>
                🔄 Return awaiting seller response · You'll be notified within 24–48 hrs
              </div>
            )}

            <div className="amz-actions">
              {isDelivered && (
                <button className="amz-btn-primary" onClick={() => navigate('/products')}>Buy it again</button>
              )}
              <button className="amz-btn-secondary" onClick={() => navigate(`/order/${orderId}`)}>
                View order
              </button>
              {canCancel && (
                <button className="amz-btn-cancel" onClick={() => onCancelClick(order)}>
                  Cancel order
                </button>
              )}
              {isDelivered && (
                <button className="amz-btn-secondary" onClick={() => onReturnClick(order)}>
                  Return or replace
                </button>
              )}
              {isDelivered && !order.has_reviewed && (
                <button className="amz-btn-review" onClick={() => onReviewClick(order)}>
                  ★ Write a Review
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Order Progress Stepper ──────────────────────────────────── */
const STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

function OrderProgress({ status }) {
  const idx = STEPS.indexOf(status);
  if (idx < 0) return null;
  return (
    <div className="amz-progress-wrap">
      {STEPS.map((step, i) => {
        const done   = i <= idx;
        const active = i === idx;
        return (
          <div key={step} className="amz-step-item">
            {i < STEPS.length - 1 && <div className={`amz-step-line ${i < idx ? 'done' : ''}`} />}
            <div className={`amz-step-dot ${done ? 'done' : ''} ${active ? 'active' : ''}`} />
            <span className={`amz-step-label ${active ? 'active' : done ? 'done' : ''}`}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function Orders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('all');
  const [period,      setPeriod]      = useState('3m');
  const [search,      setSearch]      = useState('');
  const [cancelOrder, setCancelOrder] = useState(null);
  const [returnOrderState, setReturnOrderState] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [submitting,  setSubmitting]  = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await orderService.listOrders();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      // Trigger delivery email for delivered orders by calling getOrder
      list
        .filter(o => o.order_status === 'Delivered')
        .forEach(o => orderService.getOrder(o.id).catch(() => {}));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchOrders();
  }, [isAuthenticated]);

  const handleCancelClick = (order) => setCancelOrder(order);

  const handleCancelConfirm = async (orderId, reason, resolution) => {
    setSubmitting(true);
    try {
      await orderService.cancelOrder({ orderId, cancellation_reason: reason, resolution_type: resolution });
      toast.success('Cancellation request sent to seller');
      fetchOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Cannot submit request');
      setCancelOrder(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnClick = (order) => setReturnOrderState(order);

  const handleReviewClick = (order) => setReviewOrder(order);

  const handleReturnConfirm = async (orderId, reason, resolution) => {
    setSubmitting(true);
    try {
      await returnOrderApi({ orderId, cancellation_reason: reason, resolution_type: resolution });
      toast.success('Return request sent to seller');
      fetchOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Cannot submit return request');
      setReturnOrderState(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => { setCancelOrder(null); setReturnOrderState(null); setReviewOrder(null); setSubmitting(false); };

  const filtered = useMemo(() => {
    return orders
      .filter(o => matchesPeriod(o, period))
      .filter(o => matchesTab(o, tab))
      .filter(o => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          (o.product_name || '').toLowerCase().includes(q) ||
          (o.order_number || '').toLowerCase().includes(q) ||
          String(o.id || o._id || '').toLowerCase().includes(q)
        );
      });
  }, [orders, period, tab, search]);

  // Group line-item orders that were placed together (same order_number) so
  // they render under one shared "Order ID" header, like a checkout group.
  const groupedOrders = useMemo(() => {
    const groups = [];
    const indexByKey = new Map();
    filtered.forEach(o => {
      const key = o.order_number || `single-${o.id || o._id}`;
      if (!indexByKey.has(key)) {
        indexByKey.set(key, groups.length);
        groups.push({ orderNumber: o.order_number || key, items: [o] });
      } else {
        groups[indexByKey.get(key)].items.push(o);
      }
    });
    return groups;
  }, [filtered]);

  return (
    <div style={{ background: '#f0f2f2', minHeight: '100vh', fontFamily: "'Amazon Ember','Segoe UI',Arial,sans-serif", paddingTop: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .amz-wrap { max-width: 1000px; margin: 0 auto; padding: 20px 16px 60px; }
        .amz-title-row { display: flex; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
        .amz-title { font-size: 1.65rem; font-weight: 700; color: #0f1111; }
        .amz-search-wrap { flex: 1; min-width: 220px; max-width: 500px; display: flex; }
        .amz-search-input { flex: 1; border: 1px solid #888c8c; border-right: none; border-radius: 4px 0 0 4px; padding: 8px 12px; font-size: 0.9rem; outline: none; font-family: inherit; background: #fff; color: #0f1111; }
        .amz-search-input:focus { border-color: #e77600; box-shadow: 0 0 0 3px rgba(231,118,0,0.25); }
        .amz-search-btn { background: linear-gradient(to bottom, #f7dfa5, #f0c14b); border: 1px solid #a88734; border-radius: 0 4px 4px 0; padding: 0 14px; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #111; font-family: inherit; }
        .amz-filters { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
        .amz-period-select { border: 1px solid #d5d9d9; border-radius: 8px; padding: 7px 28px 7px 12px; font-size: 0.88rem; font-family: inherit; color: #0f1111; cursor: pointer; outline: none; box-shadow: 0 2px 5px rgba(15,17,17,0.08); appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23555'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-color: #fff; }
        .amz-count-text { font-size: 0.9rem; color: #565959; }
        .amz-tabs { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 16px; overflow-x: auto; }
        .amz-tab { padding: 10px 20px; font-size: 0.88rem; font-weight: 500; color: #007185; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; white-space: nowrap; font-family: inherit; margin-bottom: -1px; }
        .amz-tab:hover { color: #c7511f; }
        .amz-tab.active { color: #0f1111; border-bottom-color: #e77600; font-weight: 700; }
        .amz-card { background: #fff; border: 1px solid #d5d9d9; border-radius: 8px; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 5px rgba(15,17,17,0.08); transition: box-shadow 0.2s; }
        .amz-card:hover { box-shadow: 0 4px 16px rgba(15,17,17,0.14); }
        .amz-card-head { display: flex; justify-content: space-between; align-items: flex-start; background: #f0f2f2; padding: 12px 18px; border-bottom: 1px solid #d5d9d9; gap: 16px; flex-wrap: wrap; }
        .amz-card-head-cols { display: flex; gap: 28px; flex-wrap: wrap; }
        .amz-card-head-right { text-align: right; flex-shrink: 0; }
        .amz-head-col { display: flex; flex-direction: column; gap: 2px; }
        .amz-head-label { font-size: 0.7rem; font-weight: 700; color: #565959; text-transform: uppercase; letter-spacing: 0.4px; }
        .amz-head-value { font-size: 0.88rem; font-weight: 600; color: #0f1111; }
        .amz-head-divider { color: #ccc; }
        .amz-card-body { padding: 16px 18px; }
        .amz-status-line { margin-bottom: 14px; }
        .amz-body-row { display: flex; gap: 18px; align-items: flex-start; }
        .amz-prod-img { width: 100px; height: 100px; object-fit: contain; border: 1px solid #e8e8e8; border-radius: 4px; flex-shrink: 0; background: #fafafa; padding: 4px; }
        .amz-prod-img-placeholder { width: 100px; height: 100px; border: 1px solid #e8e8e8; border-radius: 4px; background: #f0f2f2; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .amz-prod-info { flex: 1; }
        .amz-prod-name { font-size: 0.98rem; font-weight: 600; color: #007185; margin-bottom: 4px; line-height: 1.4; }
        .amz-prod-meta { font-size: 0.82rem; color: #565959; margin-bottom: 4px; }
        .amz-requested-badge { margin-top: 12px; font-size: 0.8rem; color: #b7860b; background: #fffbe6; border: 1px solid #f0c14b; border-radius: 6px; padding: 7px 12px; display: inline-block; }
        .amz-actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
        .amz-btn-primary { background: linear-gradient(to bottom, #f7dfa5, #f0c14b); border: 1px solid #a88734; border-radius: 20px; padding: 7px 18px; font-size: 0.84rem; font-weight: 700; color: #111; cursor: pointer; font-family: inherit; }
        .amz-btn-secondary { background: #fff; border: 1px solid #d5d9d9; border-radius: 20px; padding: 7px 18px; font-size: 0.84rem; font-weight: 600; color: #0f1111; cursor: pointer; font-family: inherit; box-shadow: 0 2px 5px rgba(15,17,17,0.07); }
        .amz-btn-secondary:hover { background: #f7fafa; border-color: #aaa; }
        .amz-btn-cancel { background: #fff; border: 1px solid #d5d9d9; border-radius: 20px; padding: 7px 18px; font-size: 0.84rem; font-weight: 600; color: #c40000; cursor: pointer; font-family: inherit; }
        .amz-btn-cancel:hover { background: #fce8e8; border-color: #c40000; }
        .amz-btn-review { background: #fff; border: 1px solid #e47911; border-radius: 20px; padding: 7px 18px; font-size: 0.84rem; font-weight: 600; color: #e47911; cursor: pointer; font-family: inherit; }
        .amz-btn-review:hover { background: #fff8ed; }
        .amz-link { background: none; border: none; color: #007185; font-size: 0.82rem; cursor: pointer; font-family: inherit; padding: 0; }
        .amz-link:hover { color: #c7511f; text-decoration: underline; }
        .amz-progress-wrap { display: flex; align-items: flex-start; margin-top: 14px; position: relative; }
        .amz-step-item { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
        .amz-step-line { position: absolute; top: 8px; left: 50%; right: -50%; height: 3px; background: #d5d9d9; z-index: 0; }
        .amz-step-line.done { background: #007600; }
        .amz-step-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d5d9d9; background: #fff; z-index: 1; flex-shrink: 0; }
        .amz-step-dot.done { background: #007600; border-color: #007600; }
        .amz-step-dot.active { background: #fff; border-color: #007600; border-width: 3px; box-shadow: 0 0 0 3px rgba(0,118,0,0.15); }
        .amz-step-label { font-size: 0.68rem; margin-top: 5px; color: #888; text-align: center; }
        .amz-step-label.done { color: #007600; }
        .amz-step-label.active { color: #0f1111; font-weight: 700; }
        .amz-empty { background: #fff; border: 1px solid #d5d9d9; border-radius: 8px; padding: 60px 24px; text-align: center; }
        .amz-group { margin-bottom: 24px; background: #fafbfb; border: 1px solid #e7e9e9; border-radius: 10px; padding: 14px 14px 14px; }
        .amz-group .amz-card:last-child { margin-bottom: 0; }
        .amz-group-header { font-size: 0.9rem; color: #565959; margin-bottom: 10px; }
        .amz-group-header b { color: #0f1111; font-weight: 600; }
        .amz-skel { background: linear-gradient(90deg,#e8e8e8 25%,#f5f5f5 50%,#e8e8e8 75%); background-size: 400% 100%; animation: skelAnim 1.4s ease-in-out infinite; border-radius: 4px; }
        @keyframes skelAnim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ══ Cancel Modal ══ */
        .cm-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(15,17,17,0.65); display: flex; align-items: center; justify-content: center; padding: 16px; animation: cmFadeIn 0.18s ease; }
        @keyframes cmFadeIn { from{opacity:0} to{opacity:1} }
        .cm-box { background: #fff; border-radius: 12px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.28); animation: cmSlideUp 0.22s ease; }
        @keyframes cmSlideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        .cm-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 14px; border-bottom: 1px solid #e8e8e8; position: sticky; top: 0; background: #fff; z-index: 1; }
        .cm-title { font-size: 1.05rem; font-weight: 700; color: #0f1111; margin: 0; }
        .cm-close { background: none; border: none; cursor: pointer; font-size: 1rem; color: #565959; padding: 4px 8px; border-radius: 4px; }
        .cm-close:hover { background: #f0f2f2; }
        .cm-order-info { display: flex; gap: 14px; align-items: center; padding: 16px 20px; }
        .cm-order-thumb { width: 64px; height: 64px; border-radius: 6px; border: 1px solid #e8e8e8; background: #f8f8f8; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .cm-order-name { font-size: 0.92rem; font-weight: 600; color: #0f1111; margin-bottom: 4px; line-height: 1.4; }
        .cm-order-meta { font-size: 0.8rem; color: #565959; margin-bottom: 2px; }
        .cm-divider { border: none; border-top: 1px solid #e8e8e8; margin: 0 20px; }
        .cm-label { padding: 14px 20px 8px; font-size: 0.88rem; font-weight: 600; color: #0f1111; margin: 0; }
        .cm-reasons { padding: 0 20px 4px; display: flex; flex-direction: column; gap: 2px; }
        .cm-reason { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; border: 1.5px solid transparent; cursor: pointer; font-size: 0.88rem; color: #0f1111; background: #fafafa; }
        .cm-reason:hover { background: #f0f2f2; border-color: #d5d9d9; }
        .cm-reason.selected { background: #fff8ed; border-color: #e47911; font-weight: 500; }
        .cm-radio { accent-color: #e47911; width: 16px; height: 16px; flex-shrink: 0; cursor: pointer; }
        .cm-textarea { display: block; width: calc(100% - 40px); margin: 10px 20px 0; border: 1.5px solid #d5d9d9; border-radius: 8px; padding: 10px 12px; font-size: 0.88rem; font-family: inherit; color: #0f1111; resize: vertical; outline: none; }
        .cm-textarea:focus { border-color: #e47911; box-shadow: 0 0 0 3px rgba(228,121,17,0.15); }
        .cm-tip-banner { display: flex; gap: 10px; align-items: flex-start; margin: 12px 20px 0; background: #eef6ff; border: 1px solid #90c2f5; border-radius: 8px; padding: 10px 12px; font-size: 0.82rem; color: #1a56a0; }

        /* Resolution cards */
        .cm-res-card { display: flex; gap: 14px; align-items: flex-start; border: 2px solid #e8e8e8; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; cursor: pointer; background: #fafafa; transition: all 0.15s; }
        .cm-res-card:hover { border-color: #ccc; background: #f5f5f5; }
        .cm-res-card.selected { border-color: #e47911; background: #fff8ed; }
        .cm-res-icon { font-size: 1.6rem; flex-shrink: 0; margin-top: 2px; }
        .cm-res-body { flex: 1; }
        .cm-res-title { font-size: 0.95rem; font-weight: 700; color: #0f1111; margin-bottom: 4px; }
        .cm-res-sub { font-size: 0.82rem; color: #565959; line-height: 1.5; }
        .cm-seller-notice { display: flex; gap: 10px; align-items: flex-start; background: #f0f2f2; border-radius: 8px; padding: 10px 12px; font-size: 0.82rem; color: #565959; margin-top: 8px; }

        /* Confirm step */
        .cm-confirm-body { padding: 24px 20px 8px; text-align: center; }
        .cm-confirm-icon { font-size: 2.5rem; margin-bottom: 12px; }
        .cm-confirm-text { font-size: 0.95rem; color: #0f1111; margin-bottom: 14px; line-height: 1.5; }
        .cm-reason-chip { display: inline-block; background: #f0f2f2; border-radius: 20px; padding: 5px 12px; font-size: 0.8rem; color: #565959; }
        .cm-reason-chip.refund { background: #fff8ed; color: #b76700; }
        .cm-reason-chip.replace { background: #eef6ff; color: #1a56a0; }
        .cm-reason-chip-label { font-weight: 600; color: #0f1111; margin-right: 4px; }

        /* Footer */
        .cm-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 20px; border-top: 1px solid #e8e8e8; position: sticky; bottom: 0; background: #fff; }
        .cm-btn-outline { background: #fff; border: 1.5px solid #d5d9d9; border-radius: 8px; padding: 9px 20px; font-size: 0.88rem; font-weight: 600; color: #0f1111; cursor: pointer; font-family: inherit; }
        .cm-btn-outline:hover { background: #f7fafa; }
        .cm-btn-primary { background: linear-gradient(to bottom, #f7dfa5, #f0c14b); border: 1.5px solid #a88734; border-radius: 8px; padding: 9px 24px; font-size: 0.88rem; font-weight: 700; color: #111; cursor: pointer; font-family: inherit; }
        .cm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cm-btn-danger { background: #c40000; border: none; border-radius: 8px; padding: 9px 24px; font-size: 0.88rem; font-weight: 700; color: #fff; cursor: pointer; font-family: inherit; }
        .cm-btn-danger:hover:not(:disabled) { background: #a50000; }
        .cm-btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Done */
        .cm-done-body { padding: 32px 20px 8px; text-align: center; }
        .cm-done-icon { font-size: 3rem; margin-bottom: 12px; }
        .cm-done-title { font-size: 1.2rem; font-weight: 700; color: #007600; margin: 0 0 8px; }
        .cm-done-sub { font-size: 0.9rem; color: #565959; margin: 0; line-height: 1.5; }

        @media (max-width: 600px) {
          .amz-card-head { flex-direction: column; }
          .amz-card-head-right { text-align: left; }
          .amz-body-row { flex-direction: column; }
          .amz-prod-img, .amz-prod-img-placeholder { width: 80px; height: 80px; }
          .amz-title { font-size: 1.3rem; }
          .cm-box { max-height: 95vh; border-radius: 12px 12px 0 0; }
          .cm-res-card { flex-direction: column; gap: 8px; }
        }
      `}</style>

      {cancelOrder && (
        <CancelModal
          order={cancelOrder}
          onClose={handleModalClose}
          onConfirm={handleCancelConfirm}
          submitting={submitting}
          mode="cancel"
        />
      )}

      {returnOrderState && (
        <CancelModal
          order={returnOrderState}
          onClose={handleModalClose}
          onConfirm={handleReturnConfirm}
          submitting={submitting}
          mode="return"
        />
      )}

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => { handleModalClose(); fetchOrders(); }}
        />
      )}

      <div className="amz-wrap">
        <div className="amz-title-row">
          <h1 className="amz-title">Your Orders</h1>
          <div className="amz-search-wrap">
            <input className="amz-search-input" placeholder="Search all orders"
              value={search} onChange={e => setSearch(e.target.value)} />
            <button className="amz-search-btn">🔍</button>
          </div>
        </div>

        <div className="amz-tabs">
          {FILTER_TABS.map(t => (
            <button key={t.key} className={`amz-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        <div className="amz-filters">
          <span className="amz-count-text" style={{ fontWeight: 600, color: '#0f1111' }}>
            {loading ? '…' : `${filtered.length} order${filtered.length !== 1 ? 's' : ''}`}
          </span>
          <span className="amz-count-text">in</span>
          <select className="amz-period-select" value={period} onChange={e => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#f0f2f2', padding: '12px 18px', display: 'flex', gap: 24 }}>
                  {[120,100,80].map((w,j) => <div key={j} className="amz-skel" style={{ height: 32, width: w }} />)}
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', gap: 18 }}>
                  <div className="amz-skel" style={{ width: 100, height: 100, borderRadius: 4 }} />
                  <div style={{ flex: 1 }}>
                    <div className="amz-skel" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                    <div className="amz-skel" style={{ height: 14, width: '40%', marginBottom: 12 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className="amz-skel" style={{ height: 32, width: 100, borderRadius: 16 }} />
                      <div className="amz-skel" style={{ height: 32, width: 100, borderRadius: 16 }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="amz-empty">
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f1111', marginBottom: 8 }}>
              {search ? `No orders match "${search}"` : 'No orders found'}
            </div>
            <div style={{ color: '#565959', marginBottom: 24, fontSize: '0.9rem' }}>
              {search ? 'Try a different search term or clear the filter' : `You haven't placed any orders in the selected period`}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {search && <button className="amz-btn-secondary" onClick={() => setSearch('')}>Clear search</button>}
              <button className="amz-btn-primary" onClick={() => navigate('/products')}>Continue Shopping</button>
            </div>
          </div>
        ) : (
          groupedOrders.map(group => (
            <div key={group.orderNumber} className="amz-group">
              <div className="amz-group-header">Order ID : <b>{group.orderNumber}</b></div>
              {group.items.map(order => (
                <OrderCard key={order.id || order._id} order={order} onCancelClick={handleCancelClick} onReturnClick={handleReturnClick} onReviewClick={handleReviewClick} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}