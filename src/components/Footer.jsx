import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(135deg,#1e3c72,#2a5298)',
      color: '#fff',
      marginTop: 60,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        .hk-footer * { box-sizing: border-box; }

        /* ── Footer links ── */
        .hk-footer-link {
          color: rgba(255,255,255,0.75);
          font-size: 0.88rem;
          text-decoration: none;
          transition: color 0.15s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .hk-footer-link:hover { color: #FF6B00; }

        /* ── Footer grid ── */
        .hk-footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          padding: 40px 40px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── Bottom bar ── */
        .hk-footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.15);
          padding: 16px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ── Section heading ── */
        .hk-footer-heading {
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 14px;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Logo brand ── */
        .hk-footer-brand {
          font-weight: 800;
          font-size: 1.3rem;
          margin-bottom: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .hk-footer-tagline {
          color: rgba(255,255,255,0.7);
          font-size: 0.85rem;
          line-height: 1.7;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Support info items ── */
        .hk-footer-support-item {
          color: rgba(255,255,255,0.75);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           RESPONSIVE BREAKPOINTS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        /* ── Tablet (≤ 1024px) ── */
        @media (max-width: 1024px) {
          .hk-footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 28px;
            padding: 32px 28px 24px;
          }
          .hk-footer-bottom {
            padding: 14px 28px;
          }
        }

        /* ── Small tablet / large phone (≤ 768px) ── */
        @media (max-width: 768px) {
          .hk-footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            padding: 28px 20px 20px;
          }
          .hk-footer-bottom {
            padding: 14px 20px;
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }
          .hk-footer-brand { font-size: 1.15rem; }
          .hk-footer-tagline { font-size: 0.82rem; }
          .hk-footer-heading { font-size: 0.88rem; margin-bottom: 10px; }
          .hk-footer-link { font-size: 0.83rem; }
          .hk-footer-support-item { font-size: 0.82rem; }
        }

        /* ── Phone (≤ 480px) ── */
        @media (max-width: 480px) {
          .hk-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 24px 16px 16px;
          }
          /* Brand section spans full width on mobile */
          .hk-footer-brand-col {
            grid-column: 1 / -1;
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }
          .hk-footer-bottom {
            padding: 12px 16px;
          }
          .hk-footer-copyright {
            font-size: 0.75rem !important;
          }
        }

        /* ── Very small phones (≤ 360px) ── */
        @media (max-width: 360px) {
          .hk-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            padding: 20px 14px 14px;
          }
          .hk-footer-brand-col {
            grid-column: 1 / -1;
          }
          .hk-footer-bottom {
            padding: 12px 14px;
          }
        }
      `}</style>

      <div className="hk-footer-grid">

        {/* ── Brand column ── */}
        <div className="hk-footer-brand-col">
          <div>
            {/* ── Brand column ── */}
<div className="hk-footer-brand-col">
  <div>
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, textDecoration: 'none' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: 'linear-gradient(135deg,#FF6B00,#E85D04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', boxShadow: '0 3px 10px rgba(255,107,0,0.35)',
      }}>🛒</div>
      <div className="hk-footer-brand">
        Hold<span style={{ color: '#FF6B00' }}>Kart</span>
      </div>
    </Link>
    <p className="hk-footer-tagline">
      Premium refurbished electronics with quality assurance and great savings.
    </p>
    {/* social icons unchanged */}
  </div>
</div>


            {/* Social icons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              {[
                { label: 'Facebook',  icon: 'f',  bg: '#1877f2' },
                { label: 'Twitter',   icon: '𝕏',  bg: '#000' },
                { label: 'Instagram', icon: '📸', bg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' },
              ].map(s => (
                <div
                  key={s.label}
                  title={s.label}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: s.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', color: '#fff', fontWeight: 800,
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Shop column ── */}
        <div>
          <div className="hk-footer-heading">Shop</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['/',          'Home'],
              ['/products',  'All Products'],
              ['/campaigns', 'Hold Deals'],
              ['/wishlist',  'Wishlist'],
              ['/cart',      'My Cart'],
            ].map(([to, label]) => (
              <Link key={to} to={to} className="hk-footer-link">{label}</Link>
            ))}
          </div>
        </div>

        {/* ── Account column ── */}
        <div>
          <div className="hk-footer-heading">Account</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['/orders',        'My Orders'],
              ['/profile',       'Profile'],
              ['/notifications', 'Notifications'],
              ['/complaints',    'Complaints'],
            ].map(([to, label]) => (
              <Link key={to} to={to} className="hk-footer-link">{label}</Link>
            ))}
          </div>
        </div>

        {/* ── Support column ── */}
        <div>
          <div className="hk-footer-heading">Support</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="hk-footer-support-item">
              <span>✉️</span>
              <span>support@holdkart.com</span>
            </div>
            <div className="hk-footer-support-item">
              <span>📞</span>
              <span>+91 1800-XXX-XXXX</span>
            </div>
            <div className="hk-footer-support-item">
              <span>🕐</span>
              <span>Mon–Sat, 9AM–6PM</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,107,0,0.15)', borderRadius: 8,
                padding: '6px 12px', border: '1px solid rgba(255,107,0,0.3)',
              }}>
                <span style={{ fontSize: '0.7rem' }}>🔒</span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  Secure Payments
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="hk-footer-bottom">
        <p className="hk-footer-copyright" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', margin: 0 }}>
          © {new Date().getFullYear()} HoldKart. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            ['/privacy',  'Privacy Policy'],
            ['/terms',    'Terms of Use'],
            ['/sitemap',  'Sitemap'],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="hk-footer-link" style={{ fontSize: '0.78rem' }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}