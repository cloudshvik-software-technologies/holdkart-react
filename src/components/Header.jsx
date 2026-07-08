import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/index.js';
import { getNotifications } from '../services/notification.service.js';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { name: 'Automotive',  path: '/products?category=Automotive' },
  { name: 'Beauty',      path: '/products?category=Beauty' },
  { name: 'Books',       path: '/products?category=Books' },
  { name: 'Electronics', path: '/products?category=Electronics' },
  { name: 'Fashion',     path: '/products?category=Fashion' },
  { name: 'Grocery',     path: '/products?category=Grocery' },
  { name: 'Health',      path: '/products?category=Health' },
  { name: 'Sports',      path: '/products?category=Sports' },
  { name: 'Toys',        path: '/products?category=Toys' },
];

const AUTH_PAGES = ['/login', '/register', '/forgot', '/reset-password'];

export default function Header() {
  const { customer, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (AUTH_PAGES.some(p => location.pathname === p)) return null;

  const [unread, setUnread]             = useState(0);
  const [scrolled, setScrolled]         = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [accountOpen, setAccountOpen]   = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetch = async () => {
      try {
        const list = await getNotifications();
        setUnread(Array.isArray(list) ? list.filter(n => !n.is_read).length : 0);
      } catch {}
    };
    fetch();
    const iv = setInterval(fetch, 60000);
    return () => clearInterval(iv);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try { await authService.logout({ customerId: customer?.id }); } catch {}
    logout();
    navigate('/');
    toast.success('Logged out successfully');
    setAccountOpen(false);
    setMobileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/products?search=' + encodeURIComponent(searchQuery.trim()));
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path) => {
    const fullCurrent = location.pathname + location.search;
    if (fullCurrent === path) return true;
    if (path === '/products' && location.pathname === '/products' && !location.search) return true;
    return false;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        .hk-header * { box-sizing: border-box; }

        /* ── Category strip button ── */
        .hk-cat-btn {
          background: none; border: none; cursor: pointer;
          padding: 0 15px; height: 38px;
          font-size: 0.82rem; font-weight: 600;
          color: rgba(255,255,255,0.85);
          white-space: nowrap;
          display: flex; align-items: center; gap: 5px;
          border-bottom: 2.5px solid transparent;
          transition: color 0.15s, border-color 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: 0.01em;
        }
        .hk-cat-btn:hover, .hk-cat-btn.active {
          color: #fff;
          border-bottom-color: #FF6B00;
        }

        /* ── Dropdown item ── */
        .hk-drop-item {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 18px; font-size: 0.88rem;
          color: #1A1A2E; text-decoration: none;
          transition: background 0.12s, color 0.12s;
          cursor: pointer; border-radius: 8px;
          margin: 2px 6px; font-weight: 500;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .hk-drop-item:hover { background: #FFF3E0; color: #FF6B00; }

        /* ── Search input ── */
        .hk-search-inp {
          flex: 1; border: none; padding: 0 16px;
          font-size: 0.95rem; background: #fff;
          color: #1A1A2E; font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 400;
        }
        .hk-search-inp:focus { outline: none; }
        .hk-search-inp::placeholder { color: #9CA3AF; }

        /* ── Nav action button ── */
        .hk-nav-action {
          display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
          padding: 5px 10px; border-radius: 6px;
          border: 1.5px solid transparent;
          transition: border-color 0.15s, background 0.15s;
          text-decoration: none; background: none; cursor: pointer;
        }
        .hk-nav-action:hover { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.07); }
        .hk-nav-action .top { font-size: 0.68rem; color: rgba(255,255,255,0.6); line-height: 1.2; }
        .hk-nav-action .bot { font-size: 0.88rem; font-weight: 700; color: #fff; line-height: 1.2; font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── Hide scrollbar on category strip ── */
        .hk-cat-strip::-webkit-scrollbar { display: none; }
        .hk-cat-strip { scrollbar-width: none; }

        /* ── Mobile menu overlay ── */
        .hk-mobile-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 1100;
          background: rgba(0,0,0,0.5);
        }
        .hk-mobile-overlay.open { display: block; }

        /* ── Mobile drawer ── */
        .hk-mobile-drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 85%; max-width: 320px; z-index: 1200;
          background: #fff; overflow-y: auto;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 4px 0 24px rgba(0,0,0,0.18);
        }
        .hk-mobile-drawer.open { transform: translateX(0); }

        .hk-mobile-drawer::-webkit-scrollbar { display: none; }
        .hk-mobile-drawer { scrollbar-width: none; }

        /* ── Mobile icon button ── */
        .hk-icon-btn {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 8px; border-radius: 8px;
          transition: background 0.15s;
          color: white; position: relative;
        }
        .hk-icon-btn:hover { background: rgba(255,255,255,0.12); }

        /* ── Mobile search bar (shown in second row on mobile) ── */
        .hk-mobile-search-row {
          display: none;
          padding: 8px 12px;
          background: #2a5298;
          border-top: 1px solid rgba(255,255,255,0.1);
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }
        .hk-search-inp { min-width: 0; }

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           RESPONSIVE BREAKPOINTS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        /* ── Tablets (≤ 1024px) ── */
        @media (max-width: 1024px) {
          .hk-deliver-to { display: none !important; }
          .hk-returns-orders { display: none !important; }
        }

        /* ── Small tablets & large phones (≤ 768px) ── */
        @media (max-width: 768px) {
          /* Header main row */
          .hk-header-row { padding: 0 12px !important; gap: 10px !important; height: 54px !important; }

          /* Hide desktop search in main row — show mobile search row instead */
          .hk-desktop-search { display: none !important; }
          .hk-mobile-search-row { display: flex !important; }

          /* Hide text labels on action buttons; keep icons */
          .hk-nav-action .top,
          .hk-nav-action .bot { display: none !important; }
          .hk-nav-action {
            padding: 6px !important;
            border: none !important;
            flex-direction: row !important;
            align-items: center !important;
          }

          /* Hamburger visible */
          .hk-hamburger { display: flex !important; }

          /* Desktop account dropdown hidden; use drawer */
          .hk-desktop-account { display: none !important; }

          /* Category strip hidden on mobile (in drawer instead) */
          .hk-cat-strip-container { display: none !important; }

          /* Logo sub text hidden */
          .hk-header-logo-sub { display: none !important; }

          /* Cart label hidden */
          .hk-cart-label { display: none !important; }

          /* Mobile search row */
          .hk-mobile-search-row form { width: 100%; }
        }

        /* ── Phones (≤ 480px) ── */
        @media (max-width: 480px) {
          .hk-header-row { padding: 0 8px !important; gap: 6px !important; height: 50px !important; }
          .hk-mobile-search-row { padding: 6px 8px !important; }

          /* Tighter icon buttons */
          .hk-icon-btn { padding: 6px !important; }

          /* Account dropdown panel if ever shown */
          .hk-account-dropdown-panel { width: calc(100vw - 16px) !important; right: -4px !important; }

          /* Logo size reduced */
          .hk-logo-icon { width: 30px !important; height: 30px !important; font-size: 0.9rem !important; }
          .hk-logo-text { font-size: 1rem !important; }
        }

        /* ── Very small phones (≤ 360px) ── */
        @media (max-width: 360px) {
          .hk-header-row { padding: 0 6px !important; gap: 4px !important; }
          .hk-mobile-search-row { padding: 5px 6px !important; }
          .hk-logo-text { font-size: 0.92rem !important; }
          .hk-icon-btn { padding: 5px !important; }
          .hk-nav-action { padding: 4px !important; }
        }

        /* ── Desktop — hamburger hidden ── */
        @media (min-width: 769px) {
          .hk-hamburger { display: none !important; }
          .hk-desktop-search { display: flex !important; }
          .hk-mobile-search-row { display: none !important; }
          .hk-desktop-account { display: block !important; }
          .hk-cat-strip-container { display: block !important; }
        }
      `}</style>

      {/* ── MOBILE OVERLAY ── */}
      <div
        className={`hk-mobile-overlay${mobileMenuOpen ? ' open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* ── MOBILE DRAWER ── */}
      <div className={`hk-mobile-drawer${mobileMenuOpen ? ' open' : ''}`}>
        {/* Drawer header */}
        <div style={{
          background: '#2a5298', padding: '16px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#FF6B00,#E85D04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
            }}>🛒</div>
            <span style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 900, fontSize: '1.1rem', color: '#fff',
            }}>
              Hold<span style={{ color: 'rgb(240 127 34)' }}>Kart</span>
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#fff', padding: 4,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* User greeting */}
        <div style={{
          padding: '12px 16px', background: '#f0f4ff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {isAuthenticated ? (
            <>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg,#FF6B00,#E85D04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: '1rem',
                fontFamily: "'Plus Jakarta Sans',sans-serif", flexShrink: 0,
              }}>
                {customer?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1A1A2E', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {customer?.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>HoldKart Member</div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1A1A2E', fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>
                Hello, welcome!
              </div>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'inline-block',
                  background: '#FF6B00', color: '#fff',
                  borderRadius: 8, padding: '8px 20px',
                  fontWeight: 800, fontSize: '0.88rem',
                  textDecoration: 'none',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                Sign In
              </Link>
              <span style={{ marginLeft: 10, fontSize: '0.8rem', color: '#6b7280' }}>
                New?{' '}
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ color: '#FF6B00', fontWeight: 700, textDecoration: 'none' }}>
                  Register
                </Link>
              </span>
            </div>
          )}
        </div>

        {/* Categories section */}
        <div style={{ padding: '12px 0 4px' }}>
          <div style={{ padding: '4px 16px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Shop by Category
          </div>
          <button
            onClick={() => { navigate('/products'); setMobileMenuOpen(false); }}
            style={drawerItem(isActive('/products'))}
          >
            <span>☰</span> All Products
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => { navigate(cat.path); setMobileMenuOpen(false); }}
              style={drawerItem(isActive(cat.path))}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Quick links section */}
        <div style={{ padding: '4px 0', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ padding: '12px 16px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Quick Links
          </div>
          {[
            { icon: '🎯', label: 'Hold Deals',    path: '/campaigns' },
            { icon: '❤️', label: 'Wishlist',      path: '/wishlist' },
            { icon: '📦', label: 'My Orders',     path: '/orders' },
            { icon: '🔔', label: 'Notifications', path: '/notifications', badge: unread > 0 ? unread : null },
            { icon: '👤', label: 'My Profile',    path: '/profile' },
            { icon: '💬', label: 'Support',       path: '/complaints' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => {
                if (!isAuthenticated) { toast.error('Please sign in to continue'); setMobileMenuOpen(false); return; }
                navigate(item.path); setMobileMenuOpen(false);
              }}
              style={{ ...drawerItem(isActive(item.path)), justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </span>
              {item.badge && (
                <span style={{ background: '#FF6B00', color: '#fff', borderRadius: 99, fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px' }}>{item.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Logout */}
        {isAuthenticated && (
          <div style={{ padding: '8px 0 24px', borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', color: '#ef4444', fontWeight: 700,
                fontSize: '0.9rem', fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>🚪</span>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN HEADER ── */}
      <header className="hk-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: '#2a5298',
        boxShadow: scrolled ? '0 2px 16px rgba(15,37,87,0.35)' : 'none',
        transition: 'box-shadow 0.3s',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ── MAIN ROW ── */}
        <div className="hk-header-row" style={{
          display: 'flex', alignItems: 'center', gap: 16,
          height: 62, padding: '0 28px',
          maxWidth: 1600, margin: '0 auto',
        }}>

          {/* ── HAMBURGER (mobile only) ── */}
          <button
            className="hk-hamburger hk-icon-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* ── LOGO ── */}
          <Link
            to={isAuthenticated ? '/home' : '/'}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              textDecoration: 'none', flexShrink: 0,
              padding: '5px 8px', borderRadius: 8,
              border: '1.5px solid transparent',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div className="hk-logo-icon" style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgb(240 127 34)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', boxShadow: '0 3px 10px rgba(255,107,0,0.4)',
              flexShrink: 0,
            }}>🛒</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span className="hk-logo-text" style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 900, fontSize: '1.2rem',
                color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1,
              }}>
                Hold<span style={{ color: '#FF6B00' }}>Kart</span>
              </span>
              <span className="hk-header-logo-sub" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.58rem', letterSpacing: '0.06em', fontWeight: 500 }}>
                INDIA'S SMART SHOP
              </span>
            </div>
          </Link>

          {/* ── DELIVER TO (desktop only) ── */}
          <div className="hk-nav-action hk-deliver-to" style={{ flexShrink: 0 }}>
            <span className="top">Deliver to</span>
            <span className="bot" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
                <path d="M5 0C2.79 0 1 1.79 1 4c0 3 4 9 4 9s4-6 4-9c0-2.21-1.79-4-4-4zm0 5.5A1.5 1.5 0 1 1 5 2.5a1.5 1.5 0 0 1 0 3z" fill="white"/>
              </svg>
              India
            </span>
          </div>

          {/* ── SEARCH BAR (desktop) ── */}
          <form className="hk-desktop-search" onSubmit={handleSearch} style={{
            flex: 1, display: 'flex', maxWidth: 700,
            height: 44, borderRadius: 10, overflow: 'hidden',
            border: `2px solid ${searchFocused ? '#FF6B00' : 'transparent'}`,
            boxShadow: searchFocused ? '0 0 0 3px rgba(255,107,0,0.15)' : '0 1px 6px rgba(0,0,0,0.2)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            <input
              className="hk-search-inp"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search for products, brands and more…"
            />
            <button type="submit" style={{
              width: 52, background: 'rgb(240 127 34)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s', flexShrink: 0,
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#E85D04'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgb(240 127 34)'}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>

          {/* ── RIGHT ACTIONS ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>

            {isAuthenticated ? (
              <>
                {/* Account dropdown (desktop) */}
                <div ref={accountRef} className="hk-desktop-account" style={{ position: 'relative' }}>
                  <button
                    onClick={() => setAccountOpen(o => !o)}
                    className="hk-nav-action"
                    style={{
                      borderColor: accountOpen ? 'rgba(255,255,255,0.4)' : 'transparent',
                      background: accountOpen ? 'rgba(255,255,255,0.08)' : 'none',
                    }}
                  >
                    <span className="top">Hello, {customer?.name?.split(' ')[0] || 'User'}</span>
                    <span className="bot" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Account &amp; Lists
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: 'transform 0.2s', transform: accountOpen ? 'rotate(180deg)' : 'none' }}>
                        <path d="M1 1l4 4 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </button>

                  {accountOpen && (
                    <div className="hk-account-dropdown-panel" style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      width: 240, background: '#fff', borderRadius: 12,
                      boxShadow: '0 12px 48px rgba(0,0,0,0.18)', zIndex: 9999,
                      paddingTop: 10, paddingBottom: 10,
                      border: '1px solid #F0F0F0',
                    }}>
                      <div style={{ padding: '10px 18px 14px', borderBottom: '1px solid #F5F5F5', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#FF6B00,#E85D04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1rem', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            {customer?.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1A1A2E', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{customer?.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 1 }}>HoldKart Member</div>
                          </div>
                        </div>
                      </div>

                      {[
                        { icon: '👤', label: 'My Profile',      to: '/profile' },
                        { icon: '📦', label: 'My Orders',       to: '/orders' },
                        { icon: '❤️', label: 'Wishlist',        to: '/wishlist' },
                        { icon: '🛒', label: 'My Cart',         to: '/cart' },
                        { icon: '🎯', label: 'Hold Deals',      to: '/campaigns' },
                        { icon: '🔔', label: 'Notifications',   to: '/notifications', badge: unread > 0 ? unread : null },
                        { icon: '💬', label: 'Support',         to: '/complaints' },
                        { icon: '📄', label: 'All Products',    to: '/products' },
                      ].map(item => (
                        <Link key={item.label} to={item.to} className="hk-drop-item" onClick={() => setAccountOpen(false)}>
                          <span style={{ fontSize: '1.05rem', width: 22, textAlign: 'center' }}>{item.icon}</span>
                          <span>{item.label}</span>
                          {item.badge && (
                            <span style={{ marginLeft: 'auto', background: '#FF6B00', color: '#fff', borderRadius: 99, fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px' }}>{item.badge}</span>
                          )}
                        </Link>
                      ))}

                      <div style={{ borderTop: '1px solid #F5F5F5', marginTop: 6, paddingTop: 6 }}>
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%', background: 'none', border: 'none',
                            display: 'flex', alignItems: 'center', gap: 11,
                            padding: '10px 18px', borderRadius: 8, cursor: 'pointer',
                            color: '#ef4444', fontWeight: 700, fontSize: '0.88rem',
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <span style={{ fontSize: '1.05rem', width: 22, textAlign: 'center' }}>🚪</span>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Orders (desktop) */}
                <Link to="/orders" className="hk-nav-action hk-returns-orders" style={{ textDecoration: 'none' }}>
                  <span className="top">Returns &</span>
                  <span className="bot">My Orders</span>
                </Link>

                {/* Notifications icon */}
                <Link to="/notifications" className="hk-icon-btn" style={{ textDecoration: 'none' }}>
                  <div style={{ position: 'relative' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {unread > 0 && (
                      <span style={{
                        position: 'absolute', top: -4, right: -5,
                        background: '#FF6B00', color: '#fff', borderRadius: 99,
                        fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px',
                        lineHeight: 1.4, minWidth: 16, textAlign: 'center',
                        border: '1.5px solid #2a5298',
                      }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Cart */}
                <Link to="/cart" className="hk-nav-action" style={{
                  textDecoration: 'none', flexDirection: 'row', alignItems: 'center', gap: 8,
                  background: 'rgba(255,107,0,0.12)', border: '1.5px solid rgba(255,107,0,0.3)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,0,0.22)'; e.currentTarget.style.borderColor = '#FF6B00'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,0,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,107,0,0.3)'; }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span className="hk-cart-label" style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FF6B00', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Cart</span>
                </Link>
              </>
            ) : (
              /* ── GUEST ── */
              <>
                {/* Account (desktop) */}
                <div ref={accountRef} className="hk-desktop-account" style={{ position: 'relative' }}>
                  <button
                    onClick={() => setAccountOpen(o => !o)}
                    className="hk-nav-action"
                    style={{
                      borderColor: accountOpen ? 'rgba(255,255,255,0.4)' : 'transparent',
                      background: accountOpen ? 'rgba(255,255,255,0.08)' : 'none',
                    }}
                  >
                    <span className="top">Hello, sign in</span>
                    <span className="bot" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Account &amp; Lists
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: 'transform 0.2s', transform: accountOpen ? 'rotate(180deg)' : 'none' }}>
                        <path d="M1 1l4 4 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </button>

                  {accountOpen && (
                    <div className="hk-account-dropdown-panel" style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      width: 300, background: '#fff', borderRadius: 14,
                      boxShadow: '0 16px 56px rgba(0,0,0,0.18)', zIndex: 9999,
                      padding: '18px 18px 12px',
                      border: '1px solid #EBEBEB',
                    }}>
                      <Link
                        to="/login"
                        onClick={() => setAccountOpen(false)}
                        style={{
                          display: 'block', textAlign: 'center',
                          background: '#FF6B00', color: '#fff',
                          borderRadius: 9, padding: '11px 0',
                          fontWeight: 800, fontSize: '0.95rem',
                          textDecoration: 'none', marginBottom: 10,
                          fontFamily: "'Plus Jakarta Sans',sans-serif",
                          boxShadow: '0 3px 10px rgba(255,107,0,0.3)',
                        }}
                      >
                        Sign in
                      </Link>
                      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#6b7280', margin: '0 0 14px' }}>
                        New customer?{' '}
                        <Link to="/register" onClick={() => setAccountOpen(false)} style={{ color: '#FF6B00', fontWeight: 700, textDecoration: 'none' }}>
                          Start here
                        </Link>
                      </p>
                      <div style={{ borderTop: '1px solid #F0F0F0', marginBottom: 12 }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, paddingLeft: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            Your Lists
                          </div>
                          {[{ icon: '❤️', label: 'Wishlist' }, { icon: '🎯', label: 'Hold Deals' }].map(item => (
                            <button key={item.label} onClick={() => { setAccountOpen(false); toast.error('Please sign in to continue'); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', borderRadius: 7, color: '#1A1A2E', fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif", width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#FFF3E0'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ fontSize: '1rem', width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, paddingLeft: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            Your Account
                          </div>
                          {[{ icon: '👤', label: 'Your Account' }, { icon: '📦', label: 'Your Orders' }, { icon: '🔔', label: 'Notifications' }, { icon: '💬', label: 'Support' }].map(item => (
                            <button key={item.label} onClick={() => { setAccountOpen(false); toast.error('Please sign in to continue'); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', borderRadius: 7, color: '#1A1A2E', fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif", width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#FFF3E0'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ fontSize: '1rem', width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Returns (desktop) */}
                <button onClick={() => toast.error('Please sign in to view your orders')} className="hk-nav-action hk-returns-orders" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="top">Returns &</span>
                  <span className="bot">My Orders</span>
                </button>

                {/* Cart */}
                <button
                  onClick={() => navigate('/cart')}
                  className="hk-nav-action"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, background: 'rgba(255,107,0,0.12)', border: '1.5px solid rgba(255,107,0,0.3)', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,0,0.22)'; e.currentTarget.style.borderColor = '#FF6B00'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,0,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,107,0,0.3)'; }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span className="hk-cart-label" style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FF6B00', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Cart</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── MOBILE SEARCH ROW (shown only on mobile, below main row) ── */}
        <div className="hk-mobile-search-row">
          <form onSubmit={handleSearch} style={{
            width: '100%', display: 'flex',
            height: 40, borderRadius: 8, overflow: 'hidden',
            border: `2px solid ${searchFocused ? '#FF6B00' : 'transparent'}`,
            boxShadow: searchFocused ? '0 0 0 3px rgba(255,107,0,0.15)' : '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            <input
              className="hk-search-inp"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search products, brands…"
              style={{ fontSize: '0.9rem' }}
            />
            <button type="submit" style={{
              width: 46, background: '#FF6B00', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>
        </div>

        {/* ── CATEGORY STRIP (desktop only) ── */}
        <div className="hk-cat-strip-container" style={{ background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div
            className="hk-cat-strip"
            style={{
              display: 'flex', alignItems: 'center',
              overflowX: 'auto', padding: '0 28px',
              maxWidth: 1600, margin: '0 auto', gap: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-evenly' }}>
              <button
                className={`hk-cat-btn${isActive('/products') ? ' active' : ''}`}
                onClick={() => navigate('/products')}
                style={{ padding: '0 8px' }}
              >
                ☰ All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  className={`hk-cat-btn${isActive(cat.path) ? ' active' : ''}`}
                  onClick={() => navigate(cat.path)}
                  style={{ padding: '0 8px' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.15)', margin: '0 8px', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {[
                { label: '🎯 Hold Deals',    path: '/campaigns' },
                { label: '❤️ Wishlist',      path: '/wishlist' },
                { label: '💬 Support',       path: '/complaints' },
                { label: '🔔 Notifications', path: '/notifications' },
              ].map(l => (
                <button
                  key={l.label}
                  className={`hk-cat-btn${isActive(l.path) ? ' active' : ''}`}
                  onClick={() => isAuthenticated ? navigate(l.path) : toast.error('Please sign in to continue')}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

/* ── Helper: drawer item style ── */
function drawerItem(active = false) {
  return {
    width: '100%', background: active ? '#FFF3E0' : 'none',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '13px 16px',
    color: active ? '#FF6B00' : '#1A1A2E',
    fontSize: '0.9rem', fontWeight: active ? 700 : 500,
    fontFamily: "'Plus Jakarta Sans',sans-serif",
    textAlign: 'left',
    borderLeft: active ? '3px solid #FF6B00' : '3px solid transparent',
    transition: 'background 0.12s, color 0.12s',
  };
}