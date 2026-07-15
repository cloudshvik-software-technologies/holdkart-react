import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const MYNTRA_PINK = '#2a5298';

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

const LABELS = ['Home', 'Work', 'Other'];

const emptyForm = {
  name: '', mobile: '', label: 'Home',
  address_line1: '', address_line2: '', city: '', state: '', pincode: '',
  is_default: false,
};

export default function AddressFormModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState({ ...emptyForm, ...(initial || {}) });
  const [pincodeCheck, setPincodeCheck] = useState({ status: 'idle', detectedState: '', detectedDistrict: '' });
  const seqRef = useRef(0);

  useEffect(() => {
    const { pincode, state, city } = form;
    if (!/^\d{6}$/.test(pincode) || !state.trim()) {
      setPincodeCheck({ status: 'idle', detectedState: '', detectedDistrict: '' });
      return;
    }
    const seq = ++seqRef.current;
    setPincodeCheck(prev => ({ ...prev, status: 'checking' }));
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z]/g, '');
    (async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (seq !== seqRef.current) return;
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
        if (seq === seqRef.current) setPincodeCheck({ status: 'error', detectedState: '', detectedDistrict: '' });
      }
    })();
  }, [form.pincode, form.state, form.city]);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Please enter the receiver name');
    if (!/^\d{10}$/.test(form.mobile)) return toast.error('Please enter a valid 10-digit mobile number');
    if (!form.address_line1.trim()) return toast.error('Please enter the address');
    if (!form.city.trim() || !form.state.trim()) return toast.error('Please enter city and state');
    if (!/^\d{6}$/.test(form.pincode)) return toast.error('Please enter a valid 6-digit pincode');
    if (pincodeCheck.status === 'mismatch') {
      return toast.error(`That pincode belongs to ${pincodeCheck.detectedDistrict}, ${pincodeCheck.detectedState} — please match it with the city/state entered`);
    }
    onSave(form);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div
        style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: '28px 28px 24px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#282c3f' }}>
            {initial?.id ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#999', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="myn-label">Receiver Name</label>
              <input className="myn-input" placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="myn-label">Mobile Number</label>
              <input className="myn-input" placeholder="10-digit mobile number" value={form.mobile} maxLength={10}
                onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="myn-label">Street Address</label>
            <textarea className="myn-input" rows={2} placeholder="House / Flat No., Building, Street, Area"
              value={form.address_line1} onChange={e => set('address_line1', e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="myn-label">Landmark (optional)</label>
            <input className="myn-input" placeholder="Landmark" value={form.address_line2 || ''} onChange={e => set('address_line2', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="myn-label">City</label>
              <input className="myn-input" placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="myn-label">State</label>
              <input className="myn-input" placeholder="State" value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div>
              <label className="myn-label">Pincode</label>
              <input className="myn-input" placeholder="6-digit code" value={form.pincode} maxLength={6}
                onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))}
                style={pincodeCheck.status === 'mismatch' ? { borderColor: '#dc2626' } : undefined} />
              {pincodeCheck.status === 'checking' && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>Checking…</div>}
              {pincodeCheck.status === 'mismatch' && (
                <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4 }}>
                  Belongs to {pincodeCheck.detectedDistrict}, {pincodeCheck.detectedState}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="myn-label">Save As</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {LABELS.map(l => (
                <button key={l} type="button" onClick={() => set('label', l)}
                  style={{
                    padding: '6px 18px', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    border: `1px solid ${form.label === l ? MYNTRA_PINK : '#d4d5d9'}`,
                    background: form.label === l ? '#eef2ff' : '#fff',
                    color: form.label === l ? MYNTRA_PINK : '#555',
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '0.88rem', color: '#282c3f', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.is_default} onChange={e => set('is_default', e.target.checked)} />
            Make this my default address
          </label>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving} className="myn-save-btn" style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Save Address'}
            </button>
            <button type="button" onClick={onClose} style={{
              flex: '0 0 auto', padding: '0 24px', borderRadius: 4, border: '1px solid #d4d5d9',
              background: '#fff', color: '#555', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}