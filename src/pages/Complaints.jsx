import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService, orderService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const STATUS_META = {
  'Open':        { color: '#FF6B00', bg: '#FFF3E0' },
  'In Progress': { color: '#1d4ed8', bg: '#dbeafe' },
  'Resolved':    { color: '#16a34a', bg: '#dcfce7' },
  'Closed':      { color: '#6b7280', bg: '#f3f4f6' },
};

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f0f4f8'/%3E%3Ccircle cx='40' cy='30' r='12' fill='%23d1d9e6'/%3E%3Cpath d='M18 65 Q40 45 62 65Z' fill='%23d1d9e6'/%3E%3C/svg%3E";

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Go to My Orders, find your order, and click View order. Live tracking with courier updates appears once the order has shipped.',
  },
  {
    q: 'Can I cancel or return an order?',
    a: 'Pending and Confirmed orders can be cancelled from My Orders. Delivered orders are eligible for return within 7 days via the Return or replace option.',
  },
  {
    q: 'When will I get my refund?',
    a: 'Once the seller approves your return or cancellation, refunds are processed within 5-7 business days to your original payment method.',
  },
  {
    q: 'What is a Hold Deal?',
    a: 'Hold Deals let you group-buy with other customers to unlock a lower price. Once enough buyers join, all orders ship together at the discounted rate.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery takes 4-7 business days. You will receive SMS and email updates once your order ships.',
  },
  {
    q: 'My product arrived damaged. What do I do?',
    a: 'Raise a complaint below, selecting the relevant order and describing the damage. Our team will respond within 24 hours.',
  },
];

const QUICK_LINKS = [
  { label: 'Track an Order',    sub: 'Live status and courier info',     path: '/orders' },
  { label: 'Return or Replace', sub: 'Start a return on a delivered order', path: '/orders' },
  { label: 'Refund Status',     sub: 'Check where your refund stands',   path: '/orders' },
  { label: 'Hold Deals',        sub: 'Help with group-buy orders',       path: '/campaigns' },
];

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'open',        label: 'Open' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'resolved',    label: 'Resolved' },
  { id: 'closed',      label: 'Closed' },
];

function FAQItem({ faq, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid #EBEBEB',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '20px 0', background: 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16,
        }}
      >
        <span style={{
          fontWeight: 600, fontSize: '0.92rem', color: '#1f2937', lineHeight: 1.5,
          fontFamily: "'Inter', sans-serif",
        }}>
          {faq.q}
        </span>
        <span style={{
          flexShrink: 0,
          width: 24, height: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', fontWeight: 300,
          color: open ? '#FF6B00' : '#9ca3af',
          transition: 'color 0.2s',
          lineHeight: 1,
        }}>
          {open ? '-' : '+'}
        </span>
      </button>
      {open && (
        <p style={{
          fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.75,
          paddingBottom: 20, margin: 0,
          fontFamily: "'Inter', sans-serif",
        }}>
          {faq.a}
        </p>
      )}
    </div>
  );
}

