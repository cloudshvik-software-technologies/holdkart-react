import { useState, useEffect } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import ProductCard from '../components/ProductCard.jsx';
  import { productService, orderService, wishlistService, campaignService } from '../services/index.js';
  import { useAuth } from '../context/AuthContext.jsx';

  export default function Home() {
    const { customer } = useAuth();
    const navigate = useNavigate();

    const [featured, setFeatured]     = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders]         = useState([]);
    const [campaigns, setCampaigns]   = useState([]);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [loading, setLoading]       = useState(true);

    useEffect(() => {
      (async () => {
        try {
          const [f, c, o, wl, camp] = await Promise.all([
            productService.getFeatured().catch(() => []),
            productService.getCategories().catch(() => []),
            orderService.listOrders().catch(() => []),
            wishlistService.getWishlist().catch(() => []),
            campaignService.listCampaigns().catch(() => []),
          ]);
          setFeatured(Array.isArray(f) ? f.slice(0, 8) : []);
          setCategories(Array.isArray(c) ? c : []);
          setOrders(Array.isArray(o) ? o.slice(0, 3) : []);
          setWishlistCount(Array.isArray(wl) ? wl.length : 0);
          setCampaigns(Array.isArray(camp) ? camp.slice(0, 2) : []);
        } catch {} finally { setLoading(false); }
      })();
    }, []);

    const totalSpent  = orders.reduce((s, o) => s + (o.order_amount || 0), 0);
    const totalOrders = orders.length;

    const catIcons = { Mobile: '📱', Laptop: '💻', Tablet: '📟', Camera: '📷', Audio: '🎧', Gaming: '🎮', TV: '📺', Watch: '⌚', Accessories: '🔌', Others: '📦' };

    const statusColor = { Pending: '#ca8a04', Confirmed: '#2563eb', Processing: '#7c3aed', Shipped: '#0891b2', Delivered: '#16a34a', Cancelled: '#dc2626' };
    const statusBg    = { Pending: '#fef9c3', Confirmed: '#dbeafe', Processing: '#ede9fe', Shipped: '#cffafe', Delivered: '#dcfce7', Cancelled: '#fee2e2' };

    return (
      <div style={{ background: '#f4f6fa', minHeight: '100vh' }}>

        {/* ── Welcome Banner ── */}
        <div style={{ background: 'linear-gradient(135deg,#1e3c72 0%,#2a5298 50%,#4f7ccc 100%)', padding: '90px 24px 40px', position: 'relative', overflow: 'hidden' }}>
          {/* Background decorations */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: 14, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  👋 Welcome back
                </div>
                <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>
                  Hello, {customer?.name?.split(' ')[0] || 'there'}!
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '1rem' }}>
                  Ready to find your next great deal?
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Link to="/products" style={{ background: '#fff', color: '#1e3c72', borderRadius: 10, padding: '11px 26px', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🛍️ Shop Now
                </Link>
                <Link to="/campaigns" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 10, padding: '11px 22px', fontWeight: 600, fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🎯 Hold Deals
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 32 }}>
              {[
                { icon: '📦', label: 'Total Orders', value: totalOrders, link: '/orders' },
                { icon: '💰', label: 'Total Spent', value: '₹' + totalSpent.toLocaleString(), link: '/orders' },
                { icon: '♡',  label: 'Wishlist Items', value: wishlistCount, link: '/wishlist' },
                { icon: '🎯', label: 'Active Deals', value: campaigns.length, link: '/campaigns' },
              ].map(s => (
                <div key={s.label} onClick={() => navigate(s.link)}
                  style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px 20px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{s.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>

          {/* ── Quick Actions ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 40 }}>
            {[
              { icon: '📱', label: 'All Products', to: '/products', color: '#dbeafe', iconBg: '#2563eb' },
              { icon: '🛒', label: 'My Cart',      to: '/cart',     color: '#dcfce7', iconBg: '#16a34a' },
              { icon: '📦', label: 'My Orders',    to: '/orders',   color: '#fef9c3', iconBg: '#ca8a04' },
              { icon: '♡',  label: 'Wishlist',     to: '/wishlist', color: '#fee2e2', iconBg: '#dc2626' },
              { icon: '🎯', label: 'Hold Deals',   to: '/campaigns',color: '#ede9fe', iconBg: '#7c3aed' },
              { icon: '🆘', label: 'Support',      to: '/complaints',color: '#f0fdf4',iconBg: '#059669' },
            ].map(a => (
              <Link key={a.label} to={a.to} style={{ background: '#fff', borderRadius: 14, padding: '20px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all 0.2s', border: '1px solid #e5e7eb' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>{a.icon}</div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', textAlign: 'center' }}>{a.label}</span>
              </Link>
            ))}
          </div>

          {/* ── Recent Orders ── */}
          {orders.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Orders</h2>
                <Link to="/orders" style={{ color: '#2a5298', fontWeight: 600, fontSize: '0.88rem' }}>View All →</Link>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                {orders.map((order, i) => (
                  <div key={order.id} onClick={() => navigate('/order/' + order.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < orders.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>📦</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.product_name}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: 2 }}>#{order.order_number} · {new Date(order.created_date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ background: statusBg[order.order_status] || '#f3f4f6', color: statusColor[order.order_status] || '#6b7280', borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600 }}>{order.order_status}</span>
                      <span style={{ fontWeight: 700, color: '#1e3c72', fontSize: '0.95rem' }}>₹{order.order_amount?.toLocaleString()}</span>
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>›</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Active Hold Deals ── */}
          {campaigns.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>🎯 Active Hold Deals</h2>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>Group buy campaigns — join to unlock the best price</p>
                </div>
                <Link to="/campaigns" style={{ color: '#2a5298', fontWeight: 600, fontSize: '0.88rem' }}>See All →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 18 }}>
                {campaigns.map(c => {
                  const pct = Math.min(100, Math.round((c.current_hold / c.target) * 100));
                  return (
                    <div key={c.id} onClick={() => navigate('/campaigns')} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 20, border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, marginBottom: 2 }}>{c.product_name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>by {c.sellerName}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, color: '#1e3c72', fontSize: '1.05rem' }}>₹{Number(c.hold_price)?.toLocaleString()}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', textDecoration: 'line-through' }}>₹{Number(c.retail_price)?.toLocaleString()}</div>
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280', marginBottom: 5 }}>
                          <span>{c.current_hold} / {c.target} joined</span>
                          <span style={{ fontWeight: 700, color: '#2a5298' }}>{pct}%</span>
                        </div>
                        <div style={{ background: '#e5e7eb', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#2a5298,#4f7ccc)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600 }}>
                          Save ₹{(Number(c.retail_price) - Number(c.hold_price))?.toLocaleString()}
                        </span>
                        <span style={{ color: '#2a5298', fontWeight: 600, fontSize: '0.82rem' }}>Join now →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Shop by Category ── */}
          {categories.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 18 }}>Shop by Category</h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => navigate('/products?category=' + encodeURIComponent(cat))}
                    style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#374151', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1e3c72'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1e3c72'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <span style={{ fontSize: '1.1rem' }}>{catIcons[cat] || '📦'}</span> {cat}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Featured Products ── */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Top Picks For You</h2>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>Quality certified, tested & ready to ship</p>
              </div>
              <Link to="/products" style={{ color: '#2a5298', fontWeight: 600, fontSize: '0.88rem' }}>View All →</Link>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 18 }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 14, height: 300, opacity: 0.5, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }} />
                ))}
              </div>
            ) : featured.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
                <h3 style={{ fontWeight: 600, marginBottom: 6 }}>No products yet</h3>
                <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>Check back soon!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 18 }}>
                {featured.map(p => <ProductCard key={p.productId} product={p} />)}
              </div>
            )}
          </section>

          {/* ── Trust badges ── */}
          <div style={{ marginTop: 48, background: '#fff', borderRadius: 16, padding: '24px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 20 }}>
              {[
                { icon: '✅', title: 'Quality Certified', desc: 'Every product tested' },
                { icon: '🔄', title: '7-Day Returns',     desc: 'Hassle-free returns' },
                { icon: '🚚', title: 'Fast Delivery',     desc: 'Pan India shipping' },
                { icon: '🛡️', title: 'Warranty Included', desc: 'Certified warranty' },
                { icon: '💬', title: '24/7 Support',      desc: 'Always here to help' },
              ].map(b => (
                <div key={b.title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{b.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }