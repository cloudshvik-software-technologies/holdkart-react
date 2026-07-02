import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/index.js';
import { mergeGuestCart } from '../services/cart.service.js';
import { getGuestCart, clearGuestCart } from '../utils/guestCart.js';
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

export default function Login() {
  const { loginCustomer } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [focused, setFocused] = useState(null);

  const justRegistered = searchParams.get('registered') === '1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login(form);
      loginCustomer(data);

      if (data.customer?.deactivated) {
        toast('Your account is currently deactivated.', { icon: '🔒' });
        navigate('/deactivated');
        return;
      }

      // --- Guest cart merge ---
      // Read any items added before login, send them to the server, then clear
      // local storage so they don't get merged again on the next login.
      const guestItems = getGuestCart();
      if (guestItems.length > 0) {
        try {
          await mergeGuestCart(
            guestItems.map(({ productId, quantity, variantId }) => ({ productId, quantity, variantId }))
          );
        } catch {
          // Merge failure is non-fatal — the user's existing server cart is safe.
        }
        clearGuestCart();
      }
      // --- End guest cart merge ---

      toast.success('Welcome back, ' + data.customer.name + '!');
      navigate('/home');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inp = (field) => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 14px',
    fontSize: '0.9rem',
    color: '#1a1a2e',
    background: '#fff',
    border: `1.5px solid ${focused === field ? '#3b5bdb' : '#dde1e7'}`,
    borderRadius: '8px',
    outline: 'none',
    boxShadow: focused === field ? '0 0 0 3px rgba(59,91,219,0.08)' : 'none',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    fontFamily: 'inherit',
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }

        .lp-root {
          min-height: 100vh;
          display: flex;
          background: #f7f8fc;
        }

        /* Left brand panel */
        .lp-brand {
          flex: 0 0 42%;
          background: #ffffff;
          border-right: 1px solid #e8ebf0;
          padding: 56px 52px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .lp-logo-mark {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 2px;
        }
        .lp-logo-text {
          font-size: 1.45rem;
          font-weight: 700;
          color: #1a1a2e;
          letter-spacing: -0.5px;
        }
        .lp-logo-text span {
          color: #3b5bdb;
        }
        .lp-logo-sub {
          font-size: 0.7rem;
          color: #9da3ae;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          font-weight: 500;
          margin-top: 2px;
        }

        .lp-brand-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 0 32px;
        }

        .lp-tagline {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a2e;
          line-height: 1.3;
          letter-spacing: -0.4px;
          margin-bottom: 16px;
        }
        .lp-tagline span {
          color: #3b5bdb;
        }
        .lp-desc {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.75;
          max-width: 300px;
        }

        .lp-features {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .lp-feature {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding-left: 12px;
          border-left: 2px solid #e8ebf0;
        }
        .lp-feature-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: #374151;
        }
        .lp-feature-desc {
          font-size: 0.77rem;
          color: #9da3ae;
          line-height: 1.5;
        }

        .lp-brand-footer {
          font-size: 0.72rem;
          color: #c4c9d4;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lp-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }

        /* Right form panel */
        .lp-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #f7f8fc;
        }
        .lp-form-card {
          width: 100%;
          max-width: 400px;
        }
        .lp-form-header {
          margin-bottom: 32px;
        }
        .lp-form-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 5px;
          letter-spacing: -0.2px;
        }
        .lp-form-sub {
          font-size: 0.84rem;
          color: #9da3ae;
        }

        .lp-success-banner {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 11px 14px;
          margin-bottom: 24px;
          font-size: 0.82rem;
          color: #15803d;
          font-weight: 500;
        }

        .lp-field {
          margin-bottom: 18px;
        }
        .lp-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
          letter-spacing: 0.1px;
        }
        .lp-pass-wrap {
          position: relative;
        }
        .lp-eye-btn {
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
        .lp-eye-btn:hover { color: #3b5bdb; }

        .lp-forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .lp-forgot {
          font-size: 0.78rem;
          color: #3b5bdb;
          text-decoration: none;
          font-weight: 500;
        }
        .lp-forgot:hover { text-decoration: underline; }

        .lp-submit {
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
        .lp-submit:hover:not(:disabled) { background: #3451c7; }
        .lp-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .lp-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 20px;
        }
        .lp-div-line { flex: 1; height: 1px; background: #e8ebf0; }
        .lp-div-text { font-size: 0.74rem; color: #c4c9d4; white-space: nowrap; font-weight: 500; }

        .lp-register-btn {
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
        .lp-register-btn:hover {
          border-color: #3b5bdb;
          color: #3b5bdb;
        }

        .lp-legal {
          font-size: 0.71rem;
          color: #c4c9d4;
          line-height: 1.7;
          margin-top: 20px;
          text-align: center;
        }
        .lp-legal a {
          color: #9da3ae;
          text-decoration: none;
        }
        .lp-legal a:hover { text-decoration: underline; }

        @media (max-width: 720px) {
          .lp-brand { display: none; }
          .lp-form-side { padding: 32px 20px; background: #fff; }
        }
      `}</style>

      <div className="lp-root">

        {/* Left brand panel */}
        <div className="lp-brand">
          <div>
            <div className="lp-logo-mark">
              <div className="lp-logo-text">Hold<span>Kart</span></div>
            </div>
            <div className="lp-logo-sub">Commerce Platform</div>
          </div>

          <div className="lp-brand-body">
            <h2 className="lp-tagline">Group buying that<br /><span>lowers the price</span></h2>
            <p className="lp-desc">
              Join hold campaigns, pool your buying power with others, and pay only when the group target is met.
            </p>
            <div className="lp-features">
              <div className="lp-feature">
                <div className="lp-feature-title">Hold Campaigns</div>
                <div className="lp-feature-desc">Prices drop as more buyers join the same deal.</div>
              </div>
              <div className="lp-feature">
                <div className="lp-feature-title">Secure Deposits</div>
                <div className="lp-feature-desc">Your funds are held safely until the target is reached.</div>
              </div>
              <div className="lp-feature">
                <div className="lp-feature-title">Live Tracking</div>
                <div className="lp-feature-desc">Real-time order status from purchase to delivery.</div>
              </div>
            </div>
          </div>

          <div className="lp-brand-footer">
            <span className="lp-live-dot" />
            Platform is live and operational
          </div>
        </div>

        {/* Right form panel */}
        <div className="lp-form-side">
          <div className="lp-form-card">
            <div className="lp-form-header">
              <h1 className="lp-form-title">Sign in to your account</h1>
              <p className="lp-form-sub">Enter your credentials to continue</p>
            </div>

            {justRegistered && (
              <div className="lp-success-banner">
                Account created — please sign in to continue.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="lp-field">
                <label className="lp-label">Email or Mobile</label>
                <input
                  type="text"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  style={inp('email')}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <div className="lp-field">
                <label className="lp-label">Password</label>
                <div className="lp-pass-wrap">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    style={{ ...inp('password'), paddingRight: 42 }}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                  />
                  <button type="button" className="lp-eye-btn" onClick={() => setShowPwd(p => !p)}>
                    {showPwd ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
                <div className="lp-forgot-row">
                  <Link to="/forgot" className="lp-forgot">Forgot password?</Link>
                </div>
              </div>
              <button type="submit" className="lp-submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="lp-divider">
              <div className="lp-div-line" />
              <span className="lp-div-text">New to HoldKart?</span>
              <div className="lp-div-line" />
            </div>
            <Link to="/register" className="lp-register-btn">Create your account</Link>
            <p className="lp-legal">
              By signing in you agree to our{' '}
              <Link to="/terms">Terms of Use</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}