import { useState, useEffect } from 'react';
import { profileService } from '../services/index.js';

/* ─────────────────────────────────────────────────────────────────────────────
   DeactivateAccountModal  (Customer portal)
   Props:
     open      : boolean   — controls visibility
     onClose   : () => void — called when user cancels at any step
     onSuccess : () => void — called after deactivation is confirmed & logout
───────────────────────────────────────────────────────────────────────────── */
export default function DeactivateAccountModal({ open, onClose, onSuccess }) {
  const [step, setStep]           = useState(1); // 1=warning, 2=account info, 3=confirm
  const [info, setInfo]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [reason, setReason]       = useState('');
  const [password, setPassword]   = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setInfo(null);
      setError('');
      setReason('');
      setPassword('');
      setConfirmed(false);
      fetchInfo();
    }
  }, [open]);

  const fetchInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await profileService.getDeactivationInfo();
      setInfo(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load account info. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmed || !password) return;
    setSubmitting(true);
    setError('');
    try {
      await profileService.deactivateAccount(password, reason);
      setStep(4); // success step
      setTimeout(() => {
        onSuccess?.();
      }, 4000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to deactivate account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // ── Styles ───────────────────────────────────────────────────────────────
  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: 16,
  };
  const modal = {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
  };
  const header = (bg) => ({
    background: bg, padding: '20px 24px',
    display: 'flex', alignItems: 'center', gap: 12,
  });
  const body   = { padding: '24px 24px 8px' };
  const footer = { padding: '16px 24px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' };

  const btnDanger = (disabled) => ({
    background: disabled ? '#fca5a5' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
    color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 8,
    fontWeight: 700, fontSize: '0.9rem', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s',
  });
  const btnGhost = {
    background: '#f3f4f6', color: '#374151', border: 'none',
    padding: '11px 24px', borderRadius: 8, fontWeight: 600,
    fontSize: '0.9rem', cursor: 'pointer',
  };
  const infoBox = (bg, border) => ({
    background: bg, border: `1.5px solid ${border}`,
    borderRadius: 10, padding: '14px 16px', marginBottom: 14,
  });
  const row   = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 };
  const label = { color: '#6b7280', fontSize: '0.82rem' };
  const value = { fontWeight: 600, fontSize: '0.9rem' };

  // ── Step progress indicator ──────────────────────────────────────────────
  const Progress = () => (
    <div style={{ display: 'flex', gap: 6, padding: '14px 24px 0', alignItems: 'center' }}>
      {[1, 2, 3].map((s) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', fontSize: '0.78rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: step > s ? '#16a34a' : step === s ? '#dc2626' : '#e5e7eb',
            color: step >= s ? '#fff' : '#6b7280',
          }}>
            {step > s ? '✓' : s}
          </div>
          {s < 3 && <div style={{ flex: 1, height: 2, width: 40, background: step > s ? '#16a34a' : '#e5e7eb' }} />}
        </div>
      ))}
      <span style={{ marginLeft: 8, fontSize: '0.78rem', color: '#6b7280' }}>
        {step === 1 ? 'Warning' : step === 2 ? 'Account Info' : step === 3 ? 'Confirm' : 'Done'}
      </span>
    </div>
  );

  // ── STEP 1: Warning ──────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={header('linear-gradient(135deg,#dc2626,#b91c1c)')}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>Deactivate Account</div>
            <div style={{ color: '#fecaca', fontSize: '0.8rem' }}>This starts a 30-day recovery window</div>
          </div>
        </div>
        <Progress />

        <div style={body}>
          <p style={{ color: '#374151', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 16 }}>
            Before you proceed, please read the following carefully:
          </p>

          <div style={infoBox('#fef2f2', '#fca5a5')}>
            {[
              ['🔒', 'Your profile, orders, and wishlist will be hidden — not deleted.'],
              ['🔁', 'You can log back in within 30 days and reactivate your account.'],
              ['📦', 'Any pending orders will continue, but you won\'t receive updates while deactivated.'],
              ['🛒', 'Your active group deals will keep running without your participation.'],
              ['❌', 'After 30 days, your account and personal data will be permanently deleted.'],
              ['🚫', 'Your account ID will be retired and cannot be transferred or reused.'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <span style={{ color: '#7f1d1d', fontSize: '0.85rem', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 12 }}>
              {error}
            </div>
          )}
        </div>

        <div style={footer}>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button
            style={btnDanger(loading)}
            disabled={loading}
            onClick={() => setStep(2)}
          >
            {loading ? 'Loading…' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP 2: Account Info (pending orders / active deals) ─────────────────
  if (step === 2) return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header('linear-gradient(135deg,#92400e,#b45309)')}>
          <span style={{ fontSize: 28 }}>📋</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>Account Activity</div>
            <div style={{ color: '#fde68a', fontSize: '0.8rem' }}>Review what's currently active on your account</div>
          </div>
        </div>
        <Progress />

        <div style={body}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              <div>Loading account information…</div>
            </div>
          ) : info ? (
            <>
              {/* Pending Orders */}
              <div style={infoBox('#fffbeb', '#fbbf24')}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: 12 }}>
                  📦 Pending Orders
                </div>
                <div style={row}>
                  <span style={label}>Orders in Progress</span>
                  <span style={{ ...value, color: info.pendingOrders > 0 ? '#d97706' : '#16a34a', fontSize: '1rem' }}>
                    {info.pendingOrders}
                  </span>
                </div>
                {info.pendingOrders > 0 ? (
                  <div style={{ color: '#92400e', fontSize: '0.8rem', marginTop: 6, lineHeight: 1.5 }}>
                    ⚠️ You have {info.pendingOrders} order{info.pendingOrders > 1 ? 's' : ''} still in progress. These will continue, but you won't receive status updates while deactivated.
                  </div>
                ) : (
                  <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: 6, fontStyle: 'italic' }}>
                    ✅ No pending orders. Safe to proceed.
                  </div>
                )}
              </div>

              {/* Active Group Deals */}
              <div style={infoBox('#f0fdf4', '#86efac')}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', marginBottom: 12 }}>
                  🤝 Active Group Deals
                </div>
                <div style={row}>
                  <span style={label}>Deals You've Joined</span>
                  <span style={{ ...value, color: info.activeDeals > 0 ? '#d97706' : '#16a34a', fontSize: '1rem' }}>
                    {info.activeDeals}
                  </span>
                </div>
                {info.activeDeals > 0 ? (
                  <div style={{ color: '#166534', fontSize: '0.8rem', marginTop: 6, lineHeight: 1.5 }}>
                    ⚠️ You have {info.activeDeals} active group deal{info.activeDeals > 1 ? 's' : ''} in progress. They will continue running without you receiving notifications.
                  </div>
                ) : (
                  <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: 6, fontStyle: 'italic' }}>
                    ✅ No active group deals. Safe to proceed.
                  </div>
                )}
              </div>

              <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#475569' }}>
                ℹ️ Your data is kept safe for <strong>30 days</strong>. Log back in anytime within that window to recover your account.
              </div>
            </>
          ) : (
            <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error || 'Could not load account info.'}</div>
          )}
        </div>

        <div style={footer}>
          <button style={btnGhost} onClick={() => setStep(1)}>← Back</button>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button
            style={btnDanger(!info)}
            disabled={!info}
            onClick={() => setStep(3)}
          >
            Proceed →
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP 3: Final Confirmation ────────────────────────────────────────────
  if (step === 3) return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header('linear-gradient(135deg,#1e3a5f,#2a5298)')}>
          <span style={{ fontSize: 28 }}>🔐</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>Final Confirmation</div>
            <div style={{ color: '#bfdbfe', fontSize: '0.8rem' }}>Log back in within 30 days to recover your account</div>
          </div>
        </div>
        <Progress />

        <div style={body}>
          {/* Summary card */}
          <div style={{ ...infoBox('#f8fafc', '#cbd5e1'), marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e3a5f', marginBottom: 10 }}>📋 Deactivation Summary</div>
            <div style={row}>
              <span style={label}>Pending Orders</span>
              <span style={{ ...value, color: info?.pendingOrders > 0 ? '#d97706' : '#16a34a' }}>
                {info?.pendingOrders ?? 0}
              </span>
            </div>
            <div style={row}>
              <span style={label}>Active Group Deals</span>
              <span style={{ ...value, color: info?.activeDeals > 0 ? '#d97706' : '#16a34a' }}>
                {info?.activeDeals ?? 0}
              </span>
            </div>
            <div style={row}>
              <span style={label}>Recovery Window</span>
              <span style={{ ...value, color: '#d97706' }}>30 days from today</span>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', display: 'block', marginBottom: 6 }}>
              Reason for deactivation <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Let us know why you're leaving…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%', borderRadius: 8, border: '1.5px solid #d1d5db',
                padding: '10px 12px', fontSize: '0.88rem', resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>

          {/* Password confirm */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', display: 'block', marginBottom: 6 }}>
              Confirm with your password <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', borderRadius: 8, border: '1.5px solid #d1d5db',
                padding: '10px 12px', fontSize: '0.88rem',
                fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>

          {/* Confirm checkbox */}
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: 3, accentColor: '#dc2626', width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
              I understand that my account will be <strong>deactivated</strong> and I have <strong>30 days</strong> to log back in and recover it before my data is permanently deleted.
            </span>
          </label>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8 }}>
              {error}
            </div>
          )}
        </div>

        <div style={footer}>
          <button style={btnGhost} onClick={() => setStep(2)}>← Back</button>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button
            style={btnDanger(!confirmed || !password || submitting)}
            disabled={!confirmed || !password || submitting}
            onClick={handleDeactivate}
          >
            {submitting ? 'Processing…' : '🔒 Deactivate Account'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP 4: Success ───────────────────────────────────────────────────────
  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ ...header('linear-gradient(135deg,#16a34a,#15803d)'), justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 48 }}>✅</span>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', textAlign: 'center' }}>
            Deactivation Initiated
          </div>
        </div>

        <div style={{ ...body, textAlign: 'center', paddingBottom: 24 }}>
          <p style={{ color: '#374151', fontSize: '0.92rem', lineHeight: 1.7, marginTop: 8 }}>
            Your account has been successfully deactivated.<br />
            You have <strong>30 days</strong> to log back in and recover it.<br />
            After that, your data will be <strong>permanently deleted</strong>.
          </p>
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: '0.85rem', color: '#166534' }}>
            You will be logged out automatically in a few seconds…
          </div>
        </div>
      </div>
    </div>
  );
}