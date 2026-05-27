import { useState, useEffect } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { orderService } from '../services/index.js';
  import { useAuth } from '../context/AuthContext.jsx';

  const statusColors = { Pending: 'amber', Confirmed: 'blue', Processing: 'blue', Shipped: 'blue', Delivered: 'green', Cancelled: 'red' };

  export default function OrderDetail() {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!isAuthenticated) { navigate('/login'); return; }
      orderService.getOrder(id).then(setOrder).catch(() => navigate('/orders')).finally(() => setLoading(false));
    }, [id, isAuthenticated]);

    if (loading) return <div className="page-wrap">Loading…</div>;
    if (!order) return null;

    const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
    const stepIdx = steps.indexOf(order.order_status);

    return (
      <div className="page-wrap">
        <button onClick={() => navigate('/orders')} style={{ color: 'var(--blue)', fontWeight: 500, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.9rem' }}>← Back to Orders</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontWeight: 700, marginBottom: 4 }}>Order #{order.order_number}</h2>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Placed on {new Date(order.created_date).toLocaleString()}</p>
                </div>
                <span className={`badge badge-${statusColors[order.order_status] || 'gray'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>{order.order_status}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 20px' }} />
              <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Product</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{order.product_name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Category: {order.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Qty: {order.quantity}</div>
                  <div style={{ fontWeight: 700, color: 'var(--blue-dark)', fontSize: '1.1rem' }}>₹{order.order_amount?.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {order.order_status !== 'Cancelled' && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 20 }}>Order Progress</h4>
                <div style={{ display: 'flex', gap: 0 }}>
                  {steps.map((step, i) => (
                    <div key={step} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                      {i < steps.length - 1 && (
                        <div style={{ position: 'absolute', top: 14, left: '50%', right: '-50%', height: 3, background: i < stepIdx ? 'var(--blue)' : 'var(--border)', zIndex: 0 }} />
                      )}
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: i <= stepIdx ? 'var(--blue)' : 'var(--border)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700, position: 'relative', zIndex: 1 }}>
                        {i < stepIdx ? '✓' : i + 1}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: i <= stepIdx ? 'var(--blue)' : 'var(--muted)', fontWeight: i === stepIdx ? 600 : 400 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Delivery Address</h4>
              <p style={{ color: 'var(--text)', lineHeight: 1.7 }}>{order.address}<br />{order.city}, {order.state} — {order.pincode}</p>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Payment Info</h4>
              <div className="summary-row"><span style={{ color: 'var(--muted)' }}>Method</span><span>{order.payment_method}</span></div>
              <div className="summary-row"><span style={{ color: 'var(--muted)' }}>Status</span><span className={`badge badge-${order.payment_status === 'Paid' ? 'green' : 'amber'}`}>{order.payment_status}</span></div>
              <div className="summary-row summary-total"><span>Amount</span><span style={{ color: 'var(--blue-dark)' }}>₹{order.order_amount?.toLocaleString()}</span></div>
            </div>
            {order.sellerName && (
              <div className="card">
                <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Seller</h4>
                <p style={{ fontWeight: 600 }}>{order.sellerName}</p>
                {order.sellerEmail && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{order.sellerEmail}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  