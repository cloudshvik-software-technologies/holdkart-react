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
      navigate('/home');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page:       { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', padding: '40px 16px 60px', fontFamily: '-apple-system, "Segoe UI", Roboto, Arial, sans-serif' },
    logoWrap:   { marginBottom: 24 },
    logo:       { fontSize: '2rem', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.5px' },
    logoAccent: { color: '#2a5298' },
    card:       { width: '100%', maxWidth: 380, border: '1px solid #e3e6e6', borderRadius: 8, padding: '24px 28px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    title:      { fontSize: '1.7rem', fontWeight: 500, color: '#1f2937', marginBottom: 18 },
    banner:     { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: 6, marginBottom: 18, fontSize: '0.85rem', fontWeight: 600 },
    labelStyle: { display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4, color: '#0f1111' },
    inputStyle: { width: '100%', padding: '9px 10px', border: '1px solid #a6a6a6', borderRadius: 4, outline: 'none', fontSize: '0.95rem', color: '#1f2937', boxSizing: 'border-box' },
    passBox:    { position: 'relative' },
    passToggle: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#2a5298', fontSize: '0.8rem', fontWeight: 600 },
    forgotLink: { display: 'block', marginTop: 6, marginBottom: 16 },
    submitBtn:  { width: '100%', background: loading ? '#f0d9a8' : '#f6c343', color: '#0f1111', padding: '9px', borderRadius: 8, fontWeight: 500, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', border: '1px solid #d8a92e', marginTop: 6 },
    fieldGap:   { marginBottom: 16 },
    divider:    { display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 16px' },
    dividerLine:{ flex: 1, height: 1, background: '#e3e6e6' },
    dividerText:{ fontSize: '0.78rem', color: '#767676' },
    smallText:  { fontSize: '0.78rem', color: '#555', lineHeight: 1.6, marginTop: 14 },
    link:       { color: '#2a5298', textDecoration: 'none' },
    footerCard: { width: '100%', maxWidth: 380, textAlign: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid #e3e6e6' },
    createBtn:  { display: 'inline-block', width: '100%', maxWidth: 380, marginTop: 12, padding: '9px', borderRadius: 8, border: '1px solid #a6a6a6', background: '#f3f3f3', color: '#0f1111', fontSize: '0.9rem', fontWeight: 500, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' },
  };

  return (
    <div style={s.page}>
      <div style={s.logoWrap}>
        <span style={s.logo}>Hold<span style={s.logoAccent}>Kart</span></span>
      </div>

      <div style={s.card}>
        <h1 style={s.title}>Sign in</h1>

        {justRegistered && (
          <div style={s.banner}>✅ Account created! Please log in to continue.</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={s.fieldGap}>
            <label style={s.labelStyle}>Email or mobile number</label>
            <input
              type="text"
              required
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              style={s.inputStyle}
              onFocus={e => { e.target.style.borderColor = '#2a5298'; e.target.style.boxShadow = '0 0 0 3px rgba(42,82,152,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#a6a6a6'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={s.labelStyle}>Password</label>
            <div style={s.passBox}>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ ...s.inputStyle, paddingRight: 56 }}
                onFocus={e => { e.target.style.borderColor = '#2a5298'; e.target.style.boxShadow = '0 0 0 3px rgba(42,82,152,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = '#a6a6a6'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" style={s.passToggle} onClick={() => setShowPwd(prev => !prev)}>
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
            <Link to="/forgot" style={{ ...s.link, ...s.forgotLink, fontSize: '0.8rem' }}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={s.smallText}>
          By continuing, you agree to HoldKart's{' '}
          <Link to="/terms" style={s.link}>Conditions of Use</Link> and{' '}
          <Link to="/privacy" style={s.link}>Privacy Notice</Link>.
        </p>
      </div>

      <div style={s.divider}>
        <div style={s.dividerLine} />
        <span style={s.dividerText}>New to HoldKart?</span>
        <div style={s.dividerLine} />
      </div>

      <Link to="/register" style={s.createBtn}>
        Create your HoldKart account
      </Link>
    </div>
  );
}