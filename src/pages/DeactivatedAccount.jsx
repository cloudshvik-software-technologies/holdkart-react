import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { profileService } from '../services/index.js';
import toast from 'react-hot-toast';

const PINK = '#2a5298';
const REACTIVATION_WINDOW_DAYS = 30;

// Standalone, full-screen page — intentionally has no Header/Footer and no
// links anywhere else in the app. A deactivated customer can only see this
// screen until they either reactivate or log out.
export default function DeactivatedAccount() {
  const { customer, updateCustomer, logout } = useAuth();
  const navigate = useNavigate();
  const [activating, setActivating] = useState(false);

  const daysRemaining = useMemo(() => {
    if (!customer?.deactivatedAt) return REACTIVATION_WINDOW_DAYS;
    const elapsedDays = (Date.now() - new Date(customer.deactivatedAt).getTime()) / 86400000;
    return Math.max(0, Math.ceil(REACTIVATION_WINDOW_DAYS - elapsedDays));
  }, [customer?.deactivatedAt]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await profileService.reactivateAccount();
      updateCustomer({ deactivated: false, deactivatedAt: null });
      toast.success('Your account has been reactivated. Welcome back!');
      navigate('/home');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reactivate account');
    } finally {
      setActivating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f4f4f5', fontFamily: "'Assistant', 'Segoe UI', sans-serif", padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: '44px 40px', maxWidth: 460, width: '100%',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)', textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: '#fff8e1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '1.8rem',
        }}>
          🔒
        </div>

        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#282c3f', marginBottom: 10 }}>
          Your account is deactivated
        </h1>
        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 22 }}>
          You won't be able to use HoldKart until you reactivate. Your data is safe and nothing has been deleted yet.
        </p>

        <div style={{
          background: '#f4f4f5', borderRadius: 8, padding: '14px 18px', marginBottom: 26,
        }}>
          <div style={{ fontSize: '0.72rem', color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Time remaining to reactivate
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: daysRemaining <= 5 ? '#d92d20' : PINK }}>
            {daysRemaining} day{daysRemaining === 1 ? '' : 's'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>
            After this, your account will be permanently deleted.
          </div>
        </div>

        <button
          type="button"
          onClick={handleActivate}
          disabled={activating}
          style={{
            width: '100%', background: PINK, color: '#fff', border: 'none',
            borderRadius: 6, padding: '13px', fontSize: '0.95rem', fontWeight: 700,
            cursor: activating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            opacity: activating ? 0.7 : 1, marginBottom: 12,
          }}
        >
          {activating ? 'Activating…' : 'Activate My Account'}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%', background: 'none', color: '#888', border: 'none',
            fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            padding: '6px',
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}