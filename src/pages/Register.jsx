import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/index.js';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authService.register({ name: form.name, email: form.email, mobile: form.mobile, password: form.password });
      toast.success('Account created! Please log in.');
      navigate('/login?registered=1');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page:       { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', padding: '20px 16px 30px', fontFamily: '-apple-system, "Segoe UI", Roboto, Arial, sans-serif' },
    logoWrap:   { marginBottom: 16 },
    logo:       { fontSize: '2rem', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.5px' },
    logoAccent: { color: '#2a5298' },
    card:       { width: '100%', maxWidth: 380, border: '1px solid #e3e6e6', borderRadius: 8, padding: '16px 28px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    title:      { fontSize: '1.7rem', fontWeight: 500, color: '#1f2937', marginBottom: 8 },
    labelStyle: { display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4, color: '#0f1111' },
    optionalSpan: { color: '#9ca3af', fontWeight: 400 },
    inputStyle: { width: '100%', padding: '6px 10px', border: '1px solid #a6a6a6', borderRadius: 4, outline: 'none', fontSize: '0.95rem', color: '#1f2937', boxSizing: 'border-box' },
    passBox:    { position: 'relative' },
    passToggle: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#2a5298', fontSize: '0.8rem', fontWeight: 600 },
    fieldGap:   { marginBottom: 8 },
    hint:       { fontSize: '0.72rem', color: '#6b7280', marginTop: 2 },
    errorHint:  { color: '#ef4444', fontSize: '0.75rem', marginTop: 4 },
    submitBtn:  { width: '100%', background: loading ? '#f0d9a8' : '#f6c343', color: '#0f1111', padding: '8px', borderRadius: 8, fontWeight: 500, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', border: '1px solid #d8a92e', marginTop: 6 },
    smallText:  { fontSize: '0.78rem', color: '#555', lineHeight: 1.6, marginTop: 8 },
    link:       { color: '#2a5298', textDecoration: 'none' },
    divider:    { display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 10px', width: '100%', maxWidth: 380 },
    dividerLine:{ flex: 1, height: 1, background: '#e3e6e6' },
    dividerText:{ fontSize: '0.78rem', color: '#767676' },
    signinBtn:  { display: 'inline-block', width: '100%', maxWidth: 380, padding: '8px', borderRadius: 8, border: '1px solid #a6a6a6', background: '#f3f3f3', color: '#0f1111', fontSize: '0.9rem', fontWeight: 500, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' },
  };

  return (
    <div style={s.page}>
      <div style={s.logoWrap}>
        <span style={s.logo}>Hold<span style={s.logoAccent}>Kart</span></span>
      </div>

      <div style={s.card}>
        <h1 style={s.title}>Create account</h1>

        <form onSubmit={handleSubmit}>
          <div style={s.fieldGap}>
            <label style={s.labelStyle}>Your name</label>
            <input
              type="text"
              placeholder="First and last name"
              required
              value={form.name}
              onChange={set('name')}
              style={s.inputStyle}
              onFocus={e => { e.target.style.borderColor = '#2a5298'; e.target.style.boxShadow = '0 0 0 3px rgba(42,82,152,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#a6a6a6'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={s.fieldGap}>
            <label style={s.labelStyle}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={set('email')}
              style={s.inputStyle}
              onFocus={e => { e.target.style.borderColor = '#2a5298'; e.target.style.boxShadow = '0 0 0 3px rgba(42,82,152,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#a6a6a6'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={s.fieldGap}>
            <label style={s.labelStyle}>Mobile number <span style={s.optionalSpan}>(optional)</span></label>
            <input
              type="tel"
              placeholder="+91 XXXXXXXXXX"
              value={form.mobile}
              onChange={set('mobile')}
              style={s.inputStyle}
              onFocus={e => { e.target.style.borderColor = '#2a5298'; e.target.style.boxShadow = '0 0 0 3px rgba(42,82,152,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#a6a6a6'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={s.fieldGap}>
            <label style={s.labelStyle}>Password</label>
            <div style={s.passBox}>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="At least 6 characters"
                required
                value={form.password}
                onChange={set('password')}
                style={{ ...s.inputStyle, paddingRight: 56 }}
                onFocus={e => { e.target.style.borderColor = '#2a5298'; e.target.style.boxShadow = '0 0 0 3px rgba(42,82,152,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = '#a6a6a6'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" style={s.passToggle} onClick={() => setShowPwd(s2 => !s2)}>
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
            <p style={s.hint}>Passwords must be at least 6 characters.</p>
          </div>

          <div style={s.fieldGap}>
            <label style={s.labelStyle}>Re-enter password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              required
              value={form.confirm}
              onChange={set('confirm')}
              style={{
                ...s.inputStyle,
                borderColor: form.confirm && form.confirm !== form.password ? '#ef4444' : '#a6a6a6',
              }}
              onFocus={e => { e.target.style.borderColor = '#2a5298'; e.target.style.boxShadow = '0 0 0 3px rgba(42,82,152,0.15)'; }}
              onBlur={e => {
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = (form.confirm && form.confirm !== form.password) ? '#ef4444' : '#a6a6a6';
              }}
            />
            {form.confirm && form.confirm !== form.password && (
              <p style={s.errorHint}>Passwords don't match</p>
            )}
          </div>

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? 'Creating account…' : 'Verify email'}
          </button>
        </form>

        <p style={s.smallText}>
          By creating an account, you agree to HoldKart's{' '}
          <Link to="/terms" style={s.link}>Conditions of Use</Link> and{' '}
          <Link to="/privacy" style={s.link}>Privacy Notice</Link>.
        </p>
      </div>

      <div style={s.divider}>
        <div style={s.dividerLine} />
        <span style={s.dividerText}>Already a customer?</span>
        <div style={s.dividerLine} />
      </div>

      <Link to="/login" style={s.signinBtn}>
        Sign in to your account
      </Link>
    </div>
  );
}