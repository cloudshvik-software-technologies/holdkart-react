import { useState } from 'react';
  import { useNavigate, useSearchParams, Link } from 'react-router-dom';
  import { authService } from '../services/index.js';
  import toast from 'react-hot-toast';

  export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
      setLoading(true);
      try {
        await authService.resetPassword({ token, password: form.password });
        toast.success('Password reset! Please log in.');
        navigate('/login');
      } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); } finally { setLoading(false); }
    };

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#eef2ff,#f4f6fa)' }}>
        <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Reset Password</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>Enter your new password below.</p>
            {!token ? (
              <p style={{ color: 'var(--danger)' }}>Invalid reset link. <Link to="/forgot" style={{ color: 'var(--blue)' }}>Request a new one</Link></p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group"><label>New Password</label><input type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
                <div className="form-group"><label>Confirm Password</label><input type="password" required value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} /></div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>{loading ? 'Resetting…' : 'Reset Password'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }
  