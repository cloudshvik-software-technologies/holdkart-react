import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/index.js';
import toast from 'react-hot-toast';

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [focused, setFocused] = useState(null);
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

  const passwordMismatch = form.confirm && form.confirm !== form.password;

  const inp = (field, hasError = false) => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    fontSize: '0.875rem',
    color: '#1a1a2e',
    background: '#fff',
    border: `1.5px solid ${hasError ? '#ef4444' : focused === field ? '#3b5bdb' : '#dde1e7'}`,
    borderRadius: '8px',
    outline: 'none',
    boxShadow: hasError
      ? '0 0 0 3px rgba(239,68,68,0.08)'
      : focused === field ? '0 0 0 3px rgba(59,91,219,0.08)' : 'none',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    fontFamily: 'inherit',
  });



  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }

        .rp-root {
          min-height: 100vh;
          display: flex;
          background: #f7f8fc;
        }

        /* Left brand panel */
        .rp-brand {
          flex: 0 0 38%;
          background: #ffffff;
          border-right: 1px solid #e8ebf0;
          padding: 56px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .rp-logo-text {
          font-size: 1.45rem;
          font-weight: 700;
          color: #1a1a2e;
          letter-spacing: -0.5px;
        }
        .rp-logo-text span { color: #3b5bdb; }
        .rp-logo-sub {
          font-size: 0.7rem;
          color: #9da3ae;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          font-weight: 500;
          margin-top: 2px;
        }

        .rp-brand-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 0 32px;
        }

        .rp-steps-label {
          font-size: 0.68rem;
          font-weight: 600;
          color: #c4c9d4;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .rp-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .rp-step {
          display: flex;
          gap: 16px;
          position: relative;
        }
        .rp-step:not(:last-child) {
          padding-bottom: 24px;
        }
        .rp-step-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .rp-step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1.5px solid #dde1e7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.68rem;
          font-weight: 700;
          color: #9da3ae;
          background: #fff;
          flex-shrink: 0;
          z-index: 1;
        }
        .rp-step-line {
          flex: 1;
          width: 1px;
          background: #e8ebf0;
          margin-top: 4px;
        }
        .rp-step-body {
          padding-top: 3px;
          padding-bottom: 2px;
        }
        .rp-step-body h4 {
          font-size: 0.82rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 2px;
        }
        .rp-step-body p {
          font-size: 0.76rem;
          color: #9da3ae;
          line-height: 1.5;
        }

        .rp-brand-footer {
          font-size: 0.72rem;
          color: #c4c9d4;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rp-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }

        /* Right form panel */
        .rp-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #f7f8fc;
          overflow-y: auto;
        }
        .rp-form-card {
          width: 100%;
          max-width: 440px;
          padding: 8px 0;
        }
        .rp-form-header {
          margin-bottom: 28px;
        }
        .rp-form-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 5px;
          letter-spacing: -0.2px;
        }
        .rp-form-sub {
          font-size: 0.84rem;
          color: #9da3ae;
        }

        .rp-row { display: flex; gap: 14px; }
        .rp-row .rp-field { flex: 1; }

        .rp-field { margin-bottom: 16px; }
        .rp-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
          letter-spacing: 0.1px;
        }
        .rp-optional {
          color: #c4c9d4;
          font-weight: 400;
          font-size: 0.72rem;
          margin-left: 3px;
        }
        .rp-pass-wrap { position: relative; }
        .rp-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #c4c9d4;
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color 0.15s;
        }
        .rp-eye-btn:hover { color: #3b5bdb; }

        .rp-error {
          font-size: 0.74rem;
          color: #ef4444;
          margin-top: 5px;
          font-weight: 500;
        }



        .rp-submit {
          width: 100%;
          padding: 12px;
          background: #3b5bdb;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.1px;
          margin-top: 6px;
          transition: background 0.18s, opacity 0.18s;
          font-family: inherit;
        }
        .rp-submit:hover:not(:disabled) { background: #3451c7; }
        .rp-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .rp-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 18px;
        }
        .rp-div-line { flex: 1; height: 1px; background: #e8ebf0; }
        .rp-div-text { font-size: 0.74rem; color: #c4c9d4; white-space: nowrap; font-weight: 500; }

        .rp-signin-btn {
          display: block;
          width: 100%;
          padding: 11px;
          border: 1.5px solid #dde1e7;
          border-radius: 8px;
          background: #fff;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          transition: border-color 0.18s, color 0.18s;
          font-family: inherit;
        }
        .rp-signin-btn:hover {
          border-color: #3b5bdb;
          color: #3b5bdb;
        }

        .rp-legal {
          font-size: 0.71rem;
          color: #c4c9d4;
          line-height: 1.7;
          margin-top: 18px;
          text-align: center;
        }
        .rp-legal a {
          color: #9da3ae;
          text-decoration: none;
        }
        .rp-legal a:hover { text-decoration: underline; }

        @media (max-width: 760px) {
          .rp-brand { display: none; }
          .rp-form-side { padding: 32px 20px; background: #fff; }
          .rp-row { flex-direction: column; gap: 0; }
        }
      `}</style>

      <div className="rp-root">

        {/* Left brand panel */}
        <div className="rp-brand">
          <div>
            <div className="rp-logo-text">Hold<span>Kart</span></div>
            <div className="rp-logo-sub">Commerce Platform</div>
          </div>

          <div className="rp-brand-body">
            <p className="rp-steps-label">How it works</p>
            <div className="rp-steps">
              {[
                { title: 'Create your account', desc: 'Quick sign-up, takes under a minute.' },
                { title: 'Join a hold campaign', desc: 'Browse deals and add your hold with a deposit.' },
                { title: 'Target met — price locks', desc: 'Once enough buyers join, the deal activates.' },
                { title: 'Complete checkout', desc: 'Pay the balance and get your order shipped.' },
              ].map((s, i, arr) => (
                <div className="rp-step" key={i}>
                  <div className="rp-step-left">
                    <div className="rp-step-num">{i + 1}</div>
                    {i < arr.length - 1 && <div className="rp-step-line" />}
                  </div>
                  <div className="rp-step-body">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-brand-footer">
            <span className="rp-live-dot" />
            Platform is live and operational
          </div>
        </div>

        {/* Right form panel */}
        <div className="rp-form-side">
          <div className="rp-form-card">
            <div className="rp-form-header">
              <h1 className="rp-form-title">Create your account</h1>
              <p className="rp-form-sub">Join HoldKart and start saving with group deals</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="rp-row">
                <div className="rp-field">
                  <label className="rp-label">Full Name</label>
                  <input
                    type="text" required placeholder="First and last name"
                    value={form.name} onChange={set('name')}
                    style={inp('name')}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                  />
                </div>
                <div className="rp-field">
                  <label className="rp-label">Mobile <span className="rp-optional">(optional)</span></label>
                  <input
                    type="tel" placeholder="+91 XXXXXXXXXX"
                    value={form.mobile} onChange={set('mobile')}
                    style={inp('mobile')}
                    onFocus={() => setFocused('mobile')} onBlur={() => setFocused(null)}
                  />
                </div>
              </div>

              <div className="rp-field">
                <label className="rp-label">Email Address</label>
                <input
                  type="email" required placeholder="you@example.com"
                  value={form.email} onChange={set('email')}
                  style={inp('email')}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                />
              </div>

              <div className="rp-field">
                <label className="rp-label">Password</label>
                <div className="rp-pass-wrap">
                  <input
                    type={showPwd ? 'text' : 'password'} required placeholder="At least 6 characters"
                    value={form.password} onChange={set('password')}
                    style={{ ...inp('password'), paddingRight: 42 }}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  />
                  <button type="button" className="rp-eye-btn" onClick={() => setShowPwd(s => !s)}>
                    {showPwd ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
                {/* <p style={{ fontSize: '0.74rem', color: '#9da3ae', marginTop: 6 }}>Must be at least 6 characters.</p> */}
              </div>

              <div className="rp-field">
                <label className="rp-label">Confirm Password</label>
                <input
                  type={showPwd ? 'text' : 'password'} required placeholder="Repeat your password"
                  value={form.confirm} onChange={set('confirm')}
                  style={inp('confirm', passwordMismatch)}
                  onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                />
                {passwordMismatch && <p className="rp-error">Passwords don't match</p>}
              </div>

              <button type="submit" className="rp-submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <div className="rp-divider">
              <div className="rp-div-line" />
              <span className="rp-div-text">Already a customer?</span>
              <div className="rp-div-line" />
            </div>
            <Link to="/login" className="rp-signin-btn">Sign in to your account</Link>
            <p className="rp-legal">
              By creating an account you agree to our{' '}
              <Link to="/terms">Terms of Use</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}