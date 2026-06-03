import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/index.js';
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
  Pending:    { color: '#e47911', text: '#e47911', bg: '#fff8ed' },
  Confirmed:  { color: '#2a5298', text: '#2a5298', bg: '#eef2ff' },
  Processing: { color: '#c7511f', text: '#c7511f', bg: '#fff3ec' },
  Shipped:    { color: '#007600', text: '#007600', bg: '#e6f4ea' },
  Delivered:  { color: '#007600', text: '#007600', bg: '#e6f4ea' },
  Cancelled:  { color: '#c40000', text: '#c40000', bg: '#fce8e8' },
  Returned:   { color: '#666',    text: '#666',    bg: '#f5f5f5' },
};

function matchesPeriod(order, period) {
  const d = new Date(order.created_date || order.created_at);
  const now = new Date();
  if (period === '3m')      return d >= new Date(now.setMonth(now.getMonth() - 3));
  if (period === '6m')      return d >= new Date(now.setMonth(now.getMonth() - 6));
  if (period === 'year')    return d.getFullYear() === new Date().getFullYear();
  if (period === 'lastyear') return d.getFullYear() === new Date().getFullYear() - 1;
  return true;
}

function matchesTab(order, tab) {
  const s = (order.order_status || '').toLowerCase();
  if (tab === 'all')       return true;
  if (tab === 'open')      return ['pending', 'confirmed', 'processing'].includes(s);
  if (tab === 'shipped')   return s === 'shipped';
  if (tab === 'cancelled') return s === 'cancelled' || s === 'returned';
  if (tab === 'delivered') return s === 'delivered';
  return true;
}

