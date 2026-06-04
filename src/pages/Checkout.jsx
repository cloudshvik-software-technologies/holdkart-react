import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Preload Cashfree SDK immediately when this module is imported —
// by the time the user fills out the form and clicks Pay, it will already be ready.
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
// Kick off the load right away (fire-and-forget)
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

/* ── Section header (numbered step) ── */
function SectionHeader({ num, title, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: done ? '#007600' : '#2a5298',
        color: '#fff', fontSize: '0.82rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {done ? '✓' : num}
      </div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f1111', margin: 0 }}>{title}</h2>
    </div>
  );
}

/* ── Form field ── */
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

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1px solid #d1d5db', borderRadius: 4,
  fontSize: '0.9rem', color: '#0f1111',
  outline: 'none', background: '#fff',
  boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

/* ══════════════════════════════
   MAIN PAGE
══════════════════════════════ */
export default function Checkout() {
  const { isAuthenticated, customer } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart]       = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({
    address: '', city: '', state: '', pincode: '', paymentMethod: 'COD',
  });
  const [focused, setFocused] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    (async () => {
      try {
        const [cartRes, profileRes] = await Promise.allSettled([
          cartService.getCart(),
          profileService.getProfile(),
        ]);
        if (cartRes.status === 'fulfilled') {
          setCart(Array.isArray(cartRes.value) ? cartRes.value : []);
        } else {
          toast.error('Failed to load cart');
        }
        if (profileRes.status === 'fulfilled' && profileRes.value) {
          setProfile(profileRes.value);
        }
      } finally { setLoading(false); }
    })();
  }, [isAuthenticated]);

  const fillFromProfile = () => {
    if (!profile) { toast.error('No profile data found'); return; }
    setAddress(prev => ({
      ...prev,
      address: profile.address || '',
      city:    profile.city    || '',
      state:   profile.state   || '',
      pincode: profile.pincode || '',
    }));
    toast.success('Address filled from profile');
  };

  const set = (field, val) => setAddress(prev => ({ ...prev, [field]: val }));

  /* use effectivePrice (group-deal discounted) when available, else retailPrice */
  const itemPrice = (item) => item.effectivePrice ?? item.retailPrice;
  const subtotalMRP = cart.reduce((s, i) => s + i.retailPrice  * i.quantity, 0);
  const subtotalEff = cart.reduce((s, i) => s + itemPrice(i)   * i.quantity, 0);
  const totalSavings = subtotalMRP - subtotalEff;

  /* For DEAL items: use the actual deposit stored on the cart row (set at join-time).
     Never derive from current cart quantity — that may differ from slots joined.      */
  const totalPrepaid = cart.reduce((s, i) => s + (i.depositPaid || 0), 0);

  const shipping     = subtotalEff > 499 ? 0 : 49;
  const total        = Math.max(0, subtotalEff - totalPrepaid + shipping);
  const itemCount    = cart.reduce((s, i) => s + i.quantity, 0);

  /* ── COD ── */
  const placeCOD = async () => {
    const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
    await orderService.placeOrder({ items, ...address });
    toast.success('Order placed successfully!');
    navigate('/orders');
  };

  /* ── Cashfree ── */
  const placeOnline = async () => {
    // SDK was preloaded at page mount; this resolves instantly in the normal case
    const loaded = await loadCashfreeScript();
    if (!loaded) { toast.error('Payment SDK failed to load. Please try COD.'); return; }

    // Create order on server — returns orderId + paymentSessionId
    const cfOrder = await paymentService.createCashfreeOrder({
      amount: total,
      currency: 'INR',
      customerInfo: {
        customerId: customer?.id   ? String(customer.id) : 'cust_' + Date.now(),
        name:       customer?.name  || 'HoldKart Customer',
        email:      customer?.email || 'customer@holdkart.com',
        phone:      profile?.mobile || '9999999999',
      },
    });

    // Initialise Cashfree JS SDK (sandbox mode)
    const cashfree = window.Cashfree({ mode: 'sandbox' });

    await new Promise((resolve, reject) => {
      cashfree.checkout({
        paymentSessionId: cfOrder.paymentSessionId,
        redirectTarget:   '_modal',   // opens a modal inside the page
      }).then(async (result) => {
        if (result.error) {
          // User closed or there was a payment error
          if (result.error.message === 'User closed the checkout') {
            reject(new Error('Payment cancelled'));
          } else {
            reject(new Error(result.error.message || 'Payment failed'));
          }
          return;
        }

        // Payment attempted — verify with server
        try {
          await paymentService.verifyPayment({ orderId: cfOrder.orderId });
          const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
          await orderService.placeOrder({ items, ...address, paymentId: cfOrder.orderId });
          toast.success('Payment successful! Order placed.');
          navigate('/orders');
          resolve();
        } catch (err) { reject(err); }
      }).catch((err) => {
        reject(new Error(err?.message || 'Payment failed'));
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) { toast.error('Your cart is empty'); return; }
    if (!address.address || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill all address fields'); return;
    }
    if (!/^\d{6}$/.test(address.pincode)) { toast.error('Enter a valid 6-digit pincode'); return; }
    setPlacing(true);
    try {
      if (address.paymentMethod === 'Online') { await placeOnline(); }
      else { await placeCOD(); }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Order failed';
      if (msg !== 'Payment cancelled') toast.error(msg);
    } finally { setPlacing(false); }
  };

  /* address completeness for step indicators */
  const addrDone = !!(address.address && address.city && address.state && address.pincode);
  const cities   = address.state ? (CITIES_BY_STATE[address.state] || []) : [];

  /* ── shared input focus style ── */
  const inp = (name) => ({
    ...inputStyle,
    borderColor: focused === name ? '#2a5298' : '#d1d5db',
    boxShadow:   focused === name ? '0 0 0 3px rgba(42,82,152,0.12)' : 'none',
  });
  const onF = (name) => () => setFocused(name);
  const onB = () => setFocused('');

  if (loading) return (
    <div style={{ background: '#f4f6fa', minHeight: '100vh', paddingTop: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #eef2ff', borderTopColor: '#2a5298', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading checkout…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f4f6fa', minHeight: '100vh', paddingTop: 90, paddingBottom: 60 }}>
      <style>{`
        select:focus { border-color: #2a5298 !important; box-shadow: 0 0 0 3px rgba(42,82,152,0.12) !important; outline: none; }
        textarea:focus { border-color: #2a5298 !important; box-shadow: 0 0 0 3px rgba(42,82,152,0.12) !important; outline: none; }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Top logo strip ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '12px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#2a5298' }}>HoldKart</span>
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Checkout</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#6b7280' }}>
            <span>🔒</span>
            <span>Secure Checkout</span>
          </div>
        </div>

        {cart.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🛒</div>
            <h2 style={{ fontWeight: 700, color: '#0f1111', marginBottom: 8 }}>Your cart is empty</h2>
            <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '0.9rem' }}>Add some products before checkout.</p>
            <button onClick={() => navigate('/products')}
              style={{ padding: '10px 28px', background: '#f0c14b', border: '1px solid #a88734', borderRadius: 4, fontWeight: 700, color: '#111', cursor: 'pointer' }}>
              Browse Products
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'flex-start' }}>

            {/* ══════════ LEFT COLUMN ══════════ */}
            <form onSubmit={handleSubmit}>

              {/* ── Step 1: Delivery Address ── */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '20px 24px', marginBottom: 12 }}>
                <SectionHeader num="1" title="Delivery Address" done={addrDone} />

                {/* Use profile address button */}
                {profile && (
                  <div style={{ marginBottom: 16 }}>
                    <button type="button" onClick={fillFromProfile}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 4, fontSize: '0.82rem', fontWeight: 600, color: '#2a5298', cursor: 'pointer', fontFamily: 'inherit' }}>
                      📋 Use Saved Address
                    </button>
                  </div>
                )}

                {/* Address textarea */}
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

                {/* State + City row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
                  <Field label="State" required>
                    <select
                      required value={address.state}
                      onChange={e => { set('state', e.target.value); set('city', ''); }}
                      style={{ ...inputStyle, borderColor: '#d1d5db', cursor: 'pointer' }}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>

                  <Field label="City" required>
                    {cities.length > 0 ? (
                      <select
                        required value={address.city}
                        onChange={e => set('city', e.target.value)}
                        style={{ ...inputStyle, borderColor: '#d1d5db', cursor: 'pointer' }}
                      >
                        <option value="">Select City</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input
                        required
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

                {/* Pincode */}
                <Field label="Pincode" required>
                  <input
                    required maxLength={6} placeholder="6-digit pincode"
                    value={address.pincode}
                    onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onFocus={onF('pincode')} onBlur={onB}
                    style={{ ...inp('pincode'), maxWidth: 180 }}
                  />
                </Field>

                {/* Address preview when filled */}
                {addrDone && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: '10px 14px', fontSize: '0.82rem', color: '#15803d', marginTop: 4 }}>
                    ✓ Delivering to: <strong>{address.address}, {address.city}, {address.state} — {address.pincode}</strong>
                  </div>
                )}
              </div>

              {/* ── Step 2: Payment Method ── */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '20px 24px', marginBottom: 12 }}>
                <SectionHeader num="2" title="Payment Method" done={false} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    {
                      val: 'COD', icon: '💵',
                      label: 'Cash on Delivery',
                      sub: 'Pay when your order arrives at your door',
                      badge: null,
                    },
                    {
                      val: 'Online', icon: '💳',
                      label: 'Pay Online',
                      sub: 'UPI · Credit/Debit Card · Net Banking · Wallets via Cashfree',
                      badge: 'Instant confirmation',
                    },
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
                        {/* Radio */}
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `2px solid ${selected ? '#2a5298' : '#d1d5db'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, background: '#fff',
                        }}>
                          {selected && <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#2a5298' }} />}
                        </div>

                        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f1111' }}>{label}</span>
                            {badge && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 3 }}>
                                {badge}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* ── Step 3: Review Items ── */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '20px 24px', marginBottom: 16 }}>
                <SectionHeader num="3" title={`Review Items (${itemCount})`} done={false} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {cart.map((item, idx) => {
                    const price    = itemPrice(item);
                    const lineAmt  = price * item.quantity;
                    const mrpAmt   = item.retailPrice * item.quantity;
                    const saved    = mrpAmt - lineAmt;
                    return (
                      <div key={item.cartId}
                        style={{
                          display: 'grid', gridTemplateColumns: '64px 1fr auto',
                          gap: 14, padding: '14px 0',
                          borderBottom: idx < cart.length - 1 ? '1px solid #f3f4f6' : 'none',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', background: '#f9fafb' }}>
                          <img
                            src={resolveImg(item.imageUrl)}
                            alt={item.name}
                            onError={e => { e.target.src = FALLBACK_IMG; }}
                            style={{ width: '100%', height: 64, objectFit: 'contain', display: 'block' }}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '0.88rem', fontWeight: 500, color: '#0f1111', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px' }}>Qty: {item.quantity}</p>
                          {item.hasGroupDeal && item.discountPct > 0 && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#eef2ff', color: '#1e3c72', border: '1px solid #c7d8f8', borderRadius: 3, padding: '1px 6px' }}>
                              🤝 {item.discountPct}% group deal
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f1111', margin: '0 0 2px' }}>
                            ₹{lineAmt.toLocaleString('en-IN')}
                          </p>
                          {saved > 0 && (
                            <p style={{ fontSize: '0.72rem', color: '#007600', margin: 0, fontWeight: 600 }}>
                              Save ₹{saved.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Place Order button ── */}
              <button type="submit"
                disabled={placing || cart.length === 0}
                style={{
                  width: '100%', padding: '13px',
                  background: placing ? '#e5e7eb' : '#f0c14b',
                  border: placing ? '1px solid #d1d5db' : '1px solid #a88734',
                  borderRadius: 4,
                  fontWeight: 700, fontSize: '1rem',
                  color: placing ? '#9ca3af' : '#111',
                  cursor: placing ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                {placing
                  ? (address.paymentMethod === 'Online' ? 'Opening Cashfree…' : 'Placing Order…')
                  : address.paymentMethod === 'Online'
                    ? `💳 Pay ₹${total.toLocaleString('en-IN')} via Cashfree`
                    : `📦 Place Order — ₹${total.toLocaleString('en-IN')} (Pay on Delivery)`
                }
              </button>

              {/* Secure note */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, fontSize: '0.75rem', color: '#6b7280' }}>
                <span>🔒</span>
                <span>Your data is encrypted and protected. Safe checkout guaranteed.</span>
              </div>
            </form>

            {/* ══════════ RIGHT COLUMN — Order Summary ══════════ */}
            <div style={{ position: 'sticky', top: 96 }}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '14px 18px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f1111', margin: 0 }}>
                    Order Summary
                  </h3>
                </div>

                {/* Item list */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', maxHeight: 240, overflowY: 'auto' }}>
                  {cart.map(item => {
                    const price = itemPrice(item);
                    return (
                      <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.82rem', color: '#0f1111', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: 0 }}>
                            ₹{price.toLocaleString('en-IN')} × {item.quantity}
                          </p>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f1111', flexShrink: 0 }}>
                          ₹{(price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', marginBottom: 8 }}>
                    <span>Items ({itemCount})</span>
                    <span>₹{subtotalEff.toLocaleString('en-IN')}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#007600', fontWeight: 600, marginBottom: 8 }}>
                      <span>Group Deal Savings</span>
                      <span>−₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {totalPrepaid > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600, marginBottom: 8 }}>
                      <span>Deposit Pre-paid</span>
                      <span>−₹{totalPrepaid.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', marginBottom: 12 }}>
                    <span>Delivery</span>
                    <span style={{ color: shipping === 0 ? '#007600' : '#374151', fontWeight: shipping === 0 ? 600 : 400 }}>
                      {shipping === 0 ? 'FREE' : `₹${shipping}`}
                    </span>
                  </div>

                  {shipping === 0 && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: '6px 10px', fontSize: '0.72rem', color: '#15803d', fontWeight: 600, marginBottom: 12 }}>
                      ✓ Free delivery on orders above ₹499
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', color: '#0f1111' }}>
                    <span>{totalPrepaid > 0 ? 'Amount Due at Checkout' : 'Order Total'}</span>
                    <span style={{ color: totalPrepaid > 0 ? '#2a5298' : '#0f1111' }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <p style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 4 }}>Inclusive of all taxes</p>
                  {totalPrepaid > 0 && (
                    <p style={{ fontSize: '0.68rem', color: '#7c3aed', marginTop: 2, fontWeight: 600 }}>
                      ₹{totalPrepaid.toLocaleString('en-IN')} group deal deposit already paid — deducted above
                    </p>
                  )}

                  {/* Payment info */}
                  <div style={{ marginTop: 14, background: '#f4f6fa', borderRadius: 4, padding: '10px 12px', fontSize: '0.78rem', color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {address.paymentMethod === 'COD'
                      ? <><span>💵</span><span>You pay <strong>₹{total.toLocaleString('en-IN')}</strong> on delivery</span></>
                      : <><span>🔒</span><span>Secure payment via <strong>Cashfree</strong></span></>
                    }
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '14px 18px', marginTop: 12 }}>
                {[
                  ['✅', '100% Secure Checkout'],
                  ['🔄', '7-Day Easy Returns'],
                  ['🚚', 'Fast & Reliable Delivery'],
                  ['📦', 'Quality Certified Products'],
                ].map(([icon, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', color: '#374151', marginBottom: 8 }}>
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}