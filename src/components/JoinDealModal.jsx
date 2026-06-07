import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { campaignService, paymentService } from '../services/index.js';
import toast from 'react-hot-toast';

// Singleton promise — only ever appends one <script> tag.
// Starts loading immediately when this module is first imported,
// so by the time the user opens the modal and clicks Pay the SDK is ready.
let _cfScriptPromise = null;
function loadCashfreeScript() {
  if (window.Cashfree) return Promise.resolve(true);
  if (_cfScriptPromise) return _cfScriptPromise;
  _cfScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return _cfScriptPromise;
}
// Preload immediately on import (fire-and-forget)
loadCashfreeScript();

export default function JoinDealModal({ product, bestGroupPrice, maxDiscountPct, remainingSlots, onClose, onJoinSuccess, campaignAction }) {
  const [qty, setQty]       = useState(1);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const depositPerUnit = Math.max(0, product.retailPrice - bestGroupPrice);
  const totalDeposit   = depositPerUnit * qty;
  const maxQty         = Math.max(1, remainingSlots);

  const doJoin = async () => {
    if (campaignAction) {
      await campaignAction(qty);
    } else {
      await campaignService.startOrJoinCampaign({ productId: product.productId, quantity: qty });
    }
    onJoinSuccess(qty);
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      // Run SDK load and order creation in parallel — both were already kicked off,
      // so this typically resolves with zero or near-zero wait.
      let orderData, loaded;
      try {
        [orderData, loaded] = await Promise.all([
          paymentService.createCashfreeOrder({
            amount: totalDeposit,
            currency: 'INR',
            receipt: `deal_${product.productId}_${Date.now()}`,
          }),
          loadCashfreeScript(),
        ]);
      } catch {
        // If payment backend is unavailable, fall through to free join
        await doJoin();
        return;
      }

      if (!orderData || !orderData.paymentSessionId) {
        await doJoin();
        return;
      }

      if (!loaded) {
        toast.error('Cashfree SDK failed to load. Please try again.');
        setPaying(false);
        return;
      }

      // Open Cashfree checkout modal (sandbox mode)
      const cashfree = window.Cashfree({ mode: 'sandbox' });
      cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: '_modal',
      }).then(async (result) => {
        if (result.error) {
          if (result.error.message !== 'User closed the checkout') {
            toast.error(result.error.message || 'Payment failed');
          }
          setPaying(false);
          return;
        }
        // Payment attempted — verify then join
        try {
          await paymentService.verifyPayment({ orderId: orderData.orderId });
          await doJoin();
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Payment verification failed');
          setPaying(false);
        }
      }).catch((err) => {
        toast.error(err?.message || 'Payment failed');
        setPaying(false);
      });

    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to join the deal');
      setPaying(false);
    }
  };

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, padding: '26px 24px',
          width: '100%', maxWidth: 400,
          boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
          fontFamily: "'Segoe UI', Arial, sans-serif",
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1.3rem' }}>🤝</span>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f1111', margin: 0 }}>Join Group Deal</h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0 }}>{product.name}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: '1.5rem',
              color: '#9ca3af', cursor: 'pointer', lineHeight: 1,
              padding: '0 0 0 12px', flexShrink: 0,
            }}
          >×</button>
        </div>

        <div style={{ background: '#f0f4ff', border: '1px solid #bfcfec', borderRadius: 8, padding: '11px 14px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Regular price</span>
            <span style={{ fontSize: '0.84rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{product.retailPrice.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Best group price</span>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#15803d' }}>₹{bestGroupPrice.toLocaleString('en-IN')} ({maxDiscountPct}% off)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Your saving / unit</span>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#dc2626' }}>₹{depositPerUnit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>
            How many units do you want to buy?
          </p>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              style={{ width: 38, height: 38, background: '#f9fafb', border: 'none', fontSize: '1.2rem', fontWeight: 700, color: qty <= 1 ? '#d1d5db' : '#374151', cursor: qty <= 1 ? 'default' : 'pointer' }}
            >−</button>
            <span style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: '1rem', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', lineHeight: '38px' }}>{qty}</span>
            <button
              onClick={() => setQty(q => Math.min(maxQty, q + 1))}
              style={{ width: 38, height: 38, background: '#f9fafb', border: 'none', fontSize: '1.2rem', fontWeight: 700, color: qty >= maxQty ? '#d1d5db' : '#374151', cursor: qty >= maxQty ? 'default' : 'pointer' }}
            >+</button>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 5 }}>
            {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining in this deal
          </p>
        </div>

        {depositPerUnit > 0 && (
          <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '11px 14px', marginBottom: 18 }}>
            <p style={{ fontSize: '0.78rem', color: '#92400e', marginBottom: 6 }}>
              💡 Pay a deposit equal to your savings to secure this deal.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.84rem', color: '#374151' }}>
                ₹{depositPerUnit.toLocaleString('en-IN')} × {qty} unit{qty > 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3c72' }}>
                ₹{totalDeposit.toLocaleString('en-IN')}
              </span>
            </div>
            <p style={{ fontSize: '0.68rem', color: '#92400e', margin: 0 }}>
              Refundable if the deal target is not met.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={paying}
            style={{
              flex: 1, padding: '10px 0', background: '#fff',
              border: '1px solid #d1d5db', borderRadius: 8,
              fontWeight: 600, fontSize: '0.86rem', color: '#374151',
              cursor: paying ? 'default' : 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={handlePay}
            disabled={paying}
            style={{
              flex: 2, padding: '10px 0',
              background: paying ? '#e5e7eb' : 'linear-gradient(135deg, #2a5298, #1e3c72)',
              border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: '0.88rem',
              color: paying ? '#9ca3af' : '#fff',
              cursor: paying ? 'not-allowed' : 'pointer',
            }}
          >
            {paying ? 'Processing…' : depositPerUnit > 0 ? `Pay ₹${totalDeposit.toLocaleString('en-IN')} & Join` : 'Join Deal'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}