/* ─── Order Card ──────────────────────────────────────────────── */
function OrderCard({ order, onCancel }) {
  const navigate = useNavigate();
  const status   = order.order_status || 'Pending';
  const style    = STATUS_DOT[status] || STATUS_DOT.Pending;
  const orderId  = order.id || order._id || '';
  const orderNum = order.order_number || String(orderId).slice(-8).toUpperCase();

  const isDelivered  = status === 'Delivered';
  const isCancelled  = status === 'Cancelled' || status === 'Returned';
  const canCancel    = ['Pending', 'Confirmed'].includes(status);

  return (
    <div className="amz-card">
      {/* ── Card Header ── */}
      <div className="amz-card-head">
        <div className="amz-card-head-cols">
          <div className="amz-head-col">
            <span className="amz-head-label">ORDER PLACED</span>
            <span className="amz-head-value">{fmtShort(order.created_date || order.created_at)}</span>
          </div>
          <div className="amz-head-col">
            <span className="amz-head-label">TOTAL</span>
            <span className="amz-head-value">₹{(order.order_amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="amz-head-col">
            <span className="amz-head-label">PAYMENT</span>
            <span className="amz-head-value">{order.payment_method || 'Online'}</span>
          </div>
        </div>
        <div className="amz-card-head-right">
          <span className="amz-head-label">ORDER # {orderNum}</span>
          <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
            <button className="amz-link" onClick={() => navigate(`/order/${orderId}`)}>
              View order details
            </button>
            <span className="amz-head-divider">|</span>
            <button className="amz-link" onClick={() => navigate(`/order/${orderId}`)}>
              Invoice
            </button>
          </div>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="amz-card-body">
        {/* Status headline */}
        <div className="amz-status-line">
          {isDelivered ? (
            <span className="amz-delivered-text">
              ✔ Delivered {fmt(order.updated_at || order.created_date || order.created_at)}
            </span>
          ) : isCancelled ? (
            <span style={{ fontWeight: 700, color: '#c40000', fontSize: '1rem' }}>
              ✖ {status}
            </span>
          ) : (
            <span style={{ fontWeight: 700, color: style.text, fontSize: '1rem' }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                background: style.color, marginRight: 6, verticalAlign: 'middle',
              }} />
              {status}
            </span>
          )}
        </div>

        <div className="amz-body-row">
          {/* Product Image */}
          {order.product_image ? (
            <img
              src={order.product_image}
              alt={order.product_name}
              className="amz-prod-img"
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="amz-prod-img-placeholder">
              <span style={{ fontSize: '2rem' }}>📦</span>
            </div>
          )}

          {/* Product details */}
          <div className="amz-prod-info">
            <div className="amz-prod-name">{order.product_name}</div>
            {order.category && (
              <div className="amz-prod-meta">{order.category}</div>
            )}
            <div className="amz-prod-meta">
              Qty: {order.quantity || 1}
              {order.size && <> &nbsp;·&nbsp; Size: {order.size}</>}
            </div>

            {/* Progress bar for active orders */}
            {!isCancelled && (
              <OrderProgress status={status} />
            )}

            {/* Action buttons */}
            <div className="amz-actions">
              {isDelivered && (
                <button className="amz-btn-primary" onClick={() => navigate('/products')}>
                  Buy it again
                </button>
              )}
              <button className="amz-btn-secondary" onClick={() => navigate(`/order/${orderId}`)}>
                View order
              </button>
              {canCancel && (
                <button
                  className="amz-btn-cancel"
                  onClick={() => onCancel(orderId)}
                >
                  Cancel order
                </button>
              )}
              {isDelivered && (
                <button className="amz-btn-secondary" onClick={() => toast.info('Return window check coming soon')}>
                  Return or replace
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
        const done    = i <= idx;
        const active  = i === idx;
        return (
          <div key={step} className="amz-step-item">
            {i < STEPS.length - 1 && (
              <div className={`amz-step-line ${i < idx ? 'done' : ''}`} />
            )}
            <div className={`amz-step-dot ${done ? 'done' : ''} ${active ? 'active' : ''}`} />
            <span className={`amz-step-label ${active ? 'active' : done ? 'done' : ''}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function Orders() {
  const { isAuthenticated, customer } = useAuth();
  const navigate = useNavigate();
  const [orders,   setOrders]  = useState([]);
  const [loading,  setLoading] = useState(true);
  const [tab,      setTab]     = useState('all');
  const [period,   setPeriod]  = useState('3m');
  const [search,   setSearch]  = useState('');

  const fetchOrders = async () => {
    try {
      const data = await orderService.listOrders();
      setOrders(Array.isArray(data) ? data : []);
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

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await orderService.cancelOrder({ orderId });
      toast.success('Order cancelled');
      fetchOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Cannot cancel this order');
    }
  };

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

  return (
    <div style={{ background: '#f0f2f2', minHeight: '100vh', fontFamily: "'Amazon Ember','Segoe UI',Arial,sans-serif", paddingTop: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* ── Layout ── */
        .amz-wrap { max-width: 1000px; margin: 0 auto; padding: 20px 16px 60px; }

        /* ── Page title row ── */
        .amz-title-row { display: flex; align-items: center; gap: 20; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
        .amz-title { font-size: 1.65rem; font-weight: 700; color: #0f1111; }

        /* ── Search bar ── */
        .amz-search-wrap { flex: 1; min-width: 220px; max-width: 500px; display: flex; }
        .amz-search-input {
          flex: 1; border: 1px solid #888c8c; border-right: none;
          border-radius: 4px 0 0 4px; padding: 8px 12px;
          font-size: 0.9rem; outline: none; font-family: inherit;
          background: #fff; color: #0f1111;
        }
        .amz-search-input:focus { border-color: #e77600; box-shadow: 0 0 0 3px rgba(231,118,0,0.25); }
        .amz-search-btn {
          background: linear-gradient(to bottom, #f7dfa5, #f0c14b);
          border: 1px solid #a88734; border-radius: 0 4px 4px 0;
          padding: 0 14px; cursor: pointer; font-size: 0.9rem; font-weight: 600;
          color: #111; font-family: inherit;
          transition: background 0.15s;
        }
        .amz-search-btn:hover { background: linear-gradient(to bottom, #f5d78e, #e8b842); }

        /* ── Filters bar ── */
        .amz-filters { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
        .amz-period-select {
          border: 1px solid #d5d9d9; border-radius: 8px;
          padding: 7px 28px 7px 12px; font-size: 0.88rem; font-family: inherit;
          background: linear-gradient(to bottom, #fff, #f7f8f8) no-repeat right 10px center;
          background-size: auto; color: #0f1111; cursor: pointer;
          outline: none; box-shadow: 0 2px 5px rgba(15,17,17,0.08);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23555'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }
        .amz-period-select:focus { border-color: #e77600; box-shadow: 0 0 0 3px rgba(231,118,0,0.2); }
        .amz-count-text { font-size: 0.9rem; color: #565959; }

        /* ── Tab nav ── */
        .amz-tabs { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 16px; gap: 0; overflow-x: auto; }
        .amz-tab {
          padding: 10px 20px; font-size: 0.88rem; font-weight: 500;
          color: #007185; background: none; border: none;
          border-bottom: 3px solid transparent; cursor: pointer;
          white-space: nowrap; font-family: inherit; transition: color 0.15s;
          margin-bottom: -1px;
        }
        .amz-tab:hover { color: #c7511f; }
        .amz-tab.active { color: #0f1111; border-bottom-color: #e77600; font-weight: 700; }

        /* ── Order Card ── */
        .amz-card {
          background: #fff; border: 1px solid #d5d9d9; border-radius: 8px;
          margin-bottom: 16px; overflow: hidden;
          box-shadow: 0 2px 5px rgba(15,17,17,0.08);
          transition: box-shadow 0.2s;
        }
        .amz-card:hover { box-shadow: 0 4px 16px rgba(15,17,17,0.14); }

        /* Card header */
        .amz-card-head {
          display: flex; justify-content: space-between; align-items: flex-start;
          background: #f0f2f2; padding: 12px 18px;
          border-bottom: 1px solid #d5d9d9; gap: 16px; flex-wrap: wrap;
        }
        .amz-card-head-cols { display: flex; gap: 28px; flex-wrap: wrap; }
        .amz-card-head-right { text-align: right; flex-shrink: 0; }
        .amz-head-col { display: flex; flex-direction: column; gap: 2px; }
        .amz-head-label { font-size: 0.7rem; font-weight: 700; color: #565959; text-transform: uppercase; letter-spacing: 0.4px; }
        .amz-head-value { font-size: 0.88rem; font-weight: 600; color: #0f1111; }
        .amz-head-divider { color: #ccc; }

        /* Card body */
        .amz-card-body { padding: 16px 18px; }
        .amz-status-line { margin-bottom: 14px; }
        .amz-delivered-text { font-size: 1rem; font-weight: 700; color: '#007600'; }
        .amz-body-row { display: flex; gap: 18px; align-items: flex-start; }

        /* Product image */
        .amz-prod-img {
          width: 100px; height: 100px; object-fit: contain;
          border: 1px solid #e8e8e8; border-radius: 4px; flex-shrink: 0;
          background: #fafafa; padding: 4px;
        }
        .amz-prod-img-placeholder {
          width: 100px; height: 100px; border: 1px solid #e8e8e8; border-radius: 4px;
          background: #f0f2f2; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .amz-prod-info { flex: 1; }
        .amz-prod-name { font-size: 0.98rem; font-weight: 600; color: #007185; margin-bottom: 4px; line-height: 1.4; }
        .amz-prod-name:hover { color: #c7511f; cursor: pointer; }
        .amz-prod-meta { font-size: 0.82rem; color: #565959; margin-bottom: 4px; }

        /* Actions */
        .amz-actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
        .amz-btn-primary {
          background: linear-gradient(to bottom, #f7dfa5, #f0c14b);
          border: 1px solid #a88734; border-radius: 20px;
          padding: 7px 18px; font-size: 0.84rem; font-weight: 700;
          color: #111; cursor: pointer; font-family: inherit;
          transition: background 0.15s;
        }
        .amz-btn-primary:hover { background: linear-gradient(to bottom, #f5d78e, #e8b842); }
        .amz-btn-secondary {
          background: #fff; border: 1px solid #d5d9d9; border-radius: 20px;
          padding: 7px 18px; font-size: 0.84rem; font-weight: 600;
          color: #0f1111; cursor: pointer; font-family: inherit;
          box-shadow: 0 2px 5px rgba(15,17,17,0.07);
          transition: background 0.15s, border-color 0.15s;
        }
        .amz-btn-secondary:hover { background: #f7fafa; border-color: #aaa; }
        .amz-btn-cancel {
          background: #fff; border: 1px solid #d5d9d9; border-radius: 20px;
          padding: 7px 18px; font-size: 0.84rem; font-weight: 600;
          color: #c40000; cursor: pointer; font-family: inherit;
          transition: background 0.15s;
        }
        .amz-btn-cancel:hover { background: #fce8e8; border-color: #c40000; }

        /* Link style */
        .amz-link {
          background: none; border: none; color: #007185;
          font-size: 0.82rem; cursor: pointer; font-family: inherit;
          padding: 0; text-decoration: none;
          transition: color 0.15s;
        }
        .amz-link:hover { color: #c7511f; text-decoration: underline; }

        /* ── Progress stepper ── */
        .amz-progress-wrap {
          display: flex; align-items: flex-start; margin-top: 14px;
          position: relative;
        }
        .amz-step-item {
          display: flex; flex-direction: column; align-items: center;
          flex: 1; position: relative;
        }
        .amz-step-line {
          position: absolute; top: 8px; left: 50%; right: -50%;
          height: 3px; background: #d5d9d9; z-index: 0; transition: background 0.3s;
        }
        .amz-step-line.done { background: #007600; }
        .amz-step-dot {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid #d5d9d9; background: #fff;
          z-index: 1; transition: all 0.3s; flex-shrink: 0;
        }
        .amz-step-dot.done  { background: #007600; border-color: #007600; }
        .amz-step-dot.active { background: #fff; border-color: #007600; border-width: 3px; box-shadow: 0 0 0 3px rgba(0,118,0,0.15); }
        .amz-step-label {
          font-size: 0.68rem; margin-top: 5px; color: #888;
          text-align: center; line-height: 1.2;
        }
        .amz-step-label.done   { color: #007600; }
        .amz-step-label.active { color: #0f1111; font-weight: 700; }

        /* ── Empty state ── */
        .amz-empty {
          background: #fff; border: 1px solid #d5d9d9; border-radius: 8px;
          padding: 60px 24px; text-align: center;
          box-shadow: 0 2px 5px rgba(15,17,17,0.08);
        }

        /* ── Skeleton ── */
        .amz-skel { background: linear-gradient(90deg,#e8e8e8 25%,#f5f5f5 50%,#e8e8e8 75%); background-size: 400% 100%; animation: skelAnim 1.4s ease-in-out infinite; border-radius: 4px; }
        @keyframes skelAnim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Responsive */
        @media (max-width: 600px) {
          .amz-card-head { flex-direction: column; }
          .amz-card-head-right { text-align: left; }
          .amz-body-row { flex-direction: column; }
          .amz-prod-img, .amz-prod-img-placeholder { width: 80px; height: 80px; }
          .amz-title { font-size: 1.3rem; }
        }
      `}</style>

      <div className="amz-wrap">

        {/* ── Page title + search ── */}
        <div className="amz-title-row">
          <h1 className="amz-title">Your Orders</h1>
          <div className="amz-search-wrap">
            <input
              className="amz-search-input"
              placeholder="Search all orders"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="amz-search-btn">🔍</button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="amz-tabs">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              className={`amz-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Period filter + count ── */}
        <div className="amz-filters">
          <span className="amz-count-text" style={{ fontWeight: 600, color: '#0f1111' }}>
            {loading ? '…' : `${filtered.length} order${filtered.length !== 1 ? 's' : ''}`}
          </span>
          <span className="amz-count-text">in</span>
          <select
            className="amz-period-select"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            {PERIOD_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#f0f2f2', padding: '12px 18px', display: 'flex', gap: 24 }}>
                  {[120, 100, 80].map((w, j) => <div key={j} className="amz-skel" style={{ height: 32, width: w }} />)}
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
              {search
                ? 'Try a different search term or clear the filter'
                : `You haven't placed any orders in the selected period`}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {search && (
                <button className="amz-btn-secondary" onClick={() => setSearch('')}>
                  Clear search
                </button>
              )}
              <button className="amz-btn-primary" onClick={() => navigate('/products')}>
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard
              key={order.id || order._id}
              order={order}
              onCancel={handleCancel}
            />
          ))
        )}
      </div>
    </div>
  );
}
