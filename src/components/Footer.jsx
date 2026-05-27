import { Link } from 'react-router-dom';

  export default function Footer() {
    return (
      <footer style={{ background: 'linear-gradient(135deg,#1e3c72,#2a5298)', color: '#fff', padding: '40px 24px 20px', marginTop: 60 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 10 }}>HoldKart</div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', lineHeight: 1.7 }}>Premium refurbished electronics with quality assurance and great savings.</p>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Shop</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['/',  'Home'], ['/products', 'All Products'], ['/campaigns', 'Hold Deals'], ['/wishlist', 'Wishlist']].map(([to, label]) => (
                  <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem' }}>{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['/orders', 'My Orders'], ['/profile', 'Profile'], ['/notifications', 'Notifications'], ['/complaints', 'Complaints']].map(([to, label]) => (
                  <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem' }}>{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Support</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>support@holdkart.com</span>
                <span>+91 1800-XXX-XXXX</span>
                <span>Mon-Sat, 9AM-6PM</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
            © {new Date().getFullYear()} HoldKart. All rights reserved.
          </div>
        </div>
      </footer>
    );
  }
  