import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { productService, orderService, wishlistService, campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── BRAND LOGOS (real images from internet) ───────────────────── */
const BRANDS = [
  { name: 'Bata',      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Bata_logo.svg/320px-Bata_logo.svg.png' },
  { name: 'WOW',       logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/WOW_Skin_Science_logo.svg/320px-WOW_Skin_Science_logo.svg.png' },
  { name: 'Mamaearth', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Mamaearth_Logo.svg/320px-Mamaearth_Logo.svg.png' },
  { name: 'Wild Stone', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Wild_Stone_logo.png/320px-Wild_Stone_logo.png' },
  { name: 'Plum',      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Plum_goodness_logo.svg/320px-Plum_goodness_logo.svg.png' },
  { name: 'Nivea',     logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Nivea_logo.svg/320px-Nivea_logo.svg.png' },
  { name: 'Himalaya',  logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Himalaya_Drug_Company_logo.svg/320px-Himalaya_Drug_Company_logo.svg.png' },
  { name: 'Boat',      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Boat_Lifestyle_logo.svg/320px-Boat_Lifestyle_logo.svg.png' },
  { name: 'Samsung',   logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/320px-Samsung_Logo.svg.png' },
  { name: 'Apple',     logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/195px-Apple_logo_black.svg.png' },
  { name: 'Sony',      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/320px-Sony_logo.svg.png' },
  { name: 'MI',        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Xiaomi_logo.svg/320px-Xiaomi_logo.svg.png' },
];

/* ─── BANNER SLIDES ─────────────────────────────────────────────── */
const SLIDES = [
  {
    id: 0,
    bg: '#131921',
    accentBar: '#febd69',
    topLabel: 'HoldKart Big Sale | Live Now',
    headline: '50–80% off',
    sub: 'Deals on Electronics & Gadgets',
    brands: ['Samsung', 'Apple', 'Sony'],
    badge: 'Extra 10% cashback*',
    offer: '10% Instant discount* on UPI transactions',
    products: [
      { emoji: '📱', x: '2%',  y: '10%', rot: '-18deg', scale: 1.1 },
      { emoji: '💻', x: '8%',  y: '42%', rot: '8deg',   scale: 1.3 },
      { emoji: '🎧', x: '3%',  y: '68%', rot: '-6deg',  scale: 1.0 },
      { emoji: '📷', x: '14%', y: '18%', rot: '12deg',  scale: 0.95 },
      { emoji: '⌚', x: '72%', y: '8%',  rot: '14deg',  scale: 1.0 },
      { emoji: '🎮', x: '82%', y: '38%', rot: '-10deg', scale: 1.2 },
      { emoji: '📺', x: '76%', y: '68%', rot: '8deg',   scale: 1.1 },
      { emoji: '🔌', x: '88%', y: '15%', rot: '-14deg', scale: 0.9 },
    ],
    color1: '#e47911', color2: '#febd69',
  },
  {
    id: 1,
    bg: '#0f3460',
    accentBar: '#16213e',
    topLabel: 'HoldKart Group Deals | Join & Save More',
    headline: 'Hold Together,\nSave Together',
    sub: 'Group buy campaigns — unlock prices no single buyer can get',
    brands: ['OnePlus', 'Boat', 'MI'],
    badge: 'Group savings up to 50%*',
    offer: 'More members = lower price for all',
    products: [
      { emoji: '🎯', x: '3%',  y: '15%', rot: '-12deg', scale: 1.2 },
      { emoji: '🛒', x: '9%',  y: '55%', rot: '8deg',   scale: 1.1 },
      { emoji: '💡', x: '5%',  y: '75%', rot: '-5deg',  scale: 1.0 },
      { emoji: '🎁', x: '15%', y: '28%', rot: '16deg',  scale: 0.9 },
      { emoji: '💎', x: '73%', y: '10%', rot: '12deg',  scale: 1.0 },
      { emoji: '🏆', x: '83%', y: '42%', rot: '-8deg',  scale: 1.2 },
      { emoji: '⚡', x: '78%', y: '72%', rot: '10deg',  scale: 1.1 },
      { emoji: '🌟', x: '90%', y: '20%', rot: '-15deg', scale: 0.95 },
    ],
    color1: '#00b4d8', color2: '#90e0ef',
  },
  {
    id: 2,
    bg: '#1a0a00',
    accentBar: '#ff6b35',
    topLabel: 'Flash Sale | Ends Tonight',
    headline: 'Up to 70% off',
    sub: 'Premium Audio, Gaming & Accessories',
    brands: ['JBL', 'Bose', 'Sennheiser'],
    badge: 'Flat ₹500 off on ₹2999+',
    offer: 'Free delivery on orders above ₹499',
    products: [
      { emoji: '🎧', x: '2%',  y: '12%', rot: '-20deg', scale: 1.3 },
      { emoji: '🎮', x: '7%',  y: '50%', rot: '10deg',  scale: 1.2 },
      { emoji: '🔊', x: '4%',  y: '76%', rot: '-7deg',  scale: 1.1 },
      { emoji: '🎵', x: '16%', y: '22%', rot: '18deg',  scale: 0.9 },
      { emoji: '🎤', x: '74%', y: '12%', rot: '15deg',  scale: 1.0 },
      { emoji: '🕹️', x: '84%', y: '45%', rot: '-12deg', scale: 1.2 },
      { emoji: '📻', x: '77%', y: '70%', rot: '9deg',   scale: 1.0 },
      { emoji: '🎶', x: '91%', y: '25%', rot: '-18deg', scale: 0.9 },
    ],
    color1: '#ff6b35', color2: '#ffa07a',
  },
];

/* ─── DEAL SECTIONS with real photos ────────────────────────────── */
const DEAL_SECTIONS_STATIC = [
  {
    id: 'audio',
    title: 'Up to 75% off | Deals on headphones',
    link: '/products?category=Audio',
    bg: '#fff',
    items: [
      { img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80', label: 'Earphones', sub: 'Wired & Wireless' },
      { img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80', label: 'Neckbands',  sub: 'Sports & Bass' },
      { img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&q=80', label: 'Speakers',   sub: 'Portable' },
      { img: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=200&q=80', label: 'TWS Earbuds', sub: 'True Wireless' },
    ],
  },
  {
    id: 'home',
    title: 'Level up your tech setup',
    link: '/products?category=Accessories',
    bg: '#fff',
    items: [
      { img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&q=80', label: 'Keyboards',   sub: 'Mechanical & More' },
      { img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&q=80', label: 'Mouse',       sub: 'Gaming & Office' },
      { img: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=200&q=80', label: 'Laptops',     sub: 'Work & Gaming' },
      { img: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=200&q=80', label: 'Adapters',    sub: 'Cables & Hubs' },
    ],
  },
  {
    id: 'footwear',
    title: 'Up to 60% off | Mobiles & Tablets',
    link: '/products?category=Mobile',
    bg: '#fff',
    items: [
      { img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80', label: 'Smartphones', sub: 'All Brands' },
      { img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&q=80', label: 'Tablets',      sub: 'Android & iOS' },
      { img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80', label: 'Smartwatches', sub: 'Fitness & Style' },
      { img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&q=80', label: 'Powerbanks',  sub: 'Fast Charge' },
    ],
  },
  {
    id: 'cameras',
    title: 'Up to 75% off | Cameras & Laptops',
    link: '/products?category=Laptop',
    bg: '#fff',
    items: [
      { img: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&q=80', label: 'DSLR Cameras', sub: 'All Megapixels' },
      { img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80', label: 'Laptops',      sub: 'Work & Gaming' },
      { img: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=200&q=80', label: 'Monitors',     sub: '4K & FHD' },
      { img: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=200&q=80', label: 'Gaming',       sub: 'Consoles & Gear' },
    ],
  },
];

const statusColor = { Pending:'#e47911', Confirmed:'#007185', Processing:'#c7511f', Shipped:'#007600', Delivered:'#007600', Cancelled:'#c40000' };

/* ─── COMPONENT ─────────────────────────────────────────────────── */
export default function Dashboard() {
  const { customer } = useAuth();
  const navigate = useNavigate();

  const [featured, setFeatured]           = useState([]);
  const [categories, setCategories]       = useState([]);
  const [orders, setOrders]               = useState([]);
  const [campaigns, setCampaigns]         = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading]             = useState(true);
  const [slideIdx, setSlideIdx]           = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [countdown, setCountdown]         = useState({ h: 2, m: 34, s: 59 });
  const timerRef = useRef(null);
  const slide = SLIDES[slideIdx];

  /* ── data fetch ── */
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
        setFeatured(Array.isArray(f) ? f.slice(0, 12) : []);
        setCategories(Array.isArray(c) ? c : []);
        setOrders(Array.isArray(o) ? o.slice(0, 4) : []);
        setWishlistCount(Array.isArray(wl) ? wl.length : 0);
        setCampaigns(Array.isArray(camp) ? camp.slice(0, 4) : []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  /* ── countdown ticker ── */
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        let { h, m, s } = c;
        s--; if (s < 0) { s = 59; m--; if (m < 0) { m = 59; h = Math.max(0, h - 1); } }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* ── banner auto-advance ── */
  const goSlide = useCallback((to) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => { setSlideIdx(to); setTransitioning(false); }, 400);
  }, [transitioning]);

  useEffect(() => {
    timerRef.current = setInterval(() => goSlide((slideIdx + 1) % SLIDES.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [slideIdx, goSlide]);

  const manualSlide = (i) => { clearInterval(timerRef.current); goSlide(i); };
  const pad = (n) => String(n).padStart(2, '0');
  const totalSpent = orders.reduce((s, o) => s + (o.order_amount || 0), 0);

  return (
    <div style={{ background: '#e3e6e6', minHeight: '100vh', fontFamily: "'Amazon Ember', 'Segoe UI', Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Segoe UI', sans-serif; }

        /* Banner */
        .hk-banner-text { transition: opacity 0.4s ease, transform 0.4s ease; }
        .hk-banner-text.out { opacity: 0; transform: translateX(-20px); }
        .hk-banner-text.in  { opacity: 1; transform: translateX(0); }
        .hk-float-emoji { animation: hkFloat 4s ease-in-out infinite; }
        @keyframes hkFloat {
          0%, 100% { transform: translateY(0px) rotate(var(--rot)); }
          50%       { transform: translateY(-12px) rotate(var(--rot)); }
        }

        /* Deal cards */
        .hk-deal-card { background:#fff; border-radius:4px; padding:16px; transition:box-shadow 0.2s; cursor:pointer; }
        .hk-deal-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.18); }
        .hk-sub-item { transition: opacity 0.15s; }
        .hk-sub-item:hover { opacity: 0.78; }

        /* Product card wrap */
        .hk-prod-wrap { transition: transform 0.2s, box-shadow 0.2s; }
        .hk-prod-wrap:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.13); }

        /* Order row */
        .hk-ord-row { transition: background 0.15s; cursor:pointer; }
        .hk-ord-row:hover { background: #f3f3f3 !important; }

        /* Deal campaign card */
        .hk-camp-card { background:#fff; border-radius:4px; overflow:hidden; transition:box-shadow 0.2s; cursor:pointer; border:1px solid #ddd; }
        .hk-camp-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.15); }

        /* Skeleton */
        .hk-skel { background:linear-gradient(90deg,#e8e8e8 25%,#f5f5f5 50%,#e8e8e8 75%); background-size:400% 100%; animation:skel 1.4s ease-in-out infinite; border-radius:4px; }
        @keyframes skel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Promo pill */
        .hk-promo-pill { display:inline-block; border:1px solid #ccc; border-radius:2px; padding:3px 10px; font-size:0.7rem; font-weight:600; color:#333; background:#fff; margin-bottom:6px; }

        /* Arrow buttons — bare, no box */
        .hk-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.8rem;
          font-weight: 100;
          color: rgba(255,255,255,0.75);
          z-index: 20;
          line-height: 1;
          padding: 0 8px;
          transition: color 0.2s;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        .hk-arrow:hover { color: #fff; }
        .hk-arrow.left  { left: 8px; }
        .hk-arrow.right { right: 8px; }

        /* Section header link */
        .hk-see-more { color:#007185; font-size:0.8rem; font-weight:500; text-decoration:none; }
        .hk-see-more:hover { color:#c7511f; text-decoration:underline; }

        /* CTA button */
        .hk-cta { display:inline-block; background:linear-gradient(180deg,#f7dfa5,#f0c14b); border:1px solid #a88734; border-radius:3px; padding:8px 20px; font-size:0.85rem; font-weight:600; color:#111; cursor:pointer; margin-top:12px; transition:background 0.15s; font-family:inherit; }
        .hk-cta:hover { background:linear-gradient(180deg,#f5d78e,#e8b842); }
        .hk-cta-blue { background:linear-gradient(180deg,#7ac6e6,#4ba3cc); border-color:#367c96; color:#fff; }
        .hk-cta-blue:hover { background:linear-gradient(180deg,#6ab8da,#3a95be); }

        /* Flash countdown */
        .hk-digit { background:#111; color:#fff; border-radius:4px; padding:6px 10px; font-size:1.15rem; font-weight:800; min-width:36px; text-align:center; display:inline-block; font-variant-numeric:tabular-nums; }

        /* Brand marquee */
        .hk-brands-track {
          display: flex;
          gap: 0;
          animation: brandScroll 30s linear infinite;
          width: max-content;
        }
        .hk-brands-track:hover { animation-play-state: paused; }
        @keyframes brandScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .hk-brand-item {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          padding: 10px 20px;
          margin-right: 12px;
          height: 72px;
          min-width: 148px;
          flex-shrink: 0;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .hk-brand-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); transform: translateY(-2px); }
        .hk-brand-item:nth-child(12n+1)  { background: linear-gradient(135deg,#fff8e1,#fffde7); border-color:#f9e4a0; }
        .hk-brand-item:nth-child(12n+2)  { background: linear-gradient(135deg,#e8f5e9,#f1f8e9); border-color:#a5d6a7; }
        .hk-brand-item:nth-child(12n+3)  { background: linear-gradient(135deg,#e3f2fd,#e8eaf6); border-color:#90caf9; }
        .hk-brand-item:nth-child(12n+4)  { background: linear-gradient(135deg,#fce4ec,#fff0f3); border-color:#f48fb1; }
        .hk-brand-item:nth-child(12n+5)  { background: linear-gradient(135deg,#f3e5f5,#fce4ec); border-color:#ce93d8; }
        .hk-brand-item:nth-child(12n+6)  { background: linear-gradient(135deg,#e0f7fa,#e8f5e9); border-color:#80deea; }
        .hk-brand-item:nth-child(12n+7)  { background: linear-gradient(135deg,#fff3e0,#fbe9e7); border-color:#ffcc80; }
        .hk-brand-item:nth-child(12n+8)  { background: linear-gradient(135deg,#e8eaf6,#ede7f6); border-color:#9fa8da; }
        .hk-brand-item:nth-child(12n+9)  { background: linear-gradient(135deg,#f9fbe7,#f0f4c3); border-color:#dce775; }
        .hk-brand-item:nth-child(12n+10) { background: linear-gradient(135deg,#e0f2f1,#e8f5e9); border-color:#80cbc4; }
        .hk-brand-item:nth-child(12n+11) { background: linear-gradient(135deg,#fff8e1,#fff3e0); border-color:#ffe082; }
        .hk-brand-item:nth-child(12n+0)  { background: linear-gradient(135deg,#fbe9e7,#fff3e0); border-color:#ffab91; }
        .hk-brand-item img {
          max-height: 40px;
          max-width: 110px;
          object-fit: contain;
          filter: grayscale(0.1);
          transition: filter 0.2s;
        }
        .hk-brand-item:hover img { filter: grayscale(0); }
      `}</style>

      {/* ════════════════════════════════════════════
          TOP ACCENT BAR
      ════════════════════════════════════════════ */}
      <div style={{ background: slide.accentBar, padding: '7px 0', textAlign: 'center', marginTop: 64 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: slide.accentBar === '#febd69' ? '#111' : '#fff', letterSpacing: 0.3 }}>
          {slide.topLabel}
        </span>
      </div>

      {/* ════════════════════════════════════════════
          HERO BANNER — Section 2
      ════════════════════════════════════════════ */}
      <div style={{ position: 'relative', background: slide.bg, overflow: 'hidden', height: 390, transition: 'background 0.6s ease' }}>

        {/* Floating product emojis — left side */}
        {slide.products.slice(0, 4).map((p, i) => (
          <div key={i} className="hk-float-emoji"
            style={{ position:'absolute', left:p.x, top:p.y, fontSize:`${2.6 * p.scale}rem`, transform:`rotate(${p.rot})`, '--rot':p.rot, animationDelay:`${i*0.5}s`, pointerEvents:'none', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.4))', zIndex:1 }}>
            {p.emoji}
          </div>
        ))}

        {/* Floating product emojis — right side */}
        {slide.products.slice(4).map((p, i) => (
          <div key={i} className="hk-float-emoji"
            style={{ position:'absolute', left:p.x, top:p.y, fontSize:`${2.6 * p.scale}rem`, transform:`rotate(${p.rot})`, '--rot':p.rot, animationDelay:`${(i+4)*0.5}s`, pointerEvents:'none', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.4))', zIndex:1 }}>
            {p.emoji}
          </div>
        ))}

        {/* CENTER CONTENT */}
        <div className={`hk-banner-text ${transitioning ? 'out' : 'in'}`}
          style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', textAlign:'center', zIndex:10, width:480 }}>

          {/* Big headline */}
          <h1 style={{ fontSize: 'clamp(2.2rem,4.5vw,3.4rem)', fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:10, textShadow:'0 2px 12px rgba(0,0,0,0.5)', whiteSpace:'pre-line' }}>
            {slide.headline}
          </h1>
          <p style={{ fontSize:'1.2rem', fontWeight:500, color:'rgba(255,255,255,0.88)', marginBottom:16, textShadow:'0 1px 6px rgba(0,0,0,0.4)' }}>
            {slide.sub}
          </p>

          {/* Brand pills */}
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:14 }}>
            {slide.brands.map(b => (
              <span key={b} style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.35)', borderRadius:3, padding:'3px 12px', fontSize:'0.75rem', fontWeight:700, backdropFilter:'blur(4px)' }}>{b}</span>
            ))}
          </div>

          {/* Offer pills */}
          <div className="hk-promo-pill" style={{ background: slide.color1, color:'#fff', border:'none', marginRight:6 }}>{slide.badge}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:8, alignItems:'center', marginBottom:14 }}>
            <span style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', color:'rgba(255,255,255,0.85)', borderRadius:3, padding:'5px 14px', fontSize:'0.75rem', backdropFilter:'blur(4px)' }}>{slide.offer}</span>
          </div>

          <button className="hk-cta" onClick={() => navigate('/products')}>Shop Now</button>
        </div>

        {/* Dot nav */}
        <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, zIndex:20 }}>
          {SLIDES.map((_,i) => (
            <button key={i} onClick={() => manualSlide(i)}
              style={{ width: i===slideIdx?22:8, height:8, borderRadius:99, background: i===slideIdx?slide.color1:'rgba(255,255,255,0.45)', border:'none', cursor:'pointer', transition:'all 0.35s', padding:0 }} />
          ))}
        </div>

        {/* Arrows — bare, no box */}
        <button className="hk-arrow left" onClick={() => manualSlide((slideIdx-1+SLIDES.length)%SLIDES.length)}>‹</button>
        <button className="hk-arrow right" onClick={() => manualSlide((slideIdx+1)%SLIDES.length)}>›</button>
      </div>

      {/* ════════════════════════════════════════════
          MAIN PAGE — WHITE BACKGROUND SECTION
      ════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '12px 12px 60px' }}>

        {/* ── FLASH SALE COUNTDOWN STRIP ── */}
        <div style={{ background:'#fff', borderRadius:4, padding:'12px 20px', marginBottom:12, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap', border:'1px solid #ddd' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <span style={{ fontSize:'1.2rem' }}>⚡</span>
            <span style={{ fontWeight:800, fontSize:'1rem', color:'#c40000' }}>Flash Sale</span>
            <span style={{ fontSize:'0.8rem', color:'#666', fontWeight:500 }}>Ends in</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span className="hk-digit">{pad(countdown.h)}</span>
            <span style={{ fontWeight:800, color:'#c40000', fontSize:'1.2rem' }}>:</span>
            <span className="hk-digit">{pad(countdown.m)}</span>
            <span style={{ fontWeight:800, color:'#c40000', fontSize:'1.2rem' }}>:</span>
            <span className="hk-digit">{pad(countdown.s)}</span>
          </div>
          <div style={{ flex:1, display:'flex', gap:10, overflowX:'auto', paddingBottom:2 }}>
            {[{ icon:'📦', label:'My Orders', val:orders.length, link:'/orders', c:'#007185' },
              { icon:'💸', label:'Spent',     val:'₹'+totalSpent.toLocaleString(), link:'/orders', c:'#007600' },
              { icon:'♡',  label:'Wishlist',  val:wishlistCount, link:'/wishlist', c:'#c7511f' },
              { icon:'🎯', label:'Deals',     val:campaigns.length, link:'/campaigns', c:'#c40000' },
            ].map(s => (
              <div key={s.label} onClick={() => navigate(s.link)}
                style={{ display:'flex', alignItems:'center', gap:8, background:'#f7f7f7', border:'1px solid #ddd', borderRadius:3, padding:'6px 14px', cursor:'pointer', flexShrink:0, transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor=s.c}
                onMouseLeave={e => e.currentTarget.style.borderColor='#ddd'}>
                <span style={{ fontSize:'1rem' }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight:800, fontSize:'0.88rem', color:s.c, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:'0.65rem', color:'#888', lineHeight:1.3 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/products" style={{ background:'linear-gradient(180deg,#f7dfa5,#f0c14b)', border:'1px solid #a88734', borderRadius:3, padding:'7px 18px', fontWeight:700, fontSize:'0.82rem', color:'#111', flexShrink:0 }}>See All Deals →</Link>
        </div>

        {/* ── 4-COLUMN DEAL GRID with real photos ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
          {DEAL_SECTIONS_STATIC.map((sec) => (
            <div key={sec.id} className="hk-deal-card" onClick={() => navigate(sec.link)} style={{ border:'1px solid #ddd' }}>
              <h3 style={{ fontWeight:800, fontSize:'0.98rem', color:'#0f1111', marginBottom:12, lineHeight:1.3, minHeight:42 }}>{sec.title}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {sec.items.map((item) => (
                  <div key={item.label} className="hk-sub-item"
                    style={{ background:'#f7f7f7', borderRadius:4, overflow:'hidden', textAlign:'center', cursor:'pointer' }}>
                    <div style={{ width:'100%', height:80, overflow:'hidden' }}>
                      <img
                        src={item.img}
                        alt={item.label}
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                        onError={e => { e.target.style.display='none'; e.target.parentNode.style.background='#eee'; }}
                      />
                    </div>
                    <div style={{ padding:'6px 6px 8px' }}>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#0f1111', lineHeight:1.3 }}>{item.label}</div>
                      <div style={{ fontSize:'0.65rem', color:'#565959', marginTop:2 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hk-see-more" style={{ display:'block', marginTop:12 }}>See all offers</div>
            </div>
          ))}
        </div>

        {/* ── HOLD DEALS SECTION (4-column same format) ── */}
        {campaigns.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ background:'#fff', borderRadius:4, padding:'16px 16px 8px', border:'1px solid #ddd' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h2 style={{ fontWeight:800, fontSize:'1.1rem', color:'#0f1111' }}>🎯 Hold Deals — Group Buy & Save</h2>
                <Link to="/campaigns" className="hk-see-more" style={{ fontWeight:600 }}>See all campaigns →</Link>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                {campaigns.map((c) => {
                  const pct = Math.min(100, Math.round((c.current_hold / c.target) * 100));
                  const savings = Number(c.retail_price) - Number(c.hold_price);
                  const savePct = Math.round((savings / Number(c.retail_price)) * 100);
                  return (
                    <div key={c.id} className="hk-camp-card" onClick={() => navigate('/campaigns')}>
                      <div style={{ background:'linear-gradient(135deg,#232f3e,#37475a)', padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.65rem', fontWeight:600, letterSpacing:1, marginBottom:4 }}>HOLD DEAL</div>
                          <div style={{ color:'#fff', fontWeight:700, fontSize:'0.9rem', lineHeight:1.3, maxWidth:160 }}>{c.product_name}</div>
                        </div>
                        <div style={{ background:'#febd69', color:'#111', borderRadius:2, padding:'3px 8px', fontSize:'0.7rem', fontWeight:800, flexShrink:0 }}>{savePct}% OFF</div>
                      </div>
                      <div style={{ padding:'12px 14px' }}>
                        <div style={{ fontSize:'0.72rem', color:'#565959', marginBottom:10 }}>by {c.sellerName}</div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12 }}>
                          <div>
                            <div style={{ fontSize:'1.3rem', fontWeight:800, color:'#B12704' }}>₹{Number(c.hold_price)?.toLocaleString()}</div>
                            <div style={{ fontSize:'0.75rem', color:'#888', textDecoration:'line-through' }}>₹{Number(c.retail_price)?.toLocaleString()}</div>
                          </div>
                          <div style={{ textAlign:'right', background:'#f0fff4', border:'1px solid #c6f6d5', borderRadius:3, padding:'5px 10px' }}>
                            <div style={{ fontWeight:800, fontSize:'0.85rem', color:'#276749' }}>Save ₹{savings.toLocaleString()}</div>
                          </div>
                        </div>
                        <div style={{ marginBottom:10 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'#565959', marginBottom:4 }}>
                            <span>{c.current_hold}/{c.target} joined</span>
                            <span style={{ fontWeight:700, color: pct>=75?'#c40000':'#007185' }}>{pct}% filled</span>
                          </div>
                          <div style={{ background:'#e6e6e6', borderRadius:99, height:6, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:pct+'%', background: pct>=75?'linear-gradient(90deg,#f0c14b,#c40000)':'linear-gradient(90deg,#007185,#00a8b4)', borderRadius:99, transition:'width 0.8s' }} />
                          </div>
                        </div>
                        <button className="hk-cta hk-cta-blue" style={{ width:'100%', textAlign:'center' }}
                          onClick={e => { e.stopPropagation(); navigate('/campaigns'); }}>
                          Join this Deal →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── RECENT ORDERS ── */}
        {orders.length > 0 && (
          <div style={{ background:'#fff', borderRadius:4, border:'1px solid #ddd', marginBottom:12, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontWeight:800, fontSize:'1.02rem', color:'#0f1111' }}>Your Recent Orders</h2>
              <Link to="/orders" className="hk-see-more">View order history →</Link>
            </div>
            {orders.map((order, i) => (
              <div key={order.id} className="hk-ord-row"
                onClick={() => navigate('/order/'+order.id)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom: i<orders.length-1?'1px solid #f3f3f3':'none', background:'#fff' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:52, height:52, background:'#f7f7f7', border:'1px solid #ddd', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>📦</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#0f1111', marginBottom:2 }}>{order.product_name}</div>
                    <div style={{ fontSize:'0.72rem', color:'#565959' }}>Order #{order.order_number} · {new Date(order.created_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <span style={{ background: statusColor[order.order_status]+'18'||'#f7f7f7', color:statusColor[order.order_status]||'#555', border:`1px solid ${statusColor[order.order_status]||'#ddd'}40`, borderRadius:99, padding:'4px 12px', fontSize:'0.72rem', fontWeight:700 }}>{order.order_status}</span>
                  <span style={{ fontWeight:800, fontSize:'1rem', color:'#B12704' }}>₹{order.order_amount?.toLocaleString()}</span>
                  <span style={{ color:'#007185', fontSize:'0.8rem' }}>›</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BRAND MARQUEE (below Recent Orders) ── */}
        <div style={{ background: '#f4f6f8', borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd', overflow: 'hidden', padding: '10px 0', marginBottom: 12, borderRadius: 4 }}>
          <div className="hk-brands-track">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <div key={i} className="hk-brand-item">
                <img
                  src={b.logo}
                  alt={b.name}
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
                />
                <span style={{ display:'none', fontWeight:700, fontSize:'0.9rem', color:'#333' }}>{b.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── APP PROMO BANNER ── */}
        <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 12, display: 'flex', minHeight: 200, background: 'linear-gradient(135deg, #7b1fa2, #ab47bc)' }}>
          {/* Left: offer text */}
          <div style={{ background: '#FF9800', minWidth: 200, padding: '28px 28px 28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5D3A00', marginBottom: 4, letterSpacing: 0.3 }}>Up to</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#4A148C', lineHeight: 1, marginBottom: 4, textShadow: '0 2px 0 rgba(255,255,255,0.3)' }}>35% OFF</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3E2700', marginBottom: 2 }}>on first order</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5D3A00', marginBottom: 16 }}>*Only on App</div>
            <button
              onClick={() => navigate('/products')}
              style={{ background: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 800, fontSize: '0.85rem', color: '#333', cursor: 'pointer', alignSelf: 'flex-start', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', letterSpacing: 0.3 }}>
              Order Now
            </button>
            <div style={{ position: 'absolute', left: 8, bottom: 10, fontSize: '0.55rem', color: 'rgba(0,0,0,0.4)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>T&amp;C Apply*</div>
          </div>

          {/* Right: category cards */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, padding: '18px 20px', alignItems: 'center' }}>
            {[
              {
                label: 'Trending Now',
                img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&q=80',
                hearts: true,
              },
              {
                label: 'Budget Buys',
                img: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=300&q=80',
                rupee: true,
              },
              {
                label: 'Top Rated Picks',
                img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80',
                sparkle: true,
              },
              {
                label: 'Daily Essentials',
                img: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=300&q=80',
                sun: true,
              },
            ].map((cat, idx) => (
              <div key={idx} onClick={() => navigate('/products')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0 8px' }}>
                {/* Photo card */}
                <div style={{
                  width: '100%',
                  maxWidth: 150,
                  aspectRatio: '3/4',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '3px solid rgba(255,255,255,0.55)',
                  position: 'relative',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                  background: '#ddd',
                }}>
                  <img
                    src={cat.img}
                    alt={cat.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  {/* Floating decorative icon */}
                  {cat.hearts && (
                    <div style={{ position: 'absolute', top: 6, right: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '1.1rem', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>❤️</span>
                      <span style={{ fontSize: '0.8rem', marginLeft: 10, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>❤️</span>
                      <span style={{ fontSize: '1rem', marginLeft: 4, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>❤️</span>
                    </div>
                  )}
                  {cat.rupee && (
                    <div style={{ position: 'absolute', top: 8, right: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: '1.3rem', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>💰</span>
                      <span style={{ fontSize: '1rem', marginLeft: 8, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>💰</span>
                    </div>
                  )}
                  {cat.sparkle && (
                    <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '1.1rem', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>✨</span>
                      <span style={{ fontSize: '0.9rem', marginLeft: 6, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>✨</span>
                    </div>
                  )}
                  {cat.sun && (
                    <div style={{ position: 'absolute', top: 8, right: 6 }}>
                      <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>☀️</span>
                    </div>
                  )}
                </div>
                {/* Label */}
                <div style={{
                  background: 'rgba(0,0,0,0.45)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: 20,
                  padding: '5px 14px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255,255,255,0.25)',
                  letterSpacing: 0.2,
                }}>
                  {cat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURED PRODUCTS GRID (Amazon row style) ── */}
        <div style={{ background:'#fff', borderRadius:4, border:'1px solid #ddd', padding:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h2 style={{ fontWeight:800, fontSize:'1.1rem', color:'#0f1111' }}>Top Picks For You</h2>
              <p style={{ fontSize:'0.75rem', color:'#565959', marginTop:3 }}>Based on your browsing & order history</p>
            </div>
            <Link to="/products" className="hk-see-more" style={{ fontWeight:600 }}>See personalised recommendations</Link>
          </div>

          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
              {[...Array(10)].map((_,i) => <div key={i} className="hk-skel" style={{ height:280 }} />)}
            </div>
          ) : featured.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'#888' }}>
              <div style={{ fontSize:'2.8rem', marginBottom:10 }}>📦</div>
              <p style={{ fontWeight:600, color:'#444' }}>No featured products yet</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
              {featured.map(p => (
                <div key={p.productId} className="hk-prod-wrap">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── TRUST BADGES (Amazon footer style) ── */}
        <div style={{ background:'#232f3e', borderRadius:4, marginTop:12, padding:'18px 28px', display:'flex', justifyContent:'center', gap:40, flexWrap:'wrap' }}>
          {[
            { icon:'✅', t:'Quality Certified', s:'Every item verified' },
            { icon:'🚚', t:'Fast Delivery', s:'Pan India shipping' },
            { icon:'🔄', t:'Easy Returns', s:'7-day return policy' },
            { icon:'🛡️', t:'Secure Payments', s:'100% safe checkout' },
            { icon:'💬', t:'24/7 Support', s:'Always here to help' },
          ].map(b => (
            <div key={b.t} style={{ display:'flex', alignItems:'center', gap:10, color:'#fff' }}>
              <span style={{ fontSize:'1.5rem' }}>{b.icon}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.82rem' }}>{b.t}</div>
                <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.55)', marginTop:1 }}>{b.s}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}