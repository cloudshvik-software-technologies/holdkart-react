import { useState, useEffect } from 'react';
  import { useNavigate, Link } from 'react-router-dom';
  import { cartService } from '../services/index.js';
  import { useAuth } from '../context/AuthContext.jsx';
  import toast from 'react-hot-toast';

  const SELLER_URL = import.meta.env.VITE_SELLER_API_URL || 'http://localhost:8080';

  export default function Cart() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCart = async () => {
      try { const data = await cartService.getCart(); setCart(Array.isArray(data) ? data : []); } 
      catch {} finally { setLoading(false); }
    };

    useEffect(() => { if (!isAuthenticated) { navigate('/login'); return; } fetchCart(); }, [isAuthenticated]);

    const updateQty = async (productId, qty) => {
      try { await cartService.updateCartItem({ productId, quantity: qty }); fetchCart(); }
      catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
    };

    const remove = async (productId) => {
      try { await cartService.removeFromCart({ productId }); fetchCart(); toast.success('Removed'); }
      catch(e) { toast.error('Failed'); }
    };

    const total = cart.reduce((sum, item) => sum + item.retailPrice * item.quantity, 0);

    if (loading) return <div className="page-wrap" style={{ textAlign: 'center' }}>Loading cart…</div>;

    return (
      <div className="page-wrap">
        <h1 className="page-title">Shopping Cart</h1>
        {cart.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add some products to get started</p>
            <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20 }}>Browse Products</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="card" style={{ padding: 0 }}>
              {cart.map(item => {
                const img = item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : SELLER_URL + item.imageUrl) : 'https://via.placeholder.com/120?text=No+Image';
                return (
                  <div key={item.cartId} className="cart-item">
                    <img src={img} alt={item.name} onError={e => e.target.src = 'https://via.placeholder.com/120?text=No+Image'} />
                    <div className="cart-item-info" style={{ flex: 1 }}>
                      <div className="cart-item-name">{item.name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{item.category}</div>
                      <div className="cart-item-price" style={{ marginTop: 6 }}>₹{(item.retailPrice * item.quantity).toLocaleString()}</div>
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity - 1)}>−</button>
                        <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>× ₹{item.retailPrice?.toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => remove(item.productId)} style={{ color: '#dc2626', background: '#fef2f2', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: '0.82rem' }}>Remove</button>
                  </div>
                );
              })}
            </div>

            <div className="card order-summary">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
              {cart.map(item => (
                <div key={item.cartId} className="summary-row">
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{item.name} × {item.quantity}</span>
                  <span>₹{(item.retailPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="summary-row summary-total">
                <span>Total</span>
                <span style={{ color: 'var(--blue-dark)' }}>₹{total.toLocaleString()}</span>
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 16 }} onClick={() => navigate('/checkout')}>
                Proceed to Checkout →
              </button>
              <Link to="/products" className="btn-outline" style={{ display: 'flex', justifyContent: 'center', marginTop: 12, padding: '10px' }}>Continue Shopping</Link>
            </div>
          </div>
        )}
      </div>
    );
  }
  