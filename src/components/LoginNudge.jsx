import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DELAY_FIRST  = 6000;
const DELAY_REPEAT = 50000;
const DISMISS_WAIT = 35000;

const MESSAGES = [
  { label: 'PERSONALISED FOR YOU',  text: 'Sign in to see deals matched to your interests and track your orders.' },
  { label: 'EXCLUSIVE MEMBER PRICES', text: 'Hold Deal group-buy discounts are available to signed-in members only.' },
  { label: 'SAVE TO WISHLIST',       text: 'Sign in to save products and get notified when prices drop.' },
  { label: 'FASTER CHECKOUT',        text: 'Sign in to use saved addresses and pay in fewer steps.' },
];

export default function LoginNudge() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [show, setShow]       = useState(false);
  const [visible, setVisible] = useState(false); // controls CSS slide
  const [msgIdx, setMsgIdx]   = useState(0);
  const cycleRef  = useRef(0);
  const timerRef  = useRef(null);
  const pauseRef  = useRef(null);

  const appear = () => {
    setMsgIdx(cycleRef.current % MESSAGES.length);
    cycleRef.current += 1;
    setShow(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  };

  const disappear = (thenWait) => {
    setVisible(false);
    setTimeout(() => setShow(false), 350); // wait for slide-up animation
    clearTimeout(pauseRef.current);
    if (thenWait < 999999) {
      pauseRef.current = setTimeout(() => {
        timerRef.current = setTimeout(appear, DELAY_REPEAT);
      }, thenWait);
    }
  };

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    timerRef.current = setTimeout(appear, DELAY_FIRST);
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(pauseRef.current);
    };
  }, [isLoading, isAuthenticated]);

  if (isLoading || isAuthenticated || !show) return null;

  const msg = MESSAGES[msgIdx];

  return (
    <div style={{
      position: 'fixed',
      top: 100, // sits just below header (62px) + nav (38px)
      left: 0,
      right: 0,
      zIndex: 990,
      transform: visible ? 'translateY(0)' : 'translateY(-110%)',
      transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{
        margin: '0 auto',
        maxWidth: 860,
        background: '#fff',
        borderRadius: '0 0 12px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
        overflow: 'hidden',
      }}>
        {/* top accent line */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #FF6B00 0%, #2a5298 100%)' }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 20px',
        }}>
          {/* Left: label + message */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.1em', color: '#FF6B00',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'block', marginBottom: 2,
            }}>
              {msg.label}
            </span>
            <span style={{
              fontSize: '0.83rem', fontWeight: 500,
              color: '#374151', lineHeight: 1.4,
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'block',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {msg.text}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 32, background: '#E5E7EB', flexShrink: 0 }} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
            <button
              onClick={() => disappear(DISMISS_WAIT)}
              style={{
                background: 'none', border: 'none',
                fontSize: '0.78rem', fontWeight: 600,
                color: '#9ca3af', cursor: 'pointer', padding: '6px 10px',
                borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#374151'}
              onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
              Not now
            </button>

            <button
              onClick={() => { disappear(999999); navigate('/register'); }}
              style={{
                background: '#fff', border: '1.5px solid #2a5298',
                color: '#2a5298', padding: '7px 16px', borderRadius: 7,
                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Register
            </button>

            <button
              onClick={() => { disappear(999999); navigate('/login'); }}
              style={{
                background: '#FF6B00', border: 'none',
                color: '#fff', padding: '7px 18px', borderRadius: 7,
                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E85D04'}
              onMouseLeave={e => e.currentTarget.style.background = '#FF6B00'}
            >
              Sign in
            </button>
          </div>

          {/* Close */}
          <button
            onClick={() => disappear(DISMISS_WAIT)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#d1d5db', fontSize: '1rem', padding: '4px',
              lineHeight: 1, borderRadius: 4, flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#6b7280'}
            onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>
      </div>
    </div>
  );
}