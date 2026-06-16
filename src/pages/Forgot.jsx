import { useState } from 'react';
  import { Link } from 'react-router-dom';
  import { authService } from '../services/index.js';
  import toast from 'react-hot-toast';

  export default function Forgot() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
        await authService.forgotPassword({ email });
        setSent(true);
        toast.success('Reset link sent if email is registered');
      } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
    };

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#eef2ff,#f4f6fa)' }}>
        <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Forgot Password</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>Enter your email and we'll send you a reset link.</p>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}></div>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Check your inbox</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>A reset link has been sent to <strong>{email}</strong></p>
                <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20 }}>Back to Login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.88rem', color: 'var(--muted)' }}>
              <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 500 }}>← Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
  