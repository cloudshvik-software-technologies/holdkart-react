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

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #d9e2f2',
    borderRadius: 12,
    background: '#f8fbff',
    outline: 'none',
    fontSize: '0.88rem',
    color: '#1f2937',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 7,
    display: 'block',
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      background: 'linear-gradient(135deg,#eef4ff,#f7faff)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '100px 20px 50px',
    }}>

      <div style={{
        width: '100%',
        maxWidth: 900,
        background: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        boxShadow: '0 20px 60px rgba(30,60,114,.10)',
      }}>

        {/* LEFT */}
        <div style={{
          background: 'linear-gradient(160deg,#0f2c6b,#1f4fa8)',
          padding: '40px 28px',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>

          <div>
            <div style={{
              fontSize: '0.72rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.7)',
              marginBottom: 16,
              fontWeight: 700,
            }}>
              HoldKart Customer Portal
            </div>

            <h1 style={{
              fontSize: '1.8rem',
              lineHeight: 1.3,
              fontWeight: 800,
              marginBottom: 16,
            }}>
              Join HoldKart <br /> Today
            </h1>

            <p style={{
              color: 'rgba(255,255,255,.8)',
              lineHeight: 1.7,
              fontSize: '0.88rem',
            }}>
              Create your account and start shopping for quality products at unbeatable prices.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Quality Certified Products',
              'Easy Returns & Refunds',
              'Fast Pan-India Delivery',
              'Warranty on All Items',
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,.08)',
                  border: '1px solid rgba(255,255,255,.08)',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                }}
              >
                ✓ {t}
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT */}
        <div style={{ padding: '38px' }}>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#1f2937',
            marginBottom: 34,
          }}>
            Create Account
          </h1>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: 18 }}>

              {/* Full Name */}
              <div>
                <label style={labelStyle}>
                  Full Name <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  value={form.name}
                  onChange={set('name')}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2a5298'}
                  onBlur={e => e.target.style.borderColor = '#d9e2f2'}
                />
              </div>

              {/* Email + Mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>
                    Email Address <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={form.email}
                    onChange={set('email')}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2a5298'}
                    onBlur={e => e.target.style.borderColor = '#d9e2f2'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Mobile{' '}
                    <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    value={form.mobile}
                    onChange={set('mobile')}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2a5298'}
                    onBlur={e => e.target.style.borderColor = '#d9e2f2'}
                  />
                </div>
              </div>

              {/* Password + Confirm */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>
                    Password <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      required
                      value={form.password}
                      onChange={set('password')}
                      style={{ ...inputStyle, paddingRight: 42 }}
                      onFocus={e => e.target.style.borderColor = '#2a5298'}
                      onBlur={e => e.target.style.borderColor = '#d9e2f2'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#9ca3af' }}
                    >
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>
                    Confirm Password <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    required
                    value={form.confirm}
                    onChange={set('confirm')}
                    style={{
                      ...inputStyle,
                      borderColor: form.confirm && form.confirm !== form.password ? '#ef4444' : '#d9e2f2',
                    }}
                    onFocus={e => e.target.style.borderColor = '#2a5298'}
                    onBlur={e => {
                      if (form.confirm && form.confirm !== form.password) e.target.style.borderColor = '#ef4444';
                      else e.target.style.borderColor = '#d9e2f2';
                    }}
                  />
                  {form.confirm && form.confirm !== form.password && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>Passwords don't match</p>
                  )}
                </div>
              </div>

            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 38 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 30px',
                  border: 'none',
                  borderRadius: 12,
                  background: loading ? '#93c5fd' : 'linear-gradient(135deg,#1f4fa8,#0f2c6b)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(30,60,114,0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Creating account…' : 'Create My Account →'}
              </button>
            </div>

            <p style={{
              textAlign: 'center',
              marginTop: 24,
              color: '#6b7280',
              fontSize: '0.84rem',
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1f4fa8', fontWeight: 700, textDecoration: 'none' }}>
                Sign In
              </Link>
            </p>

          </form>

        </div>

      </div>

    </div>
  );
}