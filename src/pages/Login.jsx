import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/index.js';
import toast from 'react-hot-toast';

export default function Login() {
  const { loginCustomer } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const justRegistered = searchParams.get('registered') === '1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login(form);
      loginCustomer(data);
      toast.success('Welcome back, ' + data.customer.name + '!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    wrapper:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', background: '#f4f6fa' },
    card:       { background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', overflow: 'hidden', width: '100%', maxWidth: 860, display: 'grid', gridTemplateColumns: '1fr 1fr' },
    left:       { background: 'linear-gradient(135deg,#2a5298,#1e3c72)', padding: '48px 36px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    leftH2:     { fontSize: '1.8rem', fontWeight: 800, marginBottom: 16 },
    leftP:      { color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.95rem' },
    right:      { padding: '48px 40px' },
    rightH3:    { fontSize: '1.4rem', fontWeight: 700, marginBottom: 28, color: '#1f2937' },
    submitBtn:  { width: '100%', background: loading ? '#6b7280' : 'linear-gradient(135deg,#2a5298,#1e3c72)', color: '#fff', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', marginTop: 8 },
    passBox:    { position: 'relative' },
    passToggle: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem' },
    forgotLink: { textAlign: 'right', marginTop: -12, marginBottom: 16 },
    inputStyle: { width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#f8fbff', outline: 'none', fontSize: '0.92rem', color: '#1f2937', boxSizing: 'border-box' },
    labelStyle: { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: '#374151' },
  };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>

        {/* Left panel */}
        <div style={s.left}>
          <h2 style={s.leftH2}>Welcome Back</h2>
          <p style={s.leftP}>Sign in to your HoldKart account and continue shopping for quality refurbished electronics.</p>
          <div style={{ marginTop: 40 }}>
            {['Quality Certified Products', 'Easy Returns & Refunds', 'Fast Delivery', 'Warranty on All Items'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={s.right}>
          <h3 style={s.rightH3}>Login</h3>

          {/* Registration success banner */}
          {justRegistered && (
            <div style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem', fontWeight: 600 }}>
              ✅ Account created! Please log in to continue.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={s.labelStyle}>Email / Mobile</label>
              <input
                type="text"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={s.inputStyle}
                onFocus={e => e.target.style.borderColor = '#2a5298'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={s.labelStyle}>Password</label>
              <div style={s.passBox}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ ...s.inputStyle, paddingRight: 56 }}
                  onFocus={e => e.target.style.borderColor = '#2a5298'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <button type="button" style={s.passToggle} onClick={() => setShowPwd(prev => !prev)}>
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={s.forgotLink}>
              <Link to="/forgot" style={{ color: '#2a5298', fontSize: '0.85rem', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" style={s.submitBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#2a5298', fontWeight: 600 }}>Create one free →</Link>
          </p>
        </div>

      </div>
    </div>
  );
}