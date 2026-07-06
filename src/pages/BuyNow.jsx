import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cartService, orderService, paymentService, profileService } from '../services/index.js';
import { getAvailableCouriers } from '../services/shipping.service.js';
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

// Some popular city names differ from their official postal "District" name
// (renamed cities, twin-city districts, etc). Without this, a perfectly valid
// address (e.g. Kochi, which is in Ernakulam district) would be wrongly flagged
// as a city/pincode mismatch.
const CITY_DISTRICT_ALIASES = {
  bengaluru: ['bangalore', 'bengaluru', 'bangalore urban', 'bengaluru urban'],
  mysuru: ['mysore', 'mysuru'],
  mangaluru: ['mangalore', 'dakshina kannada'],
  belagavi: ['belgaum'],
  kalaburagi: ['gulbarga'],
  ballari: ['bellary'],
  shivamogga: ['shimoga'],
  hubballi: ['hubli', 'dharwad'],
  tumkur: ['tumakuru', 'tumkur'],
  gurgaon: ['gurugram'],
  prayagraj: ['allahabad'],
  kochi: ['ernakulam'],
  tiruchirappalli: ['trichy'],
  puducherry: ['pondicherry'],
  mumbai: ['mumbai city', 'mumbai suburban'],
  'navi mumbai': ['thane', 'raigad'],
  'pimpri-chinchwad': ['pune'],
  'vasai-virar': ['palghar'],
  noida: ['gautam buddha nagar', 'gautam buddh nagar'],
  'greater noida': ['gautam buddha nagar', 'gautam buddh nagar'],
  'new delhi': ['delhi', 'central delhi', 'south delhi', 'north delhi', 'east delhi', 'west delhi', 'south west delhi', 'north west delhi', 'south east delhi', 'north east delhi', 'shahdara', 'new delhi'],
  delhi: ['delhi', 'central delhi', 'south delhi', 'north delhi', 'east delhi', 'west delhi', 'south west delhi', 'north west delhi', 'south east delhi', 'north east delhi', 'shahdara', 'new delhi'],
};
const normalizeName = (s) => (s || '').toLowerCase().replace(/[^a-z]/g, '');
function cityMatchesDistrict(cityInput, district) {
  const cNorm = normalizeName(cityInput);
  const dNorm = normalizeName(district);
  if (!cNorm) return true;
  if (dNorm.includes(cNorm) || cNorm.includes(dNorm)) return true;
  const aliasKey = Object.keys(CITY_DISTRICT_ALIASES).find(k => normalizeName(k) === cNorm);
  if (!aliasKey) return false;
  return CITY_DISTRICT_ALIASES[aliasKey].some(alias => {
    const aNorm = normalizeName(alias);
    return aNorm === dNorm || dNorm.includes(aNorm) || aNorm.includes(dNorm);
  });
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
  // Verifies the entered pincode actually belongs to the selected state/city —
  // status: 'idle' | 'checking' | 'ok' | 'mismatch' | 'error'
  const [pincodeCheck, setPincodeCheck] = useState({ status: 'idle', detectedState: '', detectedDistrict: '' });
  const pincodeCheckSeqRef = useRef(0);

  // courier state — same shape as Checkout's per-item courier entry
  const [courier, setCourier] = useState({ list: [], loading: false, error: null, selected: null });

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

  /* Fetch couriers whenever pincode is valid or payment method changes */
  const fetchCouriers = async (pincode, paymentMethod) => {
    if (!/^\d{6}$/.test(pincode) || !item) return;
    const cod = paymentMethod === 'COD' ? 1 : 0;
    setCourier({ list: [], loading: true, error: null, selected: null });
    try {
      const res  = await getAvailableCouriers(item.productId, pincode, 0.5, cod);
      const list = res?.couriers || [];
      setCourier({
        list,
        loading: false,
        error: list.length === 0 ? 'No couriers available for this pincode' : null,
        selected: null,
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch couriers';
      setCourier({ list: [], loading: false, error: msg, selected: null });
    }
  };

  useEffect(() => {
    if (item) fetchCouriers(address.pincode, address.paymentMethod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.pincode, address.paymentMethod]);

  /* Verify the entered pincode actually belongs to the selected state/city —
     prevents combinations like Tamil Nadu + a Karnataka pincode, or
     Coimbatore + a Chennai pincode, from being saved. */
  useEffect(() => {
    const { pincode, state, city } = address;
    if (!/^\d{6}$/.test(pincode) || !state) {
      setPincodeCheck({ status: 'idle', detectedState: '', detectedDistrict: '' });
      return;
    }
    const seq = ++pincodeCheckSeqRef.current;
    setPincodeCheck(prev => ({ ...prev, status: 'checking' }));
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z]/g, '');
    (async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (seq !== pincodeCheckSeqRef.current) return; // a newer check has since started
        const po = data?.[0]?.PostOffice?.[0];
        if (!po) { setPincodeCheck({ status: 'error', detectedState: '', detectedDistrict: '' }); return; }
        const stateMatches = norm(po.State) === norm(state);
        const cityMatches = cityMatchesDistrict(city, po.District);
        setPincodeCheck({
          status: stateMatches && cityMatches ? 'ok' : 'mismatch',
          detectedState: po.State || '',
          detectedDistrict: po.District || '',
        });
      } catch {
        if (seq === pincodeCheckSeqRef.current) setPincodeCheck({ status: 'error', detectedState: '', detectedDistrict: '' });
      }
    })();
  }, [address.pincode, address.state, address.city]);

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
  // use selected courier rate × quantity; null until courier is selected
  const deliveryCharge = courier.selected ? Math.round(courier.selected.rate * qty * 100) / 100 : null;
  const platformFee    = 10;
  const totalFees      = (deliveryCharge ?? 0) + platformFee;
  const total          = Math.max(0, lineTotal - depositPaid + totalFees);

  const addrDone = !!(address.address && address.city && address.state && address.pincode);
  const cities   = address.state ? (CITIES_BY_STATE[address.state] || []) : [];

  /* ── Payment method availability (seller-controlled per product) ── */
  const codAllowed    = item ? item.shipCod    !== false : true;
  const onlineAllowed = item ? item.shipOnline !== false : true;

  /* If the currently selected method isn't allowed for this product, fall
     back to whichever method is still allowed. */
  useEffect(() => {
    if (!item) return;
    if (address.paymentMethod === 'COD' && !codAllowed && onlineAllowed) {
      set('paymentMethod', 'Online');
    } else if (address.paymentMethod === 'Online' && !onlineAllowed && codAllowed) {
      set('paymentMethod', 'COD');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, codAllowed, onlineAllowed]);

  const removeBuyNowItem = async () => {
    if (item?.cartId) {
      try { await cartService.removeFromCart({ cartId: item.cartId }); } catch { /* best-effort */ }
    }
  };

  const placeCOD = async () => {
    await orderService.placeOrder({
      // BUG FIX: include the courier the customer selected on this page —
      // previously it was used only to compute deliveryCharge and discarded.
      items: [{
        productId: item.productId,
        // BUG FIX: carry the variant (colour/size) through to the order — see
        // Checkout.jsx for the same fix on the multi-item checkout flow.
        variantId: item.variantId || null,
        quantity: item.quantity,
        courierId:   courier.selected?.courierId   ?? null,
        courierName: courier.selected?.courierName ?? null,
      }],
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
              items: [{
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
                courierId:   courier.selected?.courierId   ?? null,
                courierName: courier.selected?.courierName ?? null,
              }],
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
    if (pincodeCheck.status === 'mismatch') {
      toast.error(`That pincode belongs to ${pincodeCheck.detectedDistrict}, ${pincodeCheck.detectedState} — please match it with the selected city/state`);
      return;
    }
    setAddrExpanded(false);
  };

  const handlePlaceOrder = async () => {
    if (!addrDone) { toast.error('Please add a delivery address first'); setAddrExpanded(true); return; }
    if (!/^\d{6}$/.test(address.pincode)) { toast.error('Enter a valid 6-digit pincode'); setAddrExpanded(true); return; }
    if (pincodeCheck.status === 'mismatch') {
      toast.error(`That pincode belongs to ${pincodeCheck.detectedDistrict}, ${pincodeCheck.detectedState} — please match it with the selected city/state`);
      setAddrExpanded(true); return;
    }
    // BUG FIX: previously this only blocked submission when the courier list had
    // already loaded (`courier.list.length > 0`). If the user clicked "Place Order"
    // while couriers were still being fetched, `list` was still empty, the check
    // was skipped entirely, and the order went through with courier.selected = null
    // — so customer_courier_id / customer_courier_name were stored as NULL.
    if (courier.loading) {
      toast.error('Please wait — fetching available couriers for your address');
      return;
    }
    if (courier.list.length > 0 && !courier.selected) {
      toast.error('Please select a courier'); return;
    }
    setPlacing(true);
    try {
      if (address.paymentMethod === 'Online') { await placeOnline(); }
      else { await placeCOD(); }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Order failed';
      if (msg !== 'Payment cancelled') toast.error(msg);
    } finally { setPlacing(false); }
  };

  /* ── Price Details panel — mirrors Checkout.jsx's Order Summary layout ── */
  const PricePanel = () => (
    <div className="hk-bn-price-col" style={{ position: 'sticky', top: 96 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '14px 18px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f1111', margin: 0 }}>Price Details</h3>
        </div>

        {/* Item list */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', color: '#0f1111', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: 0 }}>
                ₹{price.toLocaleString('en-IN')} × {qty}
              </p>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f1111', flexShrink: 0 }}>
              ₹{lineTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Totals */}
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', marginBottom: 8 }}>
            <span>Items ({qty})</span>
            <span>₹{lineTotal.toLocaleString('en-IN')}</span>
          </div>

          {savings > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#007600', fontWeight: 600, marginBottom: 8 }}>
              <span>{item.hasGroupDeal ? 'Group Deal Savings' : 'Product Discount'}</span>
              <span>−₹{savings.toLocaleString('en-IN')}</span>
            </div>
          )}

          {depositPaid > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600, marginBottom: 8 }}>
              <span>Deposit Pre-paid</span>
              <span>−₹{depositPaid.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>
              <span>Delivery Charge</span>
              <span style={{ fontWeight: 600 }}>
                {deliveryCharge === null
                  ? <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Select courier</span>
                  : deliveryCharge === 0
                    ? <span style={{ color: '#007600' }}>FREE</span>
                    : `₹${deliveryCharge}`
                }
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#374151', marginBottom: 4 }}>
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

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', color: '#0f1111' }}>
            <span>{depositPaid > 0 ? 'Amount Due' : 'Order Total'}</span>
            <span style={{ color: depositPaid > 0 ? '#2a5298' : '#0f1111' }}>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <p style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 4 }}>Inclusive of all taxes</p>
          {depositPaid > 0 && (
            <p style={{ fontSize: '0.68rem', color: '#7c3aed', marginTop: 2, fontWeight: 600 }}>
              ₹{depositPaid.toLocaleString('en-IN')} group deal deposit already paid — deducted above
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
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .hk-bn-layout { grid-template-columns: 1fr !important; }
          .hk-bn-price-col { position: static !important; }
          .hk-bn-courier-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 480px) {
          .hk-bn-item-row { grid-template-columns: 52px 1fr !important; }
          .hk-bn-item-price { grid-column: 1 / -1 !important; text-align: left !important; margin-top: 6px; }
          .hk-bn-courier-wrap { margin-left: 0 !important; }
          .hk-bn-courier-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <div className="hk-bn-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'flex-start' }}>

          {/* ══════════ LEFT COLUMN ══════════ */}
          <div>

            {/* ── ADDRESS BAR ── */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>

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
                      Delivery Address
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
                  type="button"
                  onClick={() => setAddrExpanded(v => !v)}
                  style={{ background: 'none', border: '1px solid #2a5298', borderRadius: 4, color: '#2a5298', fontSize: '0.78rem', fontWeight: 600, padding: '4px 12px', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}
                >
                  {addrExpanded ? 'Cancel' : 'Change'}
                </button>
              </div>

              {/* Expanded form */}
              {addrExpanded && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '20px 24px' }}>
                  <form onSubmit={handleAddressSave}>
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
                        style={{ ...inp('pincode'), maxWidth: 180, borderColor: pincodeCheck.status === 'mismatch' ? '#dc2626' : inp('pincode').borderColor }}
                      />
                      {pincodeCheck.status === 'checking' && (
                        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>Checking pincode…</div>
                      )}
                      {pincodeCheck.status === 'mismatch' && (
                        <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 4 }}>
                          This pincode belongs to {pincodeCheck.detectedDistrict}, {pincodeCheck.detectedState} — it doesn't match the selected city/state.
                        </div>
                      )}
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

            {/* ── ORDER SUMMARY (item + inline courier card grid) — mirrors Checkout.jsx ── */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ background: '#1e3c72', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.05rem' }}></span>
                  Order Summary ({qty} {qty === 1 ? 'item' : 'items'})
                </h2>
                {savings > 0 && (
                  <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                    🎉 You're saving ₹{savings.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <div style={{ padding: '20px 24px', background: '#f5f8ff' }}>

              {!addrDone && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, padding: '10px 14px', fontSize: '0.8rem', color: '#92400e', marginBottom: 14 }}>
                  ⓘ Add your delivery address above to see available couriers.
                </div>
              )}

              <div style={{ padding: '16px 0' }}>

              {/* Product row */}
              <div className="hk-bn-item-row" style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 14, alignItems: 'center' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', background: '#f9fafb' }}>
                  <img
                    src={resolveImg(item.imageUrl)} alt={item.name}
                    onError={e => { e.target.src = FALLBACK_IMG; }}
                    style={{ width: '100%', height: 64, objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.88rem', fontWeight: 500, color: '#0f1111', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 4px' }}>Qty: {qty}</p>
                  {item.hasGroupDeal ? (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#eef2ff', color: '#1e3c72', border: '1px solid #c7d8f8', borderRadius: 3, padding: '1px 6px' }}>
                      🤝 Group Deal Price
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#6b7280', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 3, padding: '1px 6px' }}>
                      Regular Price
                    </span>
                  )}
                </div>
                <div className="hk-bn-item-price" style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f1111', margin: '0 0 2px' }}>
                    ₹{lineTotal.toLocaleString('en-IN')}
                  </p>
                  {savings > 0 && (
                    <p style={{ fontSize: '0.72rem', color: '#007600', margin: 0, fontWeight: 600 }}>
                      Save ₹{savings.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Courier selector — inline cards, 3 per row, same as Checkout ── */}
              {addrDone && (
                <div className="hk-bn-courier-wrap" style={{ marginTop: 14, marginLeft: 78 }}>
                  {courier.loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#6b7280' }}>
                      <div style={{ width: 14, height: 14, border: '2px solid #e5e7eb', borderTopColor: '#2a5298', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                      Fetching couriers…
                    </div>
                  )}

                  {courier.error && !courier.loading && (
                    <div style={{ fontSize: '0.78rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '6px 10px' }}>
                      ⚠ {courier.error}
                    </div>
                  )}

                  {!courier.loading && !courier.error && courier.list.length > 0 && (() => {
                    const sel = courier.selected;
                    return (
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
                          Select Courier
                        </p>

                        <div className="hk-bn-courier-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                          {courier.list.map((c) => {
                            const isSelected = sel?.courierId === c.courierId;
                            return (
                              <div
                                key={c.courierId}
                                onClick={() => setCourier(prev => ({ ...prev, selected: c }))}
                                style={{
                                  position: 'relative',
                                  display: 'flex', alignItems: 'center', gap: 9,
                                  padding: '10px 10px',
                                  border: `1.5px solid ${isSelected ? '#2a5298' : '#e5e7eb'}`,
                                  borderRadius: 12,
                                  background: isSelected ? '#eef2ff' : '#fff',
                                  cursor: 'pointer',
                                  boxShadow: isSelected ? '0 1px 6px rgba(42,82,152,0.18)' : '0 1px 2px rgba(0,0,0,0.04)',
                                  transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#c7d2fe'; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#e5e7eb'; }}
                              >
                                {/* Selected checkmark */}
                                {isSelected && (
                                  <div style={{
                                    position: 'absolute', top: -7, right: -7,
                                    width: 17, height: 17, borderRadius: '50%',
                                    background: '#2a5298', color: '#fff',
                                    fontSize: '0.6rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                  }}>
                                    ✓
                                  </div>
                                )}

                                {/* Icon badge */}
                                <div style={{
                                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                                  background: isSelected ? '#dbe4fb' : '#f1f4f9',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '1.05rem', overflow: 'hidden',
                                }}>
                                  {c.logo
                                    ? <img src={c.logo} alt={c.courierName} style={{ width: 22, height: 22, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                                    : '🚚'
                                  }
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f1111', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.courierName}
                                  </p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                                    <span style={{ color: c.rate === 0 ? '#007600' : '#0f1111', fontWeight: 700 }}>
                                      {c.rate === 0 ? 'FREE' : `₹${c.rate}`}
                                    </span>
                                    <span style={{ color: '#d1d5db' }}>•</span>
                                    <span>{c.etaDays} day{c.etaDays > 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              </div>
              </div>
            </div>


            {/* ── PAYMENT METHOD ── */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '20px 24px', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f1111', margin: '0 0 18px' }}>
                Payment Method
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                  { val: 'COD',    icon: '💵', label: 'Cash on Delivery', sub: 'Pay when your order arrives at your door', badge: null,
                    allowed: codAllowed, disabledMsg: 'Cash on delivery is not available for this product' },
                  { val: 'Online', icon: '💳', label: 'Pay Online',        sub: 'UPI · Credit/Debit Card · Net Banking · Wallets via Cashfree', badge: 'Instant confirmation',
                    allowed: onlineAllowed, disabledMsg: 'Online payment is not available for this product' },
                ].map(({ val, icon, label, sub, badge, allowed, disabledMsg }) => {
                  const selected = address.paymentMethod === val;
                  return (
                    <label key={val}
                      onClick={() => allowed ? set('paymentMethod', val) : toast.error(disabledMsg)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                        border: `2px solid ${selected && allowed ? '#2a5298' : '#e5e7eb'}`,
                        borderRadius: 4, cursor: allowed ? 'pointer' : 'not-allowed',
                        background: !allowed ? '#f9fafb' : (selected ? '#eef2ff' : '#fff'),
                        opacity: allowed ? 1 : 0.6,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected && allowed ? '#2a5298' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#fff' }}>
                        {selected && allowed && <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#2a5298' }} />}
                      </div>
                      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f1111' }}>{label}</span>
                          {badge && allowed && <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 3 }}>{badge}</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: allowed ? '#6b7280' : '#dc2626', marginTop: 2 }}>
                          {allowed ? sub : disabledMsg}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Place Order CTA */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing || (address.paymentMethod === 'COD' ? !codAllowed : !onlineAllowed)}
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