import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, orderService, paymentService, profileService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

// Cities grouped by state — top cities per state
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

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  const { isAuthenticated, customer } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({
    address: '', city: '', state: '', pincode: '', paymentMethod: 'COD',
  });

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    (async () => {
      try {
        const [cartResult, profileResult] = await Promise.allSettled([
          cartService.getCart(),
          profileService.getProfile(),
        ]);
        if (cartResult.status === 'fulfilled') {
          setCart(Array.isArray(cartResult.value) ? cartResult.value : []);
        } else {
          toast.error('Failed to load cart');
        }
        if (profileResult.status === 'fulfilled' && profileResult.value) {
          setProfile(profileResult.value);
        }
        // Profile failure is non-fatal — checkout still works without saved address
      } finally {
        setLoading(false);
      }
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

  const subtotal  = cart.reduce((s, i) => s + i.retailPrice * i.quantity, 0);
  const shipping  = subtotal > 499 ? 0 : 49;
  const total     = subtotal + shipping;

  const set = (field, val) => setAddress(prev => ({ ...prev, [field]: val }));

  // ── COD flow ────────────────────────────────────────────────────────────────
  const placeCOD = async () => {
    const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
    await orderService.placeOrder({ items, ...address });
    toast.success('Order placed successfully!');
    navigate('/orders');
  };

  // ── Razorpay flow ──────────────────────────────────────────────────────────
  const placeOnline = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) { toast.error('Razorpay failed to load. Try COD.'); return; }

    // 1. Create Razorpay order on backend
    const rzOrder = await paymentService.createRazorpayOrder({ amount: total });

    // 2. Open Razorpay modal
    await new Promise((resolve, reject) => {
      const options = {
        key:          rzOrder.keyId || RAZORPAY_KEY,
        amount:       rzOrder.amount,
        currency:     rzOrder.currency || 'INR',
        name:         'HoldKart',
        description:  'Order Payment',
        order_id:     rzOrder.orderId,
        prefill: {
          name:    customer?.name  || '',
          email:   customer?.email || '',
          contact: profile?.mobile || '',
        },
        theme: { color: '#2563eb' },
        handler: async (response) => {
          try {
            // 3. Verify payment
            await paymentService.verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            // 4. Place order with paymentId
            const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
            await orderService.placeOrder({
              items, ...address,
              paymentId: response.razorpay_payment_id,
            });
            toast.success('Payment successful! Order placed.');
            navigate('/orders');
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      };
      new window.Razorpay(options).open();
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
      if (address.paymentMethod === 'Online') {
        await placeOnline();
      } else {
        await placeCOD();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Order failed';
      if (msg !== 'Payment cancelled') toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="page-wrap" style={{ textAlign: 'center', paddingTop: 80 }}>Loading…</div>;

  const cities = address.state ? (CITIES_BY_STATE[address.state] || []) : [];

  return (
    <div className="page-wrap">
      <button onClick={() => navigate('/cart')} style={{ color: 'var(--blue)', fontWeight: 500, fontSize: '0.9rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}>← Back to Cart</button>
      <h1 className="page-title">Checkout</h1>

      {cart.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🛒</div>
          <h3>Your cart is empty</h3>
          <button className="btn-primary" onClick={() => navigate('/products')} style={{ marginTop: 16 }}>Browse Products</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

          {/* ── Left column ── */}
          <form onSubmit={handleSubmit}>

            {/* Delivery Address */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, margin: 0 }}>Delivery Address</h3>
                {profile && (
                  <button type="button" onClick={fillFromProfile}
                    style={{ fontSize: '0.82rem', color: 'var(--blue)', background: 'var(--blue-pale)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
                    📋 Use Profile Address
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Full Address</label>
                <textarea rows={2} required placeholder="House/Flat no., Street, Area, Landmark"
                  value={address.address} onChange={e => set('address', e.target.value)} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>State</label>
                  <select required value={address.state}
                    onChange={e => set('state', e.target.value) || set('city', '')}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', background: '#fff', color: address.state ? 'var(--text)' : 'var(--muted)' }}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>City</label>
                  {cities.length > 0 ? (
                    <select required value={address.city} onChange={e => set('city', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', background: '#fff', color: address.city ? 'var(--text)' : 'var(--muted)' }}>
                      <option value="">Select City</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input required placeholder={address.state ? 'Enter city' : 'Select state first'}
                      value={address.city} onChange={e => set('city', e.target.value)}
                      disabled={!address.state} />
                  )}
                </div>
              </div>

              <div className="form-group" style={{ maxWidth: 180 }}>
                <label>Pincode</label>
                <input required maxLength={6} placeholder="6-digit pincode"
                  value={address.pincode}
                  onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
              </div>
            </div>

            {/* Payment Method */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Payment Method</h3>
              {[
                ['COD',    '💵', 'Cash on Delivery',           'Pay when your order arrives'],
                ['Online', '💳', 'Online Payment (Razorpay)',  'UPI, Cards, Net Banking, Wallets'],
              ].map(([val, icon, label, sub]) => (
                <label key={val} onClick={() => set('paymentMethod', val)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, cursor: 'pointer',
                    padding: '14px 16px', borderRadius: 10, border: `2px solid ${address.paymentMethod === val ? 'var(--blue)' : 'var(--border)'}`,
                    background: address.paymentMethod === val ? 'var(--blue-pale)' : '#fff', transition: 'all 0.15s' }}>
                  <input type="radio" name="paymentMethod" value={val} checked={address.paymentMethod === val} onChange={() => set('paymentMethod', val)} style={{ accentColor: 'var(--blue)' }} />
                  <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{sub}</div>
                  </div>
                </label>
              ))}
            </div>

            <button type="submit" className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '1rem' }}
              disabled={placing || cart.length === 0}>
              {placing
                ? (address.paymentMethod === 'Online' ? 'Opening Payment…' : 'Placing Order…')
                : `${address.paymentMethod === 'Online' ? '💳 Pay' : '📦 Place Order'} — ₹${total.toLocaleString()}`}
            </button>
          </form>

          {/* ── Right column — Order Summary ── */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>

              <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
                {cart.map(item => (
                  <div key={item.cartId} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Qty: {item.quantity} × ₹{item.retailPrice?.toLocaleString()}</div>
                    </div>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>₹{(item.retailPrice * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Shipping</span>
                  <span style={{ color: shipping === 0 ? '#16a34a' : 'var(--text)' }}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                {shipping === 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', marginBottom: 8, textAlign: 'right' }}>✓ Free shipping on orders above ₹499</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--blue-dark)' }}>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--blue-pale)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--blue-dark)' }}>
                {address.paymentMethod === 'COD'
                  ? '💵 You will pay ₹' + total.toLocaleString() + ' on delivery'
                  : '🔒 Secure payment via Razorpay'}
              </div>
            </div>

            <div style={{ marginTop: 14, padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, fontSize: '0.78rem', color: '#15803d', display: 'flex', gap: 8 }}>
              <span>🛡️</span>
              <span>100% secure checkout. Your data is encrypted and protected.</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}