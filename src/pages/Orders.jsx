import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const statusColors = { Pending: 'amber', Confirmed: 'blue', Processing: 'blue', Shipped: 'blue', Delivered: 'green', Cancelled: 'red', Returned: 'gray' };

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const fetchOrders = async () => {
    try { const data = await orderService.listOrders(); setOrders(Array.isArray(data) ? data : []); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (!isAuthenticated) { navigate('/login'); return; } fetchOrders(); }, [isAuthenticated]);

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try { await orderService.cancelOrder({ orderId }); toast.success('Order cancelled'); fetchOrders(); }
    catch(e) { toast.error(e?.response?.data?.message || 'Cannot cancel'); }
  };

  const filtered = tab === 'all' ? orders : orders.filter(o => o.order_status?.toLowerCase() === tab);

  return (
    <div className="page-wrap">
      <h1 className="page-title">My Orders</h1>
      <div className="tab-nav">
        {[['all', 'All'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']].map(([key, label]) => (
          <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      {loading ? <p>Loading orders…</p> : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet</p>
          <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20 }}>Shop Now</Link>
        </div>
      ) : filtered.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-info" style={{ flex: 1 }}>
            <div className="order-number">Order #{order.order_number}</div>
            <div className="order-name">{order.product_name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <span className={`badge badge-${statusColors[order.order_status] || 'gray'}`}>{order.order_status}</span>
              {/* Only show payment badge when it gives extra info — e.g. "Paid" on a delivered order */}
              {order.payment_status && order.payment_status !== order.order_status && (
                <span className={`badge badge-${order.payment_status === 'Paid' ? 'green' : 'amber'}`}>{order.payment_status}</span>
              )}
            </div>
            <div className="order-meta">
              <span>Qty: {order.quantity}</span>
              <span>₹{order.order_amount?.toLocaleString()}</span>
              <span>{new Date(order.created_date).toLocaleDateString()}</span>
              <span>via {order.payment_method}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <Link to={`/order/${order.id}`} className="btn-outline btn-sm">View Details</Link>
            {['Pending', 'Confirmed'].includes(order.order_status) && (
              <button className="btn-danger btn-sm" onClick={() => handleCancel(order.id)}>Cancel</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}