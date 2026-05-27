import { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { profileService } from '../services/index.js';
  import { useAuth } from '../context/AuthContext.jsx';
  import toast from 'react-hot-toast';

  const CUSTOMER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

  export default function Profile() {
    const { isAuthenticated, customer, updateCustomer } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', mobile: '', address: '', city: '', state: '', pincode: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imgFile, setImgFile] = useState(null);
    const [profileImg, setProfileImg] = useState('');

    useEffect(() => {
      if (!isAuthenticated) { navigate('/login'); return; }
      profileService.getProfile().then(p => {
        if (p) {
          setForm({ name: p.name || '', mobile: p.mobile || '', address: p.address || '', city: p.city || '', state: p.state || '', pincode: p.pincode || '' });
          setProfileImg(p.profile_image || '');
        }
      }).catch(() => {}).finally(() => setLoading(false));
    }, [isAuthenticated]);

    const handleSave = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        await profileService.updateProfile({ ...form });
        updateCustomer({ name: form.name });
        toast.success('Profile updated!');
      } catch(e) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setSaving(false); }
    };

    const handleImageUpload = async () => {
      if (!imgFile) return;
      const fd = new FormData();
      fd.append('profileImage', imgFile);
      try {
        const res = await profileService.uploadProfileImage(fd);
        setProfileImg(res.imageUrl || '');
        toast.success('Profile image updated!');
      } catch { toast.error('Failed to upload image'); }
    };

    const getImgUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return CUSTOMER_URL + url;
    };

    if (loading) return <div className="page-wrap">Loading…</div>;

    return (
      <div className="page-wrap">
        <h1 className="page-title">My Profile</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--blue-pale)', margin: '0 auto 16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profileImg ? <img src={getImgUrl(profileImg)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                <span style={{ fontSize: '2.5rem', color: 'var(--blue)', fontWeight: 700 }}>{form.name?.[0]?.toUpperCase() || 'U'}</span>}
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{form.name}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20 }}>{customer?.email}</p>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Change Photo</label>
              <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])} />
            </div>
            {imgFile && <button className="btn-primary btn-sm" onClick={handleImageUpload} style={{ width: '100%', justifyContent: 'center' }}>Upload Photo</button>}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Personal Information</h3>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group"><label>Full Name</label><input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="form-group"><label>Mobile</label><input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label>Address</label><textarea rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-group"><label>City</label><input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
                <div className="form-group"><label>State</label><input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} /></div>
              </div>
              <div className="form-group" style={{ maxWidth: 180 }}><label>Pincode</label><input value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} /></div>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  