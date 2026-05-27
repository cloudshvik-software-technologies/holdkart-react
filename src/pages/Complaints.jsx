import { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { complaintService, orderService } from '../services/index.js';
  import { useAuth } from '../context/AuthContext.jsx';
  import toast from 'react-hot-toast';

  const statusColors = { Open: 'amber', 'In Progress': 'blue', Resolved: 'green', Closed: 'gray' };

  export default function Complaints() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ orderId: '', subject: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const fetchAll = async () => {
      try {
        const [c, o] = await Promise.all([complaintService.listComplaints(), orderService.listOrders()]);
        setComplaints(Array.isArray(c) ? c : []);
        setOrders(Array.isArray(o) ? o : []);
      } catch {} finally { setLoading(false); }
    };

    useEffect(() => { if (!isAuthenticated) { navigate('/login'); return; } fetchAll(); }, [isAuthenticated]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!form.subject || !form.description) { toast.error('Please fill all fields'); return; }
      setSubmitting(true);
      try {
        await complaintService.submitComplaint(form);
        toast.success('Complaint submitted!');
        setForm({ orderId: '', subject: '', description: '' });
        setShowForm(false);
        fetchAll();
      } catch(e) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
    };

    return (
      <div className="page-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 className="page-title" style={{ margin: 0 }}>My Complaints</h1>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Complaint'}</button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Submit a Complaint</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Related Order (optional)</label>
                <select value={form.orderId} onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))}>
                  <option value="">Select an order…</option>
                  {orders.map(o => <option key={o.id} value={o.id}>#{o.order_number} — {o.product_name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Subject</label><input required placeholder="Brief description of the issue" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
              <div className="form-group"><label>Description</label><textarea rows={4} required placeholder="Describe your issue in detail…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Complaint'}</button>
            </form>
          </div>
        )}

        {loading ? <p>Loading…</p> : complaints.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><h3>No complaints</h3><p>Submit a complaint if you have an issue</p></div>
        ) : complaints.map(c => (
          <div key={c.id} className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h4 style={{ fontWeight: 600 }}>{c.subject}</h4>
              <span className={`badge badge-${statusColors[c.status] || 'gray'}`}>{c.status}</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 8 }}>{c.description}</p>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--muted)' }}>
              <span>Submitted: {new Date(c.created_date).toLocaleDateString()}</span>
              {c.order_id && <span>Order ID: #{c.order_id}</span>}
              {c.resolved_date && <span>Resolved: {new Date(c.resolved_date).toLocaleDateString()}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }
  