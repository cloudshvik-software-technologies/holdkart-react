import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/index.js';
import { deleteProfileImage } from '../services/profile.service.js';
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
  { key: 'deactivate',    label: 'Deactivate Account' },
];

export default function Profile() {
  const { isAuthenticated, customer, updateCustomer, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]   = useState('profile');
  const [form, setForm]             = useState({ name: '', mobile: '', address: '', city: '', state: '', pincode: '', gender: '' });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [imgFile, setImgFile]       = useState(null);
  const [profileImg, setProfileImg] = useState('');
  const [uploading, setUploading]   = useState(false);

  // Deactivate account flow (Flipkart-style: soft deactivation, reversible by logging back in)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword]   = useState('');
  const [deactivating, setDeactivating]                = useState(false);
  const [deactivateWarnings, setDeactivateWarnings]    = useState(null);
  const [loadingWarnings, setLoadingWarnings]          = useState(false);

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

  const handleImageUpload = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('profileImage', file);
    setUploading(true);
    try {
      const res = await profileService.uploadProfileImage(fd);
      setProfileImg(res.imageUrl || '');
      setImgFile(null);
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    setUploading(true);
    try {
      await deleteProfileImage();
      setProfileImg('');
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenDeactivateModal = async () => {
    setLoadingWarnings(true);
    setShowDeactivateModal(true);
    try {
      const warnings = await profileService.getDeactivationWarnings();
      setDeactivateWarnings(warnings);
    } catch {
      setDeactivateWarnings({ pendingOrders: 0, activeDeals: 0 });
    } finally {
      setLoadingWarnings(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatePassword) {
      toast.error('Please enter your password to confirm.');
      return;
    }
    setDeactivating(true);
    try {
      await profileService.deactivateAccount(deactivatePassword);
      toast.success('Your account has been deactivated.');
      setShowDeactivateModal(false);
      setDeactivateWarnings(null);
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate account');
    } finally {
      setDeactivating(false);
      setDeactivatePassword('');
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
          width: 110px;
          height: 110px;
          margin: 0 auto 12px;
        }
        .myn-avatar-img {
          width: 110px;
          height: 110px;
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
            <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 12px' }}>
              {profileImg ? (
                <img src={getImgUrl(profileImg)} alt="Profile"
                  style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f4f4f5' }} />
              ) : (
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${MYNTRA_PINK}, #4f7ccc)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', color: '#fff', fontWeight: 700,
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
                  <div className="myn-avatar-wrap" style={{ position: 'relative' }}>
                    {profileImg ? (
                      <>
                        <img src={getImgUrl(profileImg)} alt="Profile" className="myn-avatar-img" />
                        {/* Delete ✕ */}
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          disabled={uploading}
                          title="Remove photo"
                          style={{
                            position: 'absolute', top: -8, right: -2,
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.22)', border: '1.5px solid rgba(255,255,255,0.7)',
                            color: 'rgba(255,255,255,0.85)', fontSize: '0.62rem', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', lineHeight: 1, padding: 0,
                          }}
                        >✕</button>
                      </>
                    ) : (
                      <div style={{
                        width: 110, height: 110, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${MYNTRA_PINK}, #4f7ccc)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.6rem', color: '#fff', fontWeight: 700,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                      }}>
                        {form.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#282c3f', marginBottom: 6 }}>Profile Photo</div>
                    <label style={{
                      display: 'inline-block', cursor: uploading ? 'not-allowed' : 'pointer',
                      border: `1px solid ${MYNTRA_PINK}`, color: MYNTRA_PINK,
                      borderRadius: 4, padding: '6px 16px', fontSize: '0.82rem', fontWeight: 700,
                      opacity: uploading ? 0.6 : 1,
                    }}>
                      {uploading ? 'Uploading…' : 'Change Photo'}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        disabled={uploading}
                        onChange={e => {
                          const f = e.target.files[0];
                          if (f) { setImgFile(f); handleImageUpload(f); }
                          e.target.value = '';
                        }} />
                    </label>
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
          {/* DEACTIVATE ACCOUNT */}
          {activeTab === 'deactivate' && (
            <div>
              <div className="myn-section-head">Deactivate Account</div>
              <div style={{
                border: '1px solid #fde2e2', background: '#fff8f8', borderRadius: 8,
                padding: '20px 24px', maxWidth: 560,
              }}>
                <div style={{ fontWeight: 700, color: '#282c3f', marginBottom: 10 }}>
                  What happens when you deactivate?
                </div>
                <ul style={{ color: '#555', fontSize: '0.88rem', lineHeight: 1.8, paddingLeft: 20, marginBottom: 16 }}>
                  <li>Your profile, orders and wishlist are hidden — not deleted.</li>
                  <li>You'll be logged out of all devices immediately.</li>
                  <li>Simply log back in anytime to reactivate your account.</li>
                </ul>
                <button
                  type="button"
                  onClick={handleOpenDeactivateModal}
                  style={{
                    background: '#fff', color: '#d92d20', border: '1px solid #d92d20',
                    borderRadius: 4, padding: '10px 24px', fontSize: '0.88rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Deactivate My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deactivate confirmation modal */}
      {showDeactivateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '28px 30px', width: '100%', maxWidth: 420 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#282c3f', marginBottom: 8 }}>
              Deactivate your account?
            </div>
            <p style={{ color: '#666', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: 18 }}>
              Enter your password to confirm. You can reactivate anytime simply by logging back in.
            </p>

            {loadingWarnings ? (
              <div style={{ color: '#999', fontSize: '0.84rem', marginBottom: 16 }}>Checking your account…</div>
            ) : (
              (deactivateWarnings?.pendingOrders > 0 || deactivateWarnings?.activeDeals > 0) && (
                <div style={{
                  background: '#fff8e1', border: '1px solid #fde68a', borderRadius: 6,
                  padding: '12px 14px', marginBottom: 18, fontSize: '0.84rem', color: '#92660a', lineHeight: 1.6,
                }}>
                  <strong>Heads up —</strong>{' '}
                  {deactivateWarnings.pendingOrders > 0 && (
                    <>you have {deactivateWarnings.pendingOrders} order{deactivateWarnings.pendingOrders > 1 ? 's' : ''} still in progress</>
                  )}
                  {deactivateWarnings.pendingOrders > 0 && deactivateWarnings.activeDeals > 0 && <> and </>}
                  {deactivateWarnings.activeDeals > 0 && (
                    <>{deactivateWarnings.activeDeals} active group deal{deactivateWarnings.activeDeals > 1 ? 's' : ''} you've joined</>
                  )}
                  . These will continue running, but you won't get updates while deactivated.
                </div>
              )
            )}

            <label className="myn-label">Password</label>
            <input
              type="password"
              className="myn-input"
              placeholder="Enter your password"
              value={deactivatePassword}
              onChange={e => setDeactivatePassword(e.target.value)}
              style={{ marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowDeactivateModal(false); setDeactivatePassword(''); setDeactivateWarnings(null); }}
                disabled={deactivating}
                style={{
                  background: '#fff', color: '#333', border: '1px solid #d4d5d9',
                  borderRadius: 4, padding: '10px 20px', fontSize: '0.86rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={deactivating}
                style={{
                  background: '#d92d20', color: '#fff', border: 'none',
                  borderRadius: 4, padding: '10px 20px', fontSize: '0.86rem', fontWeight: 700,
                  cursor: deactivating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  opacity: deactivating ? 0.7 : 1,
                }}
              >
                {deactivating ? 'Deactivating…' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
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