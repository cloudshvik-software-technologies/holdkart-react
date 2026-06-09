import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cartService, orderService, paymentService, profileService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

/* ── Indian geography data ─────────────────────────────────── */
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];
const CITIES_BY_STATE = {
  'Andhra Pradesh': ['Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Tirupati','Rajahmundry','Kakinada','Kadapa','Anantapur'],
  'Arunachal Pradesh': ['Itanagar','Naharlagun','Pasighat','Tezpur'],
  'Assam': ['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur','Bongaigaon'],
  'Bihar': ['Patna','Gaya','Bhagalpur','Muzaffarpur','Darbhanga','Purnia','Arrah','Bihar Sharif','Begusarai'],
  'Chhattisgarh': ['Raipur','Bhilai','Bilaspur','Korba','Durg','Rajnandgaon'],
  'Goa': ['Panaji','Margao','Vasco da Gama','Mapusa','Ponda'],
  'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Junagadh','Gandhinagar','Anand','Navsari'],
  'Haryana': ['Faridabad','Gurgaon','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal','Sonipat','Panchkula'],
  'Himachal Pradesh': ['Shimla','Mandi','Solan','Dharamshala','Baddi','Palampur','Kullu'],
  'Jharkhand': ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Hazaribagh','Giridih'],
  'Karnataka': ['Bengaluru','Mysuru','Mangaluru','Hubballi','Belagavi','Kalaburagi','Ballari','Davangere','Shivamogga','Tumkur','Udupi'],
  'Kerala': ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad','Alappuzha','Malappuram','Kannur','Kottayam'],
  'Madhya Pradesh': ['Indore','Bhopal','Jabalpur','Gwalior','Ujjain','Sagar','Ratlam','Satna','Dewas','Rewa'],
  'Maharashtra': ['Mumbai','Pune','Nagpur','Thane','Nashik','Aurangabad','Solapur','Kolhapur','Amravati','Navi Mumbai','Vasai-Virar','Pimpri-Chinchwad'],
  'Manipur': ['Imphal','Thoubal','Bishnupur'],
  'Meghalaya': ['Shillong','Tura','Jowai'],
  'Mizoram': ['Aizawl','Lunglei','Champhai'],
  'Nagaland': ['Kohima','Dimapur','Mokokchung'],
  'Odisha': ['Bhubaneswar','Cuttack','Rourkela','Brahmapur','Sambalpur','Puri','Balasore','Bhadrak'],
  'Punjab': ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Pathankot','Hoshiarpur'],
  'Rajasthan': ['Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bharatpur','Alwar','Sikar','Sri Ganganagar'],
  'Sikkim': ['Gangtok','Namchi','Jorethang'],
  'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Tiruppur','Erode','Vellore','Thoothukudi','Dindigul','Thanjavur','Ranipet'],
  'Telangana': ['Hyderabad','Warangal','Nizamabad','Karimnagar','Ramagundam','Khammam','Secunderabad'],
  'Tripura': ['Agartala','Udaipur','Dharmanagar'],
  'Uttar Pradesh': ['Lucknow','Kanpur','Ghaziabad','Agra','Varanasi','Meerut','Prayagraj','Bareilly','Aligarh','Moradabad','Noida','Gorakhpur','Firozabad','Mathura'],
  'Uttarakhand': ['Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Kashipur','Rishikesh'],
  'West Bengal': ['Kolkata','Asansol','Siliguri','Durgapur','Bardhaman','Malda','Baharampur','Habra','Kharagpur','Shantipur'],
  'Andaman and Nicobar Islands': ['Port Blair'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman','Diu','Silvassa'],
  'Delhi': ['New Delhi','Delhi'],
  'Jammu and Kashmir': ['Srinagar','Jammu','Anantnag','Baramulla','Sopore'],
  'Ladakh': ['Leh','Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Puducherry': ['Puducherry','Karaikal','Mahe','Yanam'],
};

/* ── Cashfree SDK preload ── */
let cashfreeScriptPromise = null;
function loadCashfreeScript() {
  if (window.Cashfree) return Promise.resolve(true);
  if (cashfreeScriptPromise) return cashfreeScriptPromise;
  cashfreeScriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return cashfreeScriptPromise;
}
loadCashfreeScript();

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f0f4f8'/%3E%3Ccircle cx='40' cy='30' r='12' fill='%23d1d9e6'/%3E%3Cpath d='M18 65 Q40 45 62 65Z' fill='%23d1d9e6'/%3E%3C/svg%3E";

function resolveImg(url) {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith('http')) return url;
  return url.startsWith('/uploads')
    ? url.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${url.startsWith('/') ? '' : '/'}${url}`;
}

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1px solid #d1d5db', borderRadius: 4,
  fontSize: '0.9rem', color: '#0f1111',
  outline: 'none', background: '#fff',
  boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* ══════════════════════════════
   MAIN PAGE
══════════════════════════════ */
export default function BuyNow() {
  const { isAuthenticated, customer } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const item      = location.state?.buyNowItem ?? null;

  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [placing,      setPlacing]      = useState(false);
  const [addrExpanded, setAddrExpanded] = useState(false);
  const [focused,      setFocused]      = useState('');
  const [showFees,     setShowFees]     = useState(false);
  const [address,      setAddress]      = useState({
    address: '', city: '', state: '', pincode: '', paymentMethod: 'COD',
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!item)            { navigate('/cart');  return; }
    (async () => {
      try {
        const res = await profileService.getProfile();
        if (res) {
          setProfile(res);
          setAddress(prev => ({
            ...prev,
            address: res.address || '',
            city:    res.city    || '',
            state:   res.state   || '',
            pincode: res.pincode || '',
          }));
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [isAuthenticated, item]);

  const set = (field, val) => setAddress(prev => ({ ...prev, [field]: val }));
  const inp = (name) => ({
    ...inputStyle,
    borderColor: focused === name ? '#2a5298' : '#d1d5db',
    boxShadow:   focused === name ? '0 0 0 3px rgba(42,82,152,0.12)' : 'none',
  });
  const onF = (name) => () => setFocused(name);
  const onB = () => setFocused('');

  /* ── pricing ── */
  const price          = item ? (item.effectivePrice ?? item.retailPrice) : 0;
  const mrp            = item ? item.retailPrice : 0;
  const qty            = item ? item.quantity : 1;
  const lineTotal      = price * qty;
  const mrpTotal       = mrp * qty;
  const savings        = mrpTotal - lineTotal;
  const depositPaid    = item?.depositPaid || 0;
  const deliveryCharge = 79;  // same as Cart & Checkout
  const platformFee    = 10;  // same as Cart & Checkout
  const totalFees      = deliveryCharge + platformFee;
  const total          = Math.max(0, lineTotal - depositPaid + totalFees);

  const addrDone = !!(address.address && address.city && address.state && address.pincode);
  const cities   = address.state ? (CITIES_BY_STATE[address.state] || []) : [];

  const removeBuyNowItem = async () => {
    if (item?.cartId) {
      try { await cartService.removeFromCart({ cartId: item.cartId }); } catch { /* best-effort */ }
    }
  };

  const placeCOD = async () => {
    await orderService.placeOrder({
      items: [{ productId: item.productId, quantity: item.quantity }],
      ...address, deliveryCharge, platformFee,
    });
    await removeBuyNowItem();
    toast.success('Order placed successfully!');
    navigate('/orders');
  };

  const placeOnline = async () => {
    const loaded = await loadCashfreeScript();
    if (!loaded) { toast.error('Payment SDK failed to load. Please try COD.'); return; }
    const cfOrder = await paymentService.createCashfreeOrder({
      amount: total, currency: 'INR',
      customerInfo: {
        customerId: customer?.id   ? String(customer.id) : 'cust_' + Date.now(),
        name:       customer?.name  || 'HoldKart Customer',
        email:      customer?.email || 'customer@holdkart.com',
        phone:      profile?.mobile || '9999999999',
      },
    });
    const cashfree = window.Cashfree({ mode: 'sandbox' });
    await new Promise((resolve, reject) => {
      cashfree.checkout({ paymentSessionId: cfOrder.paymentSessionId, redirectTarget: '_modal' })
        .then(async (result) => {
          if (result.error) {
            reject(new Error(result.error.message === 'User closed the checkout' ? 'Payment cancelled' : (result.error.message || 'Payment failed')));
            return;
          }
          try {
            await paymentService.verifyPayment({ orderId: cfOrder.orderId });
            await orderService.placeOrder({
              items: [{ productId: item.productId, quantity: item.quantity }],
              ...address, paymentId: cfOrder.orderId, deliveryCharge, platformFee,
            });
            await removeBuyNowItem();
            toast.success('Payment successful! Order placed.');
            navigate('/orders');
            resolve();
          } catch (err) { reject(err); }
        }).catch(err => reject(new Error(err?.message || 'Payment failed')));
    });
  };

  const handleAddressSave = (e) => {
    e.preventDefault();
    if (!addrDone) { toast.error('Please fill all address fields'); return; }
    if (!/^\d{6}$/.test(address.pincode)) { toast.error('Enter a valid 6-digit pincode'); return; }
    setAddrExpanded(false);
  };

  const handlePlaceOrder = async () => {
    if (!addrDone) { toast.error('Please add a delivery address first'); setAddrExpanded(true); return; }
    if (!/^\d{6}$/.test(address.pincode)) { toast.error('Enter a valid 6-digit pincode'); setAddrExpanded(true); return; }
    setPlacing(true);
    try {
      if (address.paymentMethod === 'Online') { await placeOnline(); }
      else { await placeCOD(); }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Order failed';
      if (msg !== 'Payment cancelled') toast.error(msg);
    } finally { setPlacing(false); }
  };

  /* ── Price Details panel ── */
  const PricePanel = () => (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', position: 'sticky', top: 96 }}>
      <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '14px 18px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f1111', margin: 0 }}>Price Details</h3>
      </div>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#374151', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
          <span>MRP (incl. of all taxes)</span>
          <span>₹{mrpTotal.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#374151', marginBottom: 6 }}>
            <span>Delivery Charge</span>
            <span style={{ fontWeight: 600 }}>₹{deliveryCharge}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#374151', marginBottom: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Platform Fee
              <span
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                onMouseEnter={() => setShowFees(true)}
                onMouseLeave={() => setShowFees(false)}
              >
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#6b7280', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', userSelect: 'none' }}>i</span>
                {showFees && (
                  <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', width: 220, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 999, pointerEvents: 'none' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f1111', marginBottom: 6 }}>Platform Fee</p>
                    <p style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 }}>A non-refundable fee charged to help keep the platform running smoothly and support app improvements.</p>
                    <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, background: '#fff', border: '1px solid #e5e7eb', borderTop: 'none', borderLeft: 'none', rotate: '45deg' }} />
                  </div>
                )}
              </span>
            </span>
            <span style={{ fontWeight: 600 }}>₹{platformFee}</span>
          </div>
        </div>
        {(savings > 0 || depositPaid > 0) && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: '#374151' }}>Discounts</span>
              <span style={{ color: '#007600', fontWeight: 600 }}>−₹{(savings + depositPaid).toLocaleString('en-IN')}</span>
            </div>
            {savings > 0 && (
              <div style={{ paddingLeft: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280' }}>
                <span style={{ borderBottom: '1px dotted #d1d5db' }}>{item.hasGroupDeal ? 'Group Deal Discount' : 'Product Discount'}</span>
                <span style={{ color: '#007600' }}>−₹{savings.toLocaleString('en-IN')}</span>
              </div>
            )}
            {depositPaid > 0 && (
              <div style={{ paddingLeft: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280' }}>
                <span style={{ borderBottom: '1px dotted #d1d5db' }}>Deposit Pre-paid</span>
                <span style={{ color: '#7c3aed' }}>−₹{depositPaid.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: '#0f1111', paddingTop: 10, borderTop: '1px solid #e5e7eb', marginBottom: 8 }}>
          <span>Total Amount</span>
          <span>₹{total.toLocaleString('en-IN')}</span>
        </div>
        {(savings + depositPaid) > 0 && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: '8px 12px', fontSize: '0.8rem', color: '#15803d', fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
            You will save ₹{(savings + depositPaid).toLocaleString('en-IN')} on this order
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderTop: '1px solid #f3f4f6', fontSize: '0.75rem', color: '#6b7280' }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>🛡️</span>
          <span>Safe and secure payments. Easy returns. 100% Authentic products.</span>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ background: '#f4f6fa', minHeight: '100vh', paddingTop: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #eef2ff', borderTopColor: '#2a5298', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f4f6fa', minHeight: '100vh', paddingTop: 110, paddingBottom: 60 }}>
      <style>{`
        select:focus { border-color: #2a5298 !important; box-shadow: 0 0 0 3px rgba(42,82,152,0.12) !important; outline: none; }
        textarea:focus { border-color: #2a5298 !important; box-shadow: 0 0 0 3px rgba(42,82,152,0.12) !important; outline: none; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'flex-start' }}>

          {/* ══════════ LEFT COLUMN ══════════ */}
          <div>

            {/* ── ADDRESS BAR ── */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>

              {/* Collapsed row — always visible */}
              <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: addrDone ? 4 : 0 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: addrDone ? '#007600' : '#2a5298',
                      color: '#fff', display: 'inline-flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {addrDone ? '✓' : '!'}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: addrDone ? '#007600' : '#2a5298' }}>
                      Address
                    </span>
                  </div>
                  {addrDone && !addrExpanded && (
                    <p style={{ fontSize: '0.82rem', color: '#374151', margin: 0, paddingLeft: 30 }}>
                      {address.address}, {address.city}, {address.state} — {address.pincode}
                    </p>
                  )}
                  {!addrDone && !addrExpanded && (
                    <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: 0, paddingLeft: 30 }}>
                      No address saved — click Change to add one
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setAddrExpanded(v => !v)}
                  style={{ background: 'none', border: '1px solid #2a5298', borderRadius: 4, color: '#2a5298', fontSize: '0.78rem', fontWeight: 600, padding: '4px 12px', cursor: 'pointer', flexShrink: 0 }}
                >
                  {addrExpanded ? 'Cancel' : 'Change'}
                </button>
              </div>

              {/* Expanded form */}
              {addrExpanded && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '20px 24px' }}>
                  <form id="bn-addr-form" onSubmit={handleAddressSave}>
                    <Field label="Street Address, Area, Landmark" required>
                      <textarea
                        rows={2} required
                        placeholder="House/Flat no., Street, Area, Landmark"
                        value={address.address}
                        onChange={e => set('address', e.target.value)}
                        onFocus={onF('address')} onBlur={onB}
                        style={{ ...inp('address'), resize: 'none' }}
                      />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="State" required>
                        <select required value={address.state}
                          onChange={e => { set('state', e.target.value); set('city', ''); }}
                          style={{ ...inputStyle, borderColor: '#d1d5db', cursor: 'pointer' }}>
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="City" required>
                        {cities.length > 0 ? (
                          <select required value={address.city}
                            onChange={e => set('city', e.target.value)}
                            style={{ ...inputStyle, borderColor: '#d1d5db', cursor: 'pointer' }}>
                            <option value="">Select City</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <input required
                            placeholder={address.state ? 'Enter city' : 'Select state first'}
                            value={address.city}
                            onChange={e => set('city', e.target.value)}
                            disabled={!address.state}
                            onFocus={onF('city')} onBlur={onB}
                            style={{ ...inp('city'), background: !address.state ? '#f9fafb' : '#fff', color: !address.state ? '#9ca3af' : '#0f1111' }}
                          />
                        )}
                      </Field>
                    </div>
                    <Field label="Pincode" required>
                      <input required maxLength={6} placeholder="6-digit pincode"
                        value={address.pincode}
                        onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onFocus={onF('pincode')} onBlur={onB}
                        style={{ ...inp('pincode'), maxWidth: 180 }}
                      />
                    </Field>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button type="submit"
                        style={{ padding: '9px 24px', background: '#2a5298', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: '0.88rem', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Save Address
                      </button>
                      <button type="button" onClick={() => setAddrExpanded(false)}
                        style={{ padding: '9px 20px', background: 'none', border: '1px solid #d1d5db', borderRadius: 4, fontWeight: 600, fontSize: '0.88rem', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* ── ORDER SUMMARY ── */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '24px', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f1111', marginBottom: 18 }}>
                Order Summary
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', background: '#f9fafb' }}>
                  <img
                    src={resolveImg(item.imageUrl)} alt={item.name}
                    onError={e => { e.target.src = FALLBACK_IMG; }}
                    style={{ width: '100%', height: 80, objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.92rem', fontWeight: 500, color: '#0f1111', margin: '0 0 4px', lineHeight: 1.4 }}>
                    {item.name}
                  </p>
                  {item.category && (
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 6px' }}>{item.category}</p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#374151', margin: '0 0 4px' }}>Qty: {qty}</p>
                  {item.hasGroupDeal ? (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: 3, padding: '2px 7px' }}>
                      🤝 Group Deal Price
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#6b7280', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 3, padding: '2px 7px' }}>
                      Regular Price
                    </span>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {savings > 0 && (
                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', textDecoration: 'line-through', margin: '0 0 2px' }}>
                      ₹{mrpTotal.toLocaleString('en-IN')}
                    </p>
                  )}
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#0f1111', margin: 0 }}>
                    ₹{lineTotal.toLocaleString('en-IN')}
                  </p>
                  {savings > 0 && (
                    <p style={{ fontSize: '0.72rem', color: '#007600', fontWeight: 600, margin: '2px 0 0' }}>
                      Save ₹{savings.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── PAYMENT METHOD ── */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '24px', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f1111', marginBottom: 18 }}>
                Payment Method
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                  { val: 'COD',    icon: '💵', label: 'Cash on Delivery', sub: 'Pay when your order arrives at your door', badge: null },
                  { val: 'Online', icon: '💳', label: 'Pay Online',        sub: 'UPI · Credit/Debit Card · Net Banking · Wallets via Cashfree', badge: 'Instant confirmation' },
                ].map(({ val, icon, label, sub, badge }) => {
                  const selected = address.paymentMethod === val;
                  return (
                    <label key={val}
                      onClick={() => set('paymentMethod', val)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                        border: `2px solid ${selected ? '#2a5298' : '#e5e7eb'}`,
                        borderRadius: 4, cursor: 'pointer',
                        background: selected ? '#eef2ff' : '#fff',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? '#2a5298' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#fff' }}>
                        {selected && <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#2a5298' }} />}
                      </div>
                      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f1111' }}>{label}</span>
                          {badge && <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 3 }}>{badge}</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                style={{
                  width: '100%', padding: '13px',
                  background: placing ? '#e5e7eb' : '#f0c14b',
                  border: placing ? '1px solid #d1d5db' : '1px solid #a88734',
                  borderRadius: 4, fontWeight: 700, fontSize: '1rem',
                  color: placing ? '#9ca3af' : '#111',
                  cursor: placing ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'background 0.15s',
                }}
              >
                {placing
                  ? (address.paymentMethod === 'Online' ? 'Opening Cashfree…' : 'Placing Order…')
                  : address.paymentMethod === 'Online'
                    ? `💳 Pay ₹${total.toLocaleString('en-IN')} via Cashfree`
                    : `📦 Place Order — ₹${total.toLocaleString('en-IN')} (Pay on Delivery)`
                }
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, fontSize: '0.75rem', color: '#6b7280' }}>
                <span>🔒</span>
                <span>Your data is encrypted and protected.</span>
              </div>
            </div>

            {/* Back to cart */}
            <button
              onClick={() => navigate('/cart')}
              style={{ background: 'none', border: 'none', color: '#2a5298', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              ← Back to Cart
            </button>
          </div>

          {/* ══════════ RIGHT COLUMN ══════════ */}
          <PricePanel />

        </div>
      </div>
    </div>
  );
}