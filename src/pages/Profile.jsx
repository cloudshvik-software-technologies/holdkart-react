import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const CUSTOMER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

const MYNTRA_PINK = '#2a5298';
const MYNTRA_HOVER = '#1e3c72';

const NAV_ITEMS = [
  { key: 'profile',    label: 'My Profile' },
  { key: 'addresses',   label: 'Saved Addresses' },
  { key: 'cards',        label: 'Saved Cards' },
  { key: 'coupons',       label: 'My Coupons' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'orders',        label: 'Orders' },
  { key: 'wishlist',      label: 'Wishlist' },
];

export default function Profile() {
  const { isAuthenticated, customer, updateCustomer } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]   = useState('profile');
  const [form, setForm]             = useState({ name: '', mobile: '', address: '', city: '', state: '', pincode: '', gender: '' });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [imgFile, setImgFile]       = useState(null);
  const [profileImg, setProfileImg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    profileService.getProfile()
      .then(p => {
        if (p) {
          setForm({
            name: p.name || '',
            mobile: p.mobile || '',
            address: p.address || '',
            city: p.city || '',
            state: p.state || '',
            pincode: p.pincode || '',
            gender: p.gender || '',
          });
          setProfileImg(p.profile_image || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileService.updateProfile({ ...form });
      updateCustomer({ name: form.name });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async () => {
    if (!imgFile) return;
    const fd = new FormData();
    fd.append('profileImage', imgFile);
    try {
      const res = await profileService.uploadProfileImage(fd);
      setProfileImg(res.imageUrl || '');
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to upload photo');
    }
  };

  const getImgUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return CUSTOMER_URL + url;
  };

  const firstName = form.name ? form.name.split(' ')[0] : '';
  const lastName  = form.name ? form.name.split(' ').slice(1).join(' ') : '';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999', fontSize: '1rem' }}>Loading profile…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f5', fontFamily: "'Assistant', 'Segoe UI', sans-serif", paddingTop: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .myn-nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          cursor: pointer;
          font-size: 0.92rem;
          font-weight: 500;
          color: #333;
          border-left: 3px solid transparent;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          text-decoration: none;
        }
        .myn-nav-item:hover {
          background: #eef2ff;
          color: ${MYNTRA_PINK};
        }
        .myn-nav-item.active {
          background: #eef2ff;
          color: ${MYNTRA_PINK};
          border-left-color: ${MYNTRA_PINK};
          font-weight: 700;
        }
        .myn-nav-icon {
          font-size: 1.15rem;
          width: 22px;
          text-align: center;
          flex-shrink: 0;
        }

        .myn-input {
          width: 100%;
          border: 1px solid #d4d5d9;
          border-radius: 4px;
          padding: 12px 14px;
          font-size: 0.92rem;
          font-family: inherit;
          color: #333;
          outline: none;
          transition: border-color 0.2s;
          background: #fff;
        }
        .myn-input:focus {
          border-color: ${MYNTRA_PINK};
        }
        .myn-input::placeholder {
          color: #bbb;
        }

        .myn-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .myn-save-btn {
          background: ${MYNTRA_PINK};
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 14px 48px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: background 0.2s, transform 0.1s;
        }
        .myn-save-btn:hover:not(:disabled) {
          background: ${MYNTRA_HOVER};
          transform: translateY(-1px);
        }
        .myn-save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .myn-gender-btn {
          border: 1px solid #d4d5d9;
          border-radius: 4px;
          padding: 10px 28px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          background: #fff;
          color: #555;
          font-family: inherit;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .myn-gender-btn:hover {
          border-color: ${MYNTRA_PINK};
          color: ${MYNTRA_PINK};
        }
        .myn-gender-btn.selected {
          border-color: ${MYNTRA_PINK};
          color: ${MYNTRA_PINK};
          background: #eef2ff;
        }

        .myn-avatar-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 12px;
        }
        .myn-avatar-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #fff;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
        }
        .myn-avatar-edit {
          position: absolute;
          bottom: 0;
          right: -4px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: ${MYNTRA_PINK};
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.65rem;
          color: #fff;
        }

        .myn-section-head {
          font-size: 1.1rem;
          font-weight: 800;
          color: #282c3f;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eaeaec;
        }

        .myn-placeholder-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          color: #999;
        }
        .myn-placeholder-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          opacity: 0.4;
        }
        .myn-placeholder-text {
          font-size: 1rem;
          font-weight: 600;
          color: #aaa;
          margin-bottom: 8px;
        }
        .myn-placeholder-sub {
          font-size: 0.85rem;
          color: #bbb;
          text-align: center;
          max-width: 280px;
        }
      `}</style>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px 60px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ─── LEFT SIDEBAR ─────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

          {/* Profile mini-card */}
          <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #eaeaec', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 12px' }}>
              {profileImg ? (
                <img src={getImgUrl(profileImg)} alt="Profile"
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4f4f5' }} />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${MYNTRA_PINK}, #4f7ccc)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', color: '#fff', fontWeight: 700,
                }}>
                  {form.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: 2 }}>Hello,</div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#282c3f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {form.name || customer?.email || 'User'}
            </div>
          </div>

          {/* Nav items */}
          <nav>
            {NAV_ITEMS.map(item => (
              <div
                key={item.key}
                className={`myn-nav-item${activeTab === item.key ? ' active' : ''}`}
                onClick={() => {
                  if (item.key === 'orders') { navigate('/orders'); return; }
                  if (item.key === 'wishlist') { navigate('/wishlist'); return; }
                  setActiveTab(item.key);
                }}
              >
                <span className="myn-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>

        {/* ─── MAIN CONTENT ─────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 4, padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minHeight: 480 }}>

          {/* MY PROFILE */}
          {activeTab === 'profile' && (
            <div>
              <div className="myn-section-head">Personal Information</div>
              <form onSubmit={handleSave}>

                {/* Profile photo row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, padding: '16px 20px', background: '#f4f4f5', borderRadius: 8 }}>
                  <div className="myn-avatar-wrap">
                    {profileImg ? (
                      <img src={getImgUrl(profileImg)} alt="Profile" className="myn-avatar-img" />
                    ) : (
                      <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${MYNTRA_PINK}, #4f7ccc)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', color: '#fff', fontWeight: 700,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                      }}>
                        {form.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#282c3f', marginBottom: 6 }}>Profile Photo</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <label style={{
                        display: 'inline-block', cursor: 'pointer',
                        border: `1px solid ${MYNTRA_PINK}`, color: MYNTRA_PINK,
                        borderRadius: 4, padding: '6px 16px', fontSize: '0.82rem', fontWeight: 700,
                      }}>
                        Change Photo
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => setImgFile(e.target.files[0])} />
                      </label>
                      {imgFile && (
                        <button type="button" onClick={handleImageUpload}
                          style={{ background: MYNTRA_PINK, color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Upload
                        </button>
                      )}
                    </div>
                    {imgFile && (
                      <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 4 }}>{imgFile.name}</div>
                    )}
                  </div>
                </div>

                {/* Name row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div>
                    <label className="myn-label">First Name</label>
                    <input
                      className="myn-input"
                      placeholder="First Name"
                      value={firstName}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value + (lastName ? ' ' + lastName : '') }))}
                    />
                  </div>
                  <div>
                    <label className="myn-label">Last Name</label>
                    <input
                      className="myn-input"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={e => setForm(p => ({ ...p, name: (firstName || '') + (e.target.value ? ' ' + e.target.value : '') }))}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div style={{ marginBottom: 20 }}>
                  <label className="myn-label">Gender</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['Male', 'Female', 'Other'].map(g => (
                      <button
                        key={g}
                        type="button"
                        className={`myn-gender-btn${form.gender === g ? ' selected' : ''}`}
                        onClick={() => setForm(p => ({ ...p, gender: g }))}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email & Mobile */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div>
                    <label className="myn-label">Email Address</label>
                    <input
                      className="myn-input"
                      placeholder="Email"
                      value={customer?.email || ''}
                      readOnly
                      style={{ background: '#f8f8f8', color: '#999', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div>
                    <label className="myn-label">Mobile Number</label>
                    <input
                      className="myn-input"
                      placeholder="10-digit mobile number"
                      value={form.mobile}
                      maxLength={10}
                      onChange={e => setForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '') }))}
                    />
                  </div>
                </div>

                <button type="submit" className="myn-save-btn" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>

              {/* Address section */}
              <div style={{ marginTop: 36 }}>
                <div className="myn-section-head" style={{ marginBottom: 20 }}>Address Details</div>
                <div style={{ marginBottom: 16 }}>
                  <label className="myn-label">Street Address</label>
                  <textarea
                    className="myn-input"
                    rows={2}
                    placeholder="House / Flat No., Building, Street, Area"
                    value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 16 }}>
                  <div>
                    <label className="myn-label">City</label>
                    <input className="myn-input" placeholder="City" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="myn-label">State</label>
                    <input className="myn-input" placeholder="State" value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
                  </div>
                  <div>
                    <label className="myn-label">Pincode</label>
                    <input className="myn-input" placeholder="6-digit code" value={form.pincode} maxLength={6}
                      onChange={e => setForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div>
              <div className="myn-section-head">Saved Addresses</div>
              {form.address || form.city ? (
                <div style={{
                  border: '1px solid #eaeaec', borderRadius: 8, padding: '20px 24px',
                  position: 'relative', maxWidth: 500,
                }}>
                  <div style={{ display: 'inline-block', background: '#f4f4f5', color: '#282c3f', fontSize: '0.72rem', fontWeight: 700, borderRadius: 3, padding: '2px 10px', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Home
                  </div>
                  <div style={{ fontWeight: 700, color: '#282c3f', marginBottom: 4 }}>{form.name}</div>
                  <div style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {form.address}{form.address && (form.city || form.state || form.pincode) ? ', ' : ''}
                    {form.city}{form.city && (form.state || form.pincode) ? ', ' : ''}
                    {form.state} {form.pincode}
                  </div>
                  {form.mobile && (
                    <div style={{ color: '#888', fontSize: '0.85rem', marginTop: 8 }}>Mobile: {form.mobile}</div>
                  )}
                  <button
                    onClick={() => setActiveTab('profile')}
                    style={{
                      marginTop: 14, color: MYNTRA_PINK, border: `1px solid ${MYNTRA_PINK}`,
                      background: 'none', borderRadius: 4, padding: '6px 20px',
                      fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    Edit
                  </button>
                </div>
              ) : (
                <div className="myn-placeholder-wrap">
                  <div className="myn-placeholder-icon">📍</div>
                  <div className="myn-placeholder-text">No saved addresses</div>
                  <div className="myn-placeholder-sub">Add an address to make checkout faster</div>
                  <button onClick={() => setActiveTab('profile')} style={{ marginTop: 20, background: MYNTRA_PINK, color: '#fff', border: 'none', borderRadius: 4, padding: '11px 28px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Add Address
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SAVED CARDS */}
          {activeTab === 'cards' && (
            <div>
              <div className="myn-section-head">Saved Cards</div>
              <div className="myn-placeholder-wrap">
                <div className="myn-placeholder-icon">💳</div>
                <div className="myn-placeholder-text">No saved cards</div>
                <div className="myn-placeholder-sub">Save your debit / credit card details for a faster checkout experience</div>
              </div>
            </div>
          )}

          {/* COUPONS */}
          {activeTab === 'coupons' && (
            <div>
              <div className="myn-section-head">My Coupons</div>
              <div className="myn-placeholder-wrap">
                <div className="myn-placeholder-icon">🏷️</div>
                <div className="myn-placeholder-text">No coupons available</div>
                <div className="myn-placeholder-sub">Coupons and offers will appear here when available</div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <div className="myn-section-head">Notification Preferences</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Order Updates', desc: 'Shipping, delivery and order status alerts', key: 'orders' },
                  { label: 'Offers & Promotions', desc: 'Exclusive deals, flash sales and discount alerts', key: 'promos' },
                  { label: 'New Arrivals', desc: 'Be the first to know about new products', key: 'arrivals' },
                  { label: 'Wishlist Alerts', desc: 'Price drops on your saved items', key: 'wishlist' },
                  { label: 'Campaign Updates', desc: 'Group buy campaign milestones and results', key: 'campaigns' },
                ].map((item, idx) => (
                  <NotifToggle key={item.key} item={item} borderTop={idx !== 0} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotifToggle({ item, borderTop }) {
  const [on, setOn] = useState(true);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderTop: borderTop ? '1px solid #eaeaec' : 'none' }}>
      <div>
        <div style={{ fontWeight: 600, color: '#282c3f', marginBottom: 3 }}>{item.label}</div>
        <div style={{ fontSize: '0.82rem', color: '#94969f' }}>{item.desc}</div>
      </div>
      <div
        onClick={() => setOn(v => !v)}
        style={{
          width: 44, height: 24, borderRadius: 99,
          background: on ? '#2a5298' : '#d4d5d9',
          position: 'relative', cursor: 'pointer',
          transition: 'background 0.2s', flexShrink: 0, marginLeft: 20,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: on ? 22 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );
}