export default function Complaints() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [complaints, setComplaints] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ orderId: '', subject: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [viewingResolution, setViewingResolution] = useState(null);

  const fetchAll = async () => {
    try {
      const [c, o] = await Promise.all([
        complaintService.listComplaints(),
        orderService.listOrders(),
      ]);
      setComplaints(Array.isArray(c) ? c : []);
      setOrders(Array.isArray(o) ? o : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchAll();
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) { toast.error('Please fill all fields'); return; }
    if (selectedProductInReview) {
      toast.error('Already a complaint is in review for this product.');
      return;
    }
    setSubmitting(true);
    try {
      await complaintService.submitComplaint(form);
      toast.success('Complaint submitted successfully.');
      setForm({ orderId: '', subject: '', description: '' });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openForm = () => {
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const filtered = activeTab === 'all'
    ? complaints
    : complaints.filter(c => (c.status || '').toLowerCase().replace(' ', '-') === activeTab);

  // product_ids that already have an Open / In Progress complaint —
  // used to block raising a second complaint for the same product.
  const productIdsInReview = new Set(
    complaints
      .filter(c => c.product_id && (c.status === 'Open' || c.status === 'In Progress'))
      .map(c => c.product_id)
  );
  const selectedOrder = orders.find(o => String(o.id) === String(form.orderId));
  const selectedProductInReview = !!(selectedOrder?.product_id && productIdsInReview.has(selectedOrder.product_id));

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #e5e7eb', borderRadius: 8,
    fontSize: '0.875rem', background: '#fff',
    outline: 'none', fontFamily: "'Inter', sans-serif",
    color: '#1f2937', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block', fontWeight: 600,
    fontSize: '0.8rem', color: '#374151',
    marginBottom: 6, letterSpacing: '0.02em',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div className="hk-cmp-root" style={{
      background: '#F7F8FA', minHeight: '100vh',
      paddingTop: 112, fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @media (max-width: 768px) {
          .hk-cmp-two-col { grid-template-columns: 1fr !important; }
          .hk-cmp-root { padding-top: 98px !important; }
          .hk-cmp-hero { padding: 28px 16px !important; }
          .hk-cmp-hero-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .hk-cmp-body { padding: 24px 16px 60px !important; }
        }
        @media (max-width: 480px) {
          .hk-cmp-root { padding-top: 92px !important; }
          .hk-cmp-hero { padding: 20px 12px !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <div className="hk-cmp-hero" style={{
        background: '#fff',
        borderBottom: '1px solid #EBEBEB',
        padding: '52px 24px',
      }}>
        <div className="hk-cmp-hero-row" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ borderLeft: '3px solid #FF6B00', paddingLeft: 24 }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF6B00' }}>
              Support Center
            </p>
            <h1 style={{
              margin: '0 0 10px', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1.15,
            }}>
              How can we help?
            </h1>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.6, maxWidth: 480 }}>
              Find answers to common questions below, or raise a ticket and we will respond within one business day.
            </p>
          </div>
          <button
            onClick={openForm}
            style={{
              background: '#FF6B00', color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: 8, fontWeight: 700,
              fontSize: '0.88rem', cursor: 'pointer', letterSpacing: '0.01em',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E85D04'}
            onMouseLeave={e => e.currentTarget.style.background = '#FF6B00'}
          >
            Raise a Complaint
          </button>
        </div>
      </div>

      <div className="hk-cmp-body" style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── QUICK LINKS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 48,
        }}>
          {QUICK_LINKS.map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              style={{
                background: '#fff', border: '1px solid #E5E7EB',
                borderRadius: 10, padding: '18px 20px',
                textAlign: 'left', cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#FF6B00';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{a.label}</span>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.4 }}>{a.sub}</span>
            </button>
          ))}
        </div>

        {/* ── TWO-COL: FAQ + CONTACT ── */}
        <div className="hk-cmp-two-col" style={{
          display: 'grid', gridTemplateColumns: '3fr 2fr',
          gap: 32, alignItems: 'start', marginBottom: 48,
        }}>

          {/* FAQ */}
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #E5E7EB', padding: '32px 36px',
          }}>
            <h2 style={{
              margin: '0 0 4px', fontSize: '1rem', fontWeight: 800,
              color: '#111827', letterSpacing: '-0.01em',
            }}>
              Common Questions
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '0.8rem', color: '#9ca3af' }}>
              Answers to the questions we hear most often.
            </p>
            {FAQS.map((f, i) => <FAQItem key={i} faq={f} index={i} />)}
          </div>

          {/* CONTACT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Contact card */}
            <div style={{
              background: '#fff', borderRadius: 12,
              border: '1px solid #E5E7EB', padding: '28px',
            }}>
              <h2 style={{
                margin: '0 0 20px', fontSize: '1rem', fontWeight: 800,
                color: '#111827', letterSpacing: '-0.01em',
              }}>
                Contact Us
              </h2>
              {[
                { label: 'Email', value: 'support@holdkart.com' },
                { label: 'Phone', value: '+91 1800-XXX-XXXX' },
                { label: 'Hours', value: 'Mon - Sat, 9 AM to 6 PM IST' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', gap: 12,
                  padding: '12px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA card */}
            <div style={{
              background: '#111827', borderRadius: 12,
              padding: '28px',
            }}>
              <p style={{
                margin: '0 0 6px', fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF6B00',
              }}>
                Need more help?
              </p>
              <h3 style={{
                color: '#fff', fontWeight: 800, margin: '0 0 10px',
                fontSize: '1.05rem', letterSpacing: '-0.02em', lineHeight: 1.3,
              }}>
                Raise a support ticket
              </h3>
              <p style={{
                color: '#9ca3af', fontSize: '0.82rem', margin: '0 0 20px', lineHeight: 1.65,
              }}>
                A support agent will review your case and respond within one business day.
              </p>
              <button
                onClick={openForm}
                style={{
                  background: '#FF6B00', color: '#fff', border: 'none',
                  padding: '10px 0', borderRadius: 7, fontWeight: 700,
                  fontSize: '0.85rem', cursor: 'pointer', width: '100%',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#E85D04'}
                onMouseLeave={e => e.currentTarget.style.background = '#FF6B00'}
              >
                Raise a Complaint
              </button>
            </div>
          </div>
        </div>

        {/* ── COMPLAINT FORM ── */}
        {showForm && (
          <div ref={formRef} style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #E5E7EB',
            borderTop: '3px solid #FF6B00',
            padding: '36px',
            marginBottom: 48,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <div>
                <h2 style={{
                  margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800,
                  color: '#111827', letterSpacing: '-0.02em',
                }}>
                  Raise a Complaint
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#9ca3af' }}>
                  We will respond within one business day.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: 'none', border: '1px solid #E5E7EB',
                  borderRadius: 6, cursor: 'pointer',
                  padding: '4px 10px', fontSize: '0.8rem',
                  color: '#6b7280', fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>
                    Related Order <span style={{ color: '#9ca3af', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
                  </label>
                  <select
                    value={form.orderId}
                    onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select an order...</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.order_number} - {o.product_name}
                        {o.product_id && productIdsInReview.has(o.product_id) ? ' (complaint in review)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedProductInReview && (
                    <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                      Already a complaint is in review for this product.
                    </p>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Subject <span style={{ color: '#FF6B00' }}>*</span></label>
                  <input
                    required
                    placeholder="Brief description of the issue"
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FF6B00'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description <span style={{ color: '#FF6B00' }}>*</span></label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Describe the issue in detail - what happened, when it occurred, and any relevant order information."
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = '#FF6B00'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    background: '#fff', border: '1.5px solid #E5E7EB',
                    color: '#374151', padding: '10px 22px', borderRadius: 8,
                    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#9ca3af'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedProductInReview}
                  style={{
                    background: (submitting || selectedProductInReview) ? '#e5e7eb' : '#FF6B00',
                    color: (submitting || selectedProductInReview) ? '#9ca3af' : '#fff',
                    border: 'none', padding: '10px 28px',
                    borderRadius: 8, fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: (submitting || selectedProductInReview) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { if (!submitting && !selectedProductInReview) e.currentTarget.style.background = '#E85D04'; }}
                  onMouseLeave={e => { if (!submitting && !selectedProductInReview) e.currentTarget.style.background = '#FF6B00'; }}
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── MY COMPLAINTS ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{
              margin: 0, fontSize: '1.05rem', fontWeight: 800,
              color: '#111827', letterSpacing: '-0.02em',
            }}>
              My Complaints
            </h2>
            <span style={{
              fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af',
              background: '#F3F4F6', padding: '4px 12px', borderRadius: 20,
            }}>
              {complaints.length} {complaints.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>

          {/* Status tabs */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 24,
            borderBottom: '1.5px solid #E5E7EB',
          }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '9px 18px', border: 'none', background: 'none',
                  cursor: 'pointer', fontWeight: activeTab === t.id ? 700 : 500,
                  fontSize: '0.82rem',
                  color: activeTab === t.id ? '#FF6B00' : '#6b7280',
                  borderBottom: activeTab === t.id ? '2px solid #FF6B00' : '2px solid transparent',
                  marginBottom: -1.5,
                  transition: 'color 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{
              background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
              padding: '60px 32px', textAlign: 'center',
              color: '#9ca3af', fontSize: '0.875rem',
            }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
              padding: '60px 32px', textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#F3F4F6', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 20, height: 3, background: '#D1D5DB', borderRadius: 2 }} />
              </div>
              <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: 6, fontSize: '0.95rem' }}>
                No complaints found
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0 0 20px' }}>
                {activeTab === 'all'
                  ? 'You have not raised any support tickets yet.'
                  : 'No ' + TABS.find(t => t.id === activeTab)?.label + ' tickets found.'}
              </p>
              <button
                onClick={openForm}
                style={{
                  background: '#FF6B00', color: '#fff', border: 'none',
                  padding: '10px 24px', borderRadius: 8, fontWeight: 700,
                  fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                Raise a Complaint
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(c => {
                const meta = STATUS_META[c.status] || STATUS_META['Closed'];
                return (
                  <div key={c.id} style={{
                    background: '#fff', borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    borderLeft: '3px solid ' + meta.color,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {/* Product strip — what the complaint is actually about */}
                    {c.product_name && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 24px',
                        background: '#FAFAFB',
                        borderBottom: '1px solid #F3F4F6',
                      }}>
                        {/* <img
                          src={c.product_image || FALLBACK_IMG}
                          onError={e => { e.target.src = FALLBACK_IMG; }}
                          alt={c.product_name}
                          style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid #E5E7EB', flexShrink: 0 }}
                        /> */}
                        <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
                          Regarding
                        </span>
                        <span style={{ fontSize: '0.82rem', color: '#1f2937', fontWeight: 700, lineHeight: 1.3 }}>
                          {c.product_name}
                        </span>
                      </div>
                    )}

                    <div style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 16 }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', margin: 0, lineHeight: 1.4 }}>
                          {c.subject}
                        </h4>
                        <span style={{
                          flexShrink: 0, padding: '3px 10px', borderRadius: 4,
                          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          background: meta.bg, color: meta.color,
                        }}>
                          {c.status}
                        </span>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.65, margin: '0 0 14px' }}>
                        {c.description}
                      </p>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexWrap: 'wrap', gap: 12,
                        paddingTop: 12, borderTop: '1px solid #F3F4F6',
                      }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: '0.75rem', color: '#9ca3af' }}>
                          <span>Submitted {new Date(c.created_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {c.order_number ? <span>Order #{c.order_number}</span> : c.order_id && <span>Order #{c.order_id}</span>}
                          {c.resolved_date && <span>Resolved {new Date(c.resolved_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        </div>
                        {c.status === 'Resolved' && c.seller_resolution && (
                          <button
                            onClick={() => setViewingResolution(c)}
                            style={{
                              background: '#F0FDF4', border: '1px solid #BBF7D0',
                              color: '#16a34a', fontWeight: 700, fontSize: '0.78rem',
                              padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                            }}
                          >
                            View Response
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {viewingResolution && (
        <div
          onClick={() => setViewingResolution(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, zIndex: 100,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 14, maxWidth: 480, width: '100%',
              padding: '28px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div>
                <p style={{
                  margin: '0 0 6px', fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.04em', textTransform: 'uppercase', color: '#16a34a',
                }}>
                  Response from seller
                </p>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                  {viewingResolution.subject}
                </h3>
              </div>
              <button
                onClick={() => setViewingResolution(null)}
                style={{
                  background: '#F3F4F6', border: 'none', borderRadius: 6,
                  width: 28, height: 28, cursor: 'pointer', color: '#6b7280',
                  fontSize: '1rem', lineHeight: 1, flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
            <p style={{
              margin: 0, fontSize: '0.9rem', lineHeight: 1.7, color: '#374151',
              background: '#F9FAFB', border: '1px solid #E5E7EB',
              borderRadius: 8, padding: '14px 16px',
            }}>
              {viewingResolution.seller_resolution}
            </p>
            {viewingResolution.resolved_date && (
              <p style={{ margin: '14px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                Resolved {new Date(viewingResolution.resolved_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}