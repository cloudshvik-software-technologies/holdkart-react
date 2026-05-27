import { useState, useEffect } from 'react';
  import { Link, useNavigate, useLocation } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext.jsx';
  import { authService } from '../services/index.js';
  import { getNotifications } from '../services/notification.service.js';
  import toast from 'react-hot-toast';

  export default function Header() {
    const { customer, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [unread, setUnread] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
      const onScroll = () => setScrolled(window.scrollY > 10);
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

    const handleLogout = async () => {
      try { await authService.logout({ customerId: customer?.id }); } catch {}
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    };

    const isActive = (p) => location.pathname === p;

    const navStyle = (p) => ({
      color: isActive(p) ? '#fff' : 'rgba(255,255,255,0.8)',
      padding: '8px 14px',
      borderRadius: 8,
      fontSize: '0.9rem',
      fontWeight: isActive(p) ? 600 : 500,
      background: isActive(p) ? 'rgba(255,255,255,0.18)' : 'transparent',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      whiteSpace: 'nowrap',
    });

    return (
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'linear-gradient(135deg,#1e3c72,#2a5298)',
        boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.25)' : '0 1px 8px rgba(0,0,0,0.15)',
        transition: 'box-shadow 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo — clicking takes you to dashboard if logged in, or landing page */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ background: 'linear-gradient(135deg,#fff,#e0e8ff)', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#1e3c72', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>H</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
              Hold<span style={{ color: '#93c5fd' }}>Kart</span>
            </span>
          </Link>

          {/* Authenticated nav */}
          {isAuthenticated ? (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Link to="/products"  style={navStyle('/products')}>Products</Link>
              <Link to="/campaigns" style={navStyle('/campaigns')}>🎯 Deals</Link>
              <Link to="/wishlist"  style={navStyle('/wishlist')}>♡ Wishlist</Link>
              <Link to="/orders"    style={navStyle('/orders')}>My Orders</Link>
              <Link to="/cart" style={{ ...navStyle('/cart'), position: 'relative' }}>
                🛒 Cart
              </Link>
              <Link to="/complaints" style={navStyle('/complaints')}>Support</Link>

              {/* Notification bell */}
              <Link to="/notifications" style={{ ...navStyle('/notifications'), position: 'relative' }}>
                🔔
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 17, height: 17, fontSize: '0.62rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              {/* Profile */}
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: '0.88rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)', marginLeft: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#93c5fd,#3b82f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  {customer?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span>{customer?.name?.split(' ')[0]}</span>
              </Link>

              <button onClick={handleLogout} style={{ marginLeft: 6, background: 'rgba(239,68,68,0.18)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '8px 14px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}>
                Logout
              </button>
            </nav>
          ) : (
            /* Unauthenticated: ONLY Login and Register */
            <nav style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to="/login" style={{ color: 'rgba(255,255,255,0.9)', padding: '8px 20px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.3)', transition: 'all 0.2s' }}>
                Login
              </Link>
              <Link to="/register" style={{ background: '#fff', color: '#1e3c72', borderRadius: 8, padding: '8px 22px', fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}>
                Register
              </Link>
            </nav>
          )}
        </div>
      </header>
    );
  }