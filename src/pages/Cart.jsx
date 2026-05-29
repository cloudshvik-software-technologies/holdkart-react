import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23f0f4f8'/%3E%3Ccircle cx='60' cy='45' r='18' fill='%23d1d9e6'/%3E%3Cpath d='M25 100 Q60 65 95 100Z' fill='%23d1d9e6'/%3E%3C/svg%3E";

function resolveImg(url) {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith('http')) return url;
  return `/seller-uploads${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart]     = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const data = await cartService.getCart();
      setCart(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated) { fetchCart(); }
    else { setLoading(false); }
  }, [isAuthenticated]);

  const updateQty = async (productId, qty) => {
    try { await cartService.updateCartItem({ productId, quantity: qty }); fetchCart(); }
    catch(e) { toast.error(e?.response?.data?.message || 'Failed to update'); }
  };

  const remove = async (productId) => {
    try { await cartService.removeFromCart({ productId }); fetchCart(); toast.success('Item removed'); }
    catch { toast.error('Failed to remove'); }
  };

  /* ── totals ── */
  const subtotalMRP  = cart.reduce((s, i) => s + i.retailPrice   * i.quantity, 0);
  const subtotalEff  = cart.reduce((s, i) => s + i.effectivePrice * i.quantity, 0);
  const totalSavings = subtotalMRP - subtotalEff;
  const itemCount    = cart.reduce((s, i) => s + i.quantity, 0);

  /* ── styles ── */
  const page = {
    background: '#f4f6fa',
    minHeight: '100vh',
    paddingTop: 100,
    paddingBottom: 60,
  };
  const inner = { maxWidth: 1200, margin: '0 auto', padding: '0 16px' };

  if (loading) return (
    <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #eef2ff', borderTopColor: '#2a5298', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading your cart…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div style={page}>
      <div style={{ ...inner, maxWidth: 480, paddingTop: 60, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontWeight: 700, color: '#0f1111', marginBottom: 8 }}>Sign in to view your cart</h2>
        <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '0.9rem' }}>Your cart is saved when you're signed in.</p>
        <Link to="/login" style={{ display: 'inline-block', padding: '10px 32px', background: '#f0c14b', border: '1px solid #a88734', borderRadius: 20, fontWeight: 700, color: '#111', fontSize: '0.9rem', textDecoration: 'none' }}>Sign In</Link>
        <p style={{ marginTop: 14, fontSize: '0.85rem', color: '#6b7280' }}>New customer? <Link to="/register" style={{ color: '#2a5298', textDecoration: 'underline' }}>Start here</Link></p>
      </div>
    </div>
  );

  return (
    <div style={page}>
      <div style={inner}>

        {/* Page heading */}
        <h1 style={{ fontSize: '1.7rem', fontWeight: 400, color: '#0f1111', marginBottom: 16 }}>
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          /* ── Empty cart ── */
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🛒</div>
            <h2 style={{ fontWeight: 700, color: '#0f1111', marginBottom: 8 }}>Your cart is empty</h2>
            <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '0.9rem' }}>Looks like you haven't added anything yet.</p>
            <Link to="/products" style={{ display: 'inline-block', padding: '10px 28px', background: '#f0c14b', border: '1px solid #a88734', borderRadius: 20, fontWeight: 700, color: '#111', fontSize: '0.9rem', textDecoration: 'none' }}>Browse Products</Link>
          </div>
        ) : (
          /* ── Cart layout ── */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'flex-start' }}>

            {/* ── Left: item list ── */}
            <div>
              {/* Deselect all / item count row */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px 4px 0 0', padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                  Price
                </span>
              </div>

              {/* Items */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderTop: 'none' }}>
                {cart.map((item, idx) => {
                  const itemTotal   = item.effectivePrice * item.quantity;
                  const mrpTotal    = item.retailPrice    * item.quantity;
                  const saved       = mrpTotal - itemTotal;

                  return (
                    <div
                      key={item.cartId}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '120px 1fr auto',
                        gap: 16,
                        padding: '20px',
                        borderBottom: idx < cart.length - 1 ? '1px solid #e5e7eb' : 'none',
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Image */}
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', background: '#f9fafb' }}>
                        <img
                          src={resolveImg(item.imageUrl)}
                          alt={item.name}
                          onError={e => { e.target.src = FALLBACK_IMG; }}
                          style={{ width: '100%', aspectRatio: '1', objectFit: 'contain' }}
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <p style={{ fontWeight: 400, fontSize: '1rem', color: '#0f1111', marginBottom: 4, lineHeight: 1.4 }}>
                          {item.name}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: '#007600', fontWeight: 600, marginBottom: 4 }}>
                          In Stock
                        </p>
                        {item.category && (
                          <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 8 }}>{item.category}</p>
                        )}

                        {/* Group deal tag */}
                        {item.hasGroupDeal && item.discountPct > 0 && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef2ff', border: '1px solid #bfcfec', borderRadius: 4, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#1e3c72', marginBottom: 10 }}>
                            🤝 Group Deal applied — {item.discountPct}% off
                          </div>
                        )}

                        {/* Qty controls + Remove */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Qty stepper */}
                          <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
                            <button
                              onClick={() => updateQty(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              style={{ width: 32, height: 32, background: '#f9fafb', border: 'none', fontSize: '1rem', fontWeight: 700, color: item.quantity <= 1 ? '#d1d5db' : '#374151', cursor: item.quantity <= 1 ? 'default' : 'pointer' }}
                            >
                              −
                            </button>
                            <span style={{ width: 36, textAlign: 'center', fontWeight: 600, fontSize: '0.9rem', lineHeight: '32px', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              style={{ width: 32, height: 32, background: '#f9fafb', border: 'none', fontSize: '1rem', fontWeight: 700, color: item.quantity >= item.stock ? '#d1d5db' : '#374151', cursor: item.quantity >= item.stock ? 'default' : 'pointer' }}
                            >
                              +
                            </button>
                          </div>

                          <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>|</span>

                          <button
                            onClick={() => remove(item.productId)}
                            style={{ background: 'none', border: 'none', color: '#2a5298', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                          >
                            Delete
                          </button>

                          <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>|</span>

                          <button
                            onClick={() => navigate(`/products/${item.productId}`)}
                            style={{ background: 'none', border: 'none', color: '#2a5298', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                          >
                            View item
                          </button>
                        </div>
                      </div>

                      {/* Price column */}
                      <div style={{ textAlign: 'right', minWidth: 110 }}>
                        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f1111', marginBottom: 2 }}>
                          ₹{itemTotal.toLocaleString('en-IN')}
                        </p>
                        {saved > 0 && (
                          <>
                            <p style={{ fontSize: '0.78rem', color: '#9ca3af', textDecoration: 'line-through', marginBottom: 2 }}>
                              ₹{mrpTotal.toLocaleString('en-IN')}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#007600', fontWeight: 600 }}>
                              You save ₹{saved.toLocaleString('en-IN')}
                            </p>
                          </>
                        )}
                        <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>
                          ₹{item.effectivePrice.toLocaleString('en-IN')} each
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal row at bottom of list */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '16px 20px', textAlign: 'right' }}>
                <span style={{ fontSize: '1rem', color: '#0f1111' }}>
                  Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}):{' '}
                  <strong style={{ fontSize: '1.15rem' }}>₹{subtotalEff.toLocaleString('en-IN')}</strong>
                </span>
                {totalSavings > 0 && (
                  <span style={{ fontSize: '0.82rem', color: '#007600', fontWeight: 600, marginLeft: 12 }}>
                    (You save ₹{totalSavings.toLocaleString('en-IN')})
                  </span>
                )}
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: 20, position: 'sticky', top: 100 }}>

              {/* Group deal savings callout */}
              {totalSavings > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d', marginBottom: 2 }}>
                    🎉 Group deal savings applied!
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#166534' }}>
                    You're saving <strong>₹{totalSavings.toLocaleString('en-IN')}</strong> on this order.
                  </p>
                </div>
              )}

              <p style={{ fontSize: '1rem', color: '#0f1111', marginBottom: 14 }}>
                Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}):&nbsp;
                <strong style={{ fontSize: '1.15rem' }}>₹{subtotalEff.toLocaleString('en-IN')}</strong>
              </p>

              {/* Line items */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginBottom: 12 }}>
                {cart.map(item => (
                  <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>
                    <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name} × {item.quantity}
                    </span>
                    <span style={{ fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                      ₹{(item.effectivePrice * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {totalSavings > 0 && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6b7280', marginBottom: 4 }}>
                    <span>M.R.P. Total</span>
                    <span style={{ textDecoration: 'line-through' }}>₹{subtotalMRP.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#007600', fontWeight: 600 }}>
                    <span>Group Deal Discount</span>
                    <span>−₹{totalSavings.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: '#0f1111' }}>
                  <span>Order Total</span>
                  <span>₹{subtotalEff.toLocaleString('en-IN')}</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>Inclusive of all taxes</p>
              </div>

              <button
                style={{ width: '100%', padding: '11px', background: '#f0c14b', border: '1px solid #a88734', borderRadius: 20, fontWeight: 700, fontSize: '0.92rem', color: '#111', cursor: 'pointer', marginBottom: 10 }}
                onClick={() => { if (!isAuthenticated) { toast.error('Please sign in to checkout'); navigate('/login'); return; } navigate('/checkout'); }}
              >
                Proceed to Checkout →
              </button>

              <Link
                to="/products"
                style={{ display: 'block', textAlign: 'center', padding: '10px', border: '1px solid #2a5298', borderRadius: 20, fontWeight: 600, fontSize: '0.88rem', color: '#2a5298', textDecoration: 'none' }}
              >
                Continue Shopping
              </Link>

              {/* Secure badge */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', color: '#6b7280' }}>
                <span>🔒</span>
                <span>Secure checkout powered by HoldKart</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
