import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { productService, wishlistService, campaignService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';

/* ─── BRAND LOGOS ───────────────────────────────────────────────── */
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

/* ─── BANNER SLIDES
     leftImg  — product image shown on the left  (null = none)
     rightImg — product image shown on the right (null = none)
     Images are displayed WITHOUT any card/box; they sit directly on the banner.
     Uses dark-background product photos so edges blend naturally.
─────────────────────────────────────────────────────────────────── */
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
    color1: '#e47911',
    color2: '#febd69',
    /* Galaxy S-series phone on black — blends naturally with dark banner */
    leftImg:  { src: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=480&q=90', alt: 'Smartphone' },
    /* MacBook on minimal dark surface */
    rightImg: { src: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=480&q=90', alt: 'Laptop' },
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
    color1: '#00b4d8',
    color2: '#90e0ef',
    /* Single image on right — Sony WH-1000XM4 on dark blue-ish surface */
    leftImg:  null,
    rightImg: { src: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=520&q=90', alt: 'Headphones' },
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
    color1: '#ff6b35',
    color2: '#ffa07a',
    /* AirPods on dark left, over-ear headphones on dark right */
    leftImg:  { src: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=480&q=90', alt: 'Earbuds' },
    rightImg: { src: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=480&q=90', alt: 'Over-ear headphones' },
  },
];

/* ─── DEAL SECTIONS ─────────────────────────────────────────────── */
const DEAL_SECTIONS_STATIC = [
  {
    id: 'audio',
    title: 'Up to 75% off | Deals on headphones',
    link: '/products?category=Audio',
    items: [
      { img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80', label: 'Earphones',   sub: 'Wired & Wireless' },
      { img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80', label: 'Neckbands',   sub: 'Sports & Bass' },
      { img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&q=80', label: 'Speakers',    sub: 'Portable' },
      { img: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=200&q=80', label: 'TWS Earbuds', sub: 'True Wireless' },
    ],
  },
  {
    id: 'home',
    title: 'Level up your tech setup',
    link: '/products?category=Accessories',
    items: [
      { img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&q=80', label: 'Keyboards', sub: 'Mechanical & More' },
      { img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&q=80', label: 'Mouse',     sub: 'Gaming & Office' },
      { img: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=200&q=80', label: 'Laptops',   sub: 'Work & Gaming' },
      { img: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=200&q=80', label: 'Adapters',  sub: 'Cables & Hubs' },
    ],
  },
  {
    id: 'mobile',
    title: 'Up to 60% off | Mobiles & Tablets',
    link: '/products?category=Mobile',
    items: [
      { img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80', label: 'Smartphones',  sub: 'All Brands' },
      { img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&q=80', label: 'Tablets',       sub: 'Android & iOS' },
      { img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80', label: 'Smartwatches', sub: 'Fitness & Style' },
      { img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&q=80', label: 'Powerbanks',  sub: 'Fast Charge' },
    ],
  },
  {
    id: 'cameras',
    title: 'Up to 75% off | Cameras & Laptops',
    link: '/products?category=Laptop',
    items: [
      { img: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&q=80', label: 'DSLR Cameras', sub: 'All Megapixels' },
      { img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80', label: 'Laptops',      sub: 'Work & Gaming' },
      { img: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=200&q=80', label: 'Monitors',     sub: '4K & FHD' },
      { img: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=200&q=80', label: 'Gaming',       sub: 'Consoles & Gear' },
    ],
  },
];

/* ─── COMPONENT ─────────────────────────────────────────────────── */
export default function Home({ isGuest = false }) {
  const { customer } = useAuth();
  const navigate = useNavigate();

  const guardedNav = (path) => {
    // Campaign detail pages handle their own auth check internally,
    // so guests can navigate directly to view the deal.
    if (isGuest && !path.startsWith('/campaigns/')) { navigate('/login'); return; }
    navigate(path);
  };

  const [featured, setFeatured]           = useState([]);
  const [featuredPage, setFeaturedPage]   = useState(1);
  const [featuredHasMore, setFeaturedHasMore] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const featuredSentinelRef = useRef(null);
  const [categories, setCategories]       = useState([]);
  const [campaigns, setCampaigns]         = useState([]);
  const [joinedProductIds, setJoinedProductIds] = useState(new Set());
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading]             = useState(true);
  const [dealSections, setDealSections]   = useState(DEAL_SECTIONS_STATIC);
  const [slideIdx, setSlideIdx]           = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [countdown, setCountdown]         = useState({ h: 2, m: 34, s: 59 });
  const timerRef = useRef(null);
  const slide = SLIDES[slideIdx];

  useEffect(() => {
    (async () => {
      try {
        if (isGuest) {
          const f = await productService.getFeatured(1, 10).catch(() => []);
          const featArr = Array.isArray(f) ? f : [];
          setFeatured(featArr);
          setFeaturedHasMore(featArr.length === 10);
          // Fetch real deal sections for guests too (listCampaigns is public)
          try {
            const allCampaigns = await campaignService.listCampaigns().catch(() => []);
            const campaignList = Array.isArray(allCampaigns) ? allCampaigns : [];
            if (campaignList.length > 0) {
              const categoryMap = {};
              for (const cam of campaignList) {
                const cat = cam.category;
                if (!cat) continue;
                if (!categoryMap[cat]) categoryMap[cat] = [];
                categoryMap[cat].push(cam);
              }
              const topCategories = Object.entries(categoryMap)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 4);
              const resolveImg = (raw) => {
                if (!raw) return null;
                let first = raw;
                if (String(raw).startsWith('[')) {
                  try { first = JSON.parse(raw).filter(Boolean)[0] || raw; } catch {}
                }
                if (first.startsWith('http')) return first;
                return first.startsWith('/uploads')
                  ? first.replace('/uploads', '/seller-uploads')
                  : `/seller-uploads${first.startsWith('/') ? '' : '/'}${first}`;
              };
              const sections = topCategories.map(([cat, cams], idx) => {
                const sorted = [...cams].sort((a, b) => (b.target || 0) - (a.target || 0));
                const seen = new Set();
                const items = [];
                for (const cam of sorted) {
                  if (items.length >= 4) break;
                  const pid = cam.product_id;
                  if (seen.has(pid)) continue;
                  seen.add(pid);
                  items.push({ img: resolveImg(cam.image_url), label: cam.product_name || cat, sub: cam.target > 0 ? `Up to ${cam.target}% off` : 'Group Deal', productId: pid });
                }
                const fallback = DEAL_SECTIONS_STATIC[idx]?.items || [];
                while (items.length < 4 && fallback[items.length]) items.push(fallback[items.length]);
                const maxDiscount = Math.max(...cams.map(c => c.target || 0));
                return { id: `cat-${cat}`, title: maxDiscount > 0 ? `Up to ${maxDiscount}% off | ${cat}` : cat, link: `/products?category=${encodeURIComponent(cat)}`, items };
              });
              if (sections.length > 0) setDealSections(sections);
            }
          } catch { /* keep static fallback */ }
        } else {
          const [f, c, wl, camp] = await Promise.all([
            productService.getFeatured(1, 10).catch(() => []),
            productService.getCategories().catch(() => []),
            wishlistService.getWishlist().catch(() => []),
            campaignService.getMyCampaigns().catch(() => []),
          ]);
          const featArr = Array.isArray(f) ? f : [];
          setFeatured(featArr);
          setFeaturedHasMore(featArr.length === 10);
          setCategories(Array.isArray(c) ? c : []);
          setWishlistCount(Array.isArray(wl) ? wl.length : 0);
          const campArr = Array.isArray(camp) ? camp : [];
          setCampaigns(campArr.slice(0, 6));
          // Only ACTIVE or PAUSED campaigns count as "joined" — exclude CANCELLED
          const activeCamp = campArr.filter(c => c.campaignStatus === 'ACTIVE' || c.campaignStatus === 'PAUSED');
          setJoinedProductIds(new Set(activeCamp.map(c => Number(c.product_id))));

          // ── Load real deal sections from active campaigns ──
          // Group active campaigns by category, pick top 4 categories by deal count
          // then pick up to 4 products per category as section items
          try {
            const allCampaigns = await campaignService.listCampaigns().catch(() => []);
            const campaignList = Array.isArray(allCampaigns) ? allCampaigns : [];
            if (campaignList.length > 0) {
              // Count campaigns per category and collect products
              const categoryMap = {};
              for (const cam of campaignList) {
                const cat = cam.category;
                if (!cat) continue;
                if (!categoryMap[cat]) categoryMap[cat] = [];
                categoryMap[cat].push(cam);
              }
              // Sort categories by number of active deals descending, take top 4
              const topCategories = Object.entries(categoryMap)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 4);

              const resolveImg = (raw) => {
                if (!raw) return null;
                let first = raw;
                if (String(raw).startsWith('[')) {
                  try { first = JSON.parse(raw).filter(Boolean)[0] || raw; } catch {}
                }
                if (first.startsWith('http')) return first;
                return first.startsWith('/uploads')
                  ? first.replace('/uploads', '/seller-uploads')
                  : `/seller-uploads${first.startsWith('/') ? '' : '/'}${first}`;
              };

              const sections = topCategories.map(([cat, cams], idx) => {
                // Sort by highest discount potential (target%) descending
                const sorted = [...cams].sort((a, b) => (b.target || 0) - (a.target || 0));
                // Take up to 4 unique products as items
                const seen = new Set();
                const items = [];
                for (const cam of sorted) {
                  if (items.length >= 4) break;
                  const pid = cam.product_id;
                  if (seen.has(pid)) continue;
                  seen.add(pid);
                  const img = resolveImg(cam.image_url);
                  items.push({
                    img,
                    label: cam.product_name || cat,
                    sub: cam.target > 0 ? `Up to ${cam.target}% off` : 'Group Deal',
                    productId: pid,
                  });
                }
                // Pad with static fallback items if fewer than 4 products
                const fallback = DEAL_SECTIONS_STATIC[idx]?.items || [];
                while (items.length < 4 && fallback[items.length]) {
                  items.push(fallback[items.length]);
                }
                const maxDiscount = Math.max(...cams.map(c => c.target || 0));
                return {
                  id: `cat-${cat}`,
                  title: maxDiscount > 0 ? `Up to ${maxDiscount}% off | ${cat}` : cat,
                  link: `/products?category=${encodeURIComponent(cat)}`,
                  items,
                };
              });

              if (sections.length > 0) setDealSections(sections);
            }
          } catch { /* keep static fallback */ }
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [isGuest]);

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

  // Listen for any join/start event fired from ProductDetail, CampaignDetail, or GroupBuyWidget
  // and instantly refresh the My Hold Deals section without a full page reload.
  useEffect(() => {
    if (isGuest) return;
    const handleCampaignJoined = async () => {
      try {
        const camp = await campaignService.getMyCampaigns();
        const campArr = Array.isArray(camp) ? camp : [];
        setCampaigns(campArr.slice(0, 6));
        // Only ACTIVE or PAUSED campaigns count as "joined" — exclude CANCELLED
        const activeCamp = campArr.filter(c => c.campaignStatus === 'ACTIVE' || c.campaignStatus === 'PAUSED');
        setJoinedProductIds(new Set(activeCamp.map(c => Number(c.product_id))));
      } catch {}
    };
    window.addEventListener('campaignJoined', handleCampaignJoined);
    return () => window.removeEventListener('campaignJoined', handleCampaignJoined);
  }, [isGuest]);

  const goSlide = useCallback((to) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => { setSlideIdx(to); setTransitioning(false); }, 350);
  }, [transitioning]);

  useEffect(() => {
    timerRef.current = setInterval(() => goSlide((slideIdx + 1) % SLIDES.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [slideIdx, goSlide]);

  const manualSlide = (i) => { clearInterval(timerRef.current); goSlide(i); };
  const pad = (n) => String(n).padStart(2, '0');

  /* ── Load more featured products on scroll ──────────────────── */
  // isFetching ref prevents concurrent fetches regardless of render cycles
  const isFetchingRef = useRef(false);

  const loadMoreFeatured = useCallback(async () => {
    if (isFetchingRef.current || !featuredHasMore) return;
    isFetchingRef.current = true;
    setFeaturedLoading(true);
    try {
      const nextPage = featuredPage + 1;
      const more = await productService.getFeatured(nextPage, 10).catch(() => []);
      const arr = Array.isArray(more) ? more : [];
      if (arr.length === 0) {
        setFeaturedHasMore(false);
      } else {
        setFeatured(prev => [...prev, ...arr]);
        setFeaturedPage(nextPage);
        setFeaturedHasMore(arr.length === 10);
      }
    } finally {
      setFeaturedLoading(false);
      isFetchingRef.current = false;
    }
  }, [featuredHasMore, featuredPage]);

  // Scroll-based trigger: fires whenever user scrolls within 400px of the sentinel
  useEffect(() => {
    const handleScroll = () => {
      if (isFetchingRef.current) return;
      const sentinel = featuredSentinelRef.current;
      if (!sentinel) return;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 400) {
        loadMoreFeatured();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Also check immediately in case all products fit in the viewport
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreFeatured]);


  return (
    <div style={{ background: '#e3e6e6', minHeight: '100vh', fontFamily: "'Amazon Ember', 'Segoe UI', Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Segoe UI', sans-serif; }

        /* Banner */
        .hk-banner-content { transition: opacity 0.35s ease, transform 0.35s ease; }
        .hk-banner-content.out { opacity: 0; transform: translateX(-14px); }
        .hk-banner-content.in  { opacity: 1; transform: translateX(0); }

        /* Product images — fade in only, no rotation/float */
        .hk-prod-img { transition: opacity 0.35s ease; }
        .hk-prod-img.out { opacity: 0; }
        .hk-prod-img.in  { opacity: 1; }

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

        /* Campaign card */
        .hk-camp-card { background:#fff; border-radius:4px; overflow:hidden; transition:box-shadow 0.2s; cursor:pointer; border:1px solid #ddd; }
        .hk-camp-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.15); }

        /* Skeleton */
        .hk-skel { background:linear-gradient(90deg,#e8e8e8 25%,#f5f5f5 50%,#e8e8e8 75%); background-size:400% 100%; animation:skel 1.4s ease-in-out infinite; border-radius:4px; }
        @keyframes skel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Promo pill */
        .hk-promo-pill { display:inline-block; border:1px solid rgba(255,255,255,0.25); border-radius:3px; padding:4px 12px; font-size:0.72rem; font-weight:700; margin-bottom:8px; }

        /* Arrows — flush to edge, translucent */
        .hk-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(0,0,0,0.32); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 68px;
          font-size: 1.7rem; color: rgba(255,255,255,0.82);
          z-index: 20; transition: background 0.2s, color 0.2s;
        }
        .hk-arrow:hover { background: rgba(0,0,0,0.58); color: #fff; }
        .hk-arrow.left  { left: 0; border-radius: 0 4px 4px 0; }
        .hk-arrow.right { right: 0; border-radius: 4px 0 0 4px; }

        /* Section links */
        .hk-see-more { color:#007185; font-size:0.8rem; font-weight:500; text-decoration:none; }
        .hk-see-more:hover { color:#c7511f; text-decoration:underline; }

        /* CTA buttons */
        .hk-cta { display:inline-block; background:linear-gradient(180deg,#f7dfa5,#f0c14b); border:1px solid #a88734; border-radius:3px; padding:9px 24px; font-size:0.88rem; font-weight:700; color:#111; cursor:pointer; margin-top:14px; transition:background 0.15s; font-family:inherit; }
        .hk-cta:hover { background:linear-gradient(180deg,#f5d78e,#e8b842); }
        .hk-cta-blue { background:linear-gradient(180deg,#7ac6e6,#4ba3cc); border-color:#367c96; color:#fff; }
        .hk-cta-blue:hover { background:linear-gradient(180deg,#6ab8da,#3a95be); }

        /* Flash countdown digit */
        .hk-digit { background:#111; color:#fff; border-radius:4px; padding:6px 10px; font-size:1.15rem; font-weight:800; min-width:36px; text-align:center; display:inline-block; font-variant-numeric:tabular-nums; }

        /* Brand marquee */
        .hk-brands-track { display:flex; animation:brandScroll 30s linear infinite; width:max-content; }
        .hk-brands-track:hover { animation-play-state:paused; }
        @keyframes brandScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .hk-brand-item {
          display:flex; align-items:center; justify-content:center;
          background:#fff; border:1px solid #e8e8e8; border-radius:8px;
          padding:10px 20px; margin-right:12px; height:72px; min-width:148px; flex-shrink:0;
          transition:box-shadow 0.2s, transform 0.2s;
        }
        .hk-brand-item:hover { box-shadow:0 4px 16px rgba(0,0,0,0.15); transform:translateY(-2px); }
        .hk-brand-item:nth-child(12n+1)  { background:linear-gradient(135deg,#fff8e1,#fffde7); border-color:#f9e4a0; }
        .hk-brand-item:nth-child(12n+2)  { background:linear-gradient(135deg,#e8f5e9,#f1f8e9); border-color:#a5d6a7; }
        .hk-brand-item:nth-child(12n+3)  { background:linear-gradient(135deg,#e3f2fd,#e8eaf6); border-color:#90caf9; }
        .hk-brand-item:nth-child(12n+4)  { background:linear-gradient(135deg,#fce4ec,#fff0f3); border-color:#f48fb1; }
        .hk-brand-item:nth-child(12n+5)  { background:linear-gradient(135deg,#f3e5f5,#fce4ec); border-color:#ce93d8; }
        .hk-brand-item:nth-child(12n+6)  { background:linear-gradient(135deg,#e0f7fa,#e8f5e9); border-color:#80deea; }
        .hk-brand-item:nth-child(12n+7)  { background:linear-gradient(135deg,#fff3e0,#fbe9e7); border-color:#ffcc80; }
        .hk-brand-item:nth-child(12n+8)  { background:linear-gradient(135deg,#e8eaf6,#ede7f6); border-color:#9fa8da; }
        .hk-brand-item:nth-child(12n+9)  { background:linear-gradient(135deg,#f9fbe7,#f0f4c3); border-color:#dce775; }
        .hk-brand-item:nth-child(12n+10) { background:linear-gradient(135deg,#e0f2f1,#e8f5e9); border-color:#80cbc4; }
        .hk-brand-item:nth-child(12n+11) { background:linear-gradient(135deg,#fff8e1,#fff3e0); border-color:#ffe082; }
        .hk-brand-item:nth-child(12n+0)  { background:linear-gradient(135deg,#fbe9e7,#fff3e0); border-color:#ffab91; }
        .hk-brand-item img { max-height:40px; max-width:110px; object-fit:contain; filter:grayscale(0.1); transition:filter 0.2s; }
        .hk-brand-item:hover img { filter:grayscale(0); }
      `}</style>

      {/* ════════════ TOP ACCENT BAR ════════════ */}
      <div style={{ background: slide.accentBar, padding: '7px 0', textAlign: 'center', marginTop: 100 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: slide.accentBar === '#febd69' ? '#111' : '#fff', letterSpacing: 0.3 }}>
          {slide.topLabel}
        </span>
      </div>

      {/* ════════════ HERO BANNER ════════════
          Layout:
          • Left product image (absolutely positioned, no card)
          • Centered promotional text
          • Right product image (absolutely positioned, no card)
          Images sit directly on the dark banner background — no borders, no containers.
      ══════════════════════════════════════ */}
      <div style={{ position: 'relative', background: slide.bg, overflow: 'hidden', height: 390, transition: 'background 0.5s ease' }}>

        {/* ── Left product image ── */}
        {slide.leftImg && (
          <div
            className={`hk-prod-img ${transitioning ? 'out' : 'in'}`}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '28%',
              height: '100%',
              overflow: 'hidden',
              zIndex: 2,
              pointerEvents: 'none',
              maskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 72%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 72%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
              maskComposite: 'intersect',
              WebkitMaskComposite: 'destination-in',
            }}
          >
            <img
              src={slide.leftImg.src}
              alt={slide.leftImg.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                mixBlendMode: 'screen',
              }}
            />
          </div>
        )}

        {/* ── Right product image ── */}
        {slide.rightImg && (
          <div
            className={`hk-prod-img ${transitioning ? 'out' : 'in'}`}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '28%',
              height: '100%',
              overflow: 'hidden',
              zIndex: 2,
              pointerEvents: 'none',
              maskImage: 'linear-gradient(to left, transparent 0%, black 18%, black 72%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, transparent 0%, black 18%, black 72%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
              maskComposite: 'intersect',
              WebkitMaskComposite: 'destination-in',
            }}
          >
            <img
              src={slide.rightImg.src}
              alt={slide.rightImg.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                mixBlendMode: 'screen',
              }}
            />
          </div>
        )}

        {/* ── CENTER: Promotional text ── */}
        <div
          className={`hk-banner-content ${transitioning ? 'out' : 'in'}`}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10,
            width: 460,
          }}
        >
          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.15,
            marginBottom: 10,
            textShadow: '0 2px 12px rgba(0,0,0,0.45)',
            whiteSpace: 'pre-line',
          }}>
            {slide.headline}
          </h1>

          <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'rgba(255,255,255,0.88)', marginBottom: 16, textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}>
            {slide.sub}
          </p>

          {/* Brand pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
            {slide.brands.map(b => (
              <span key={b} style={{
                background: 'rgba(255,255,255,0.14)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 3,
                padding: '3px 13px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>{b}</span>
            ))}
          </div>

          {/* Offer pills */}
          <div className="hk-promo-pill" style={{ background: slide.color1, color: '#fff', border: 'none', marginRight: 6 }}>
            {slide.badge}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <span style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.82)',
              borderRadius: 3,
              padding: '5px 14px',
              fontSize: '0.75rem',
            }}>{slide.offer}</span>
          </div>

          <button className="hk-cta" onClick={() => guardedNav('/products')}>Shop Now</button>
        </div>

        {/* Dot nav */}
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 20 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => manualSlide(i)}
              style={{ width: i === slideIdx ? 22 : 8, height: 8, borderRadius: 99, background: i === slideIdx ? slide.color1 : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', transition: 'all 0.35s', padding: 0 }} />
          ))}
        </div>

        {/* Arrows */}
        <button className="hk-arrow left"  onClick={() => manualSlide((slideIdx - 1 + SLIDES.length) % SLIDES.length)}>‹</button>
        <button className="hk-arrow right" onClick={() => manualSlide((slideIdx + 1) % SLIDES.length)}>›</button>
      </div>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '12px 12px 60px' }}>

        {/* ── Flash sale countdown ── */}
        <div style={{ background: '#fff', borderRadius: 4, padding: '12px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', border: '1px solid #ddd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#c40000' }}>Flash Sale</span>
            <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 500 }}>Ends in</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="hk-digit">{pad(countdown.h)}</span>
            <span style={{ fontWeight: 800, color: '#c40000', fontSize: '1.2rem' }}>:</span>
            <span className="hk-digit">{pad(countdown.m)}</span>
            <span style={{ fontWeight: 800, color: '#c40000', fontSize: '1.2rem' }}>:</span>
            <span className="hk-digit">{pad(countdown.s)}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2, alignItems: 'center' }}>
            {!isGuest && [
              { icon: '♡',  label: 'Wishlist',  val: wishlistCount,    link: '/wishlist',  c: '#c7511f' },
              { icon: '🎯', label: 'Deals',     val: campaigns.length, link: '/campaigns', c: '#c40000' },
            ].map(s => (
              <div key={s.label} onClick={() => navigate(s.link)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f7f7f7', border: '1px solid #ddd', borderRadius: 3, padding: '6px 14px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = s.c}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#ddd'}>
                <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: s.c, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '0.65rem', color: '#888', lineHeight: 1.3 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => guardedNav('/products')} style={{ background: 'linear-gradient(180deg,#f7dfa5,#f0c14b)', border: '1px solid #a88734', borderRadius: 3, padding: '7px 18px', fontWeight: 700, fontSize: '0.82rem', color: '#111', flexShrink: 0, cursor: 'pointer' }}>See All Deals →</button>
        </div>

        {/* ── 4-column deal grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
          {dealSections.map((sec) => (
            <div key={sec.id} className="hk-deal-card" onClick={() => guardedNav(sec.link)} style={{ border: '1px solid #ddd' }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f1111', marginBottom: 12, lineHeight: 1.3, minHeight: 42 }}>{sec.title}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {sec.items.map((item) => (
                  <div key={item.label} className="hk-sub-item" style={{ background: '#f7f7f7', borderRadius: 4, overflow: 'hidden', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ width: '100%', height: 110, overflow: 'hidden', background: '#f7f7f7', padding: 6, boxSizing: 'border-box' }}>
                      {item.img ? (
                        <img src={item.img} alt={item.label}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                          onError={e => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='110' viewBox='0 0 200 110'%3E%3Crect width='200' height='110' fill='%23f0f4f8'/%3E%3Crect x='70' y='20' width='60' height='50' rx='6' fill='%23d1d9e6'/%3E%3Ccircle cx='100' cy='38' r='10' fill='%23a0aec0'/%3E%3Cpath d='M75 68 Q100 48 125 68Z' fill='%23a0aec0'/%3E%3Ctext x='100' y='96' text-anchor='middle' font-family='sans-serif' font-size='9' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E"; }} />
                      ) : (
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='110' viewBox='0 0 200 110'%3E%3Crect width='200' height='110' fill='%23f0f4f8'/%3E%3Crect x='70' y='20' width='60' height='50' rx='6' fill='%23d1d9e6'/%3E%3Ccircle cx='100' cy='38' r='10' fill='%23a0aec0'/%3E%3Cpath d='M75 68 Q100 48 125 68Z' fill='%23a0aec0'/%3E%3Ctext x='100' y='96' text-anchor='middle' font-family='sans-serif' font-size='9' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E" alt={item.label}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                      )}
                    </div>
                    <div style={{ padding: '6px 6px 8px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f1111', lineHeight: 1.3 }}>{item.label}</div>
                      <div style={{ fontSize: '0.65rem', color: '#565959', marginTop: 2 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hk-see-more" style={{ display: 'block', marginTop: 12 }}>See all offers</div>
            </div>
          ))}
        </div>

        {/* ── Hold Deals ── */}
        {campaigns.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ background: '#fff', borderRadius: 4, padding: '16px 16px 8px', border: '1px solid #ddd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f1111' }}>🎯 {isGuest ? 'Hold Deals — Group Buy & Save' : 'My Hold Deals'}</h2>
                <button onClick={() => guardedNav('/campaigns')} className="hk-see-more" style={{ fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>See all campaigns →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
                {campaigns.filter(c => !c.campaignStatus || c.campaignStatus === 'ACTIVE').map((c) => {
                  /* getMyCampaigns always returns campaign_id explicitly.
                     listCampaigns returns c.id as the PK.
                     Both cases: campaign_id is always the correct column. */
                  // Strip any ":N" mysql2 duplicate-column suffix before parsing
                  const rawCampaignId = String(c.campaign_id || c.id || '').split(':')[0];
                  const campaignId    = rawCampaignId ? parseInt(rawCampaignId, 10) || null : null;
                  const currentHold  = c.current_hold || 0;
                  const target       = c.target || 0;
                  const retailPrice  = Number(c.retail_price) || 0;
                  const holdPrice    = Number(c.hold_price)   || 0;
                  // currentHold = number of members joined = current live discount %
                  // target = max members = max discount %
                  const discountPct  = currentHold; // e.g. 2 joined → 2% off now
                  const displayPrice = discountPct > 0
                    ? Math.round(retailPrice * (1 - discountPct / 100))
                    : retailPrice;
                  const maxDiscountPct = target; // e.g. 10 target → 10% off at best
                  const bestGroupPrice = target > 0
                    ? Math.round(retailPrice * (1 - maxDiscountPct / 100))
                    : holdPrice;
                  const pct          = target > 0 ? Math.min(100, Math.round((currentHold / target) * 100)) : 0;
                  const FALLBACK    = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f4f8'/%3E%3Crect x='140' y='90' width='120' height='90' rx='10' fill='%23d1d9e6'/%3E%3Ccircle cx='200' cy='115' r='18' fill='%23a0aec0'/%3E%3Cpath d='M155 175 Q200 130 245 175Z' fill='%23a0aec0'/%3E%3Ctext x='200' y='225' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";
                  const _rawImg     = c.image_url;
                  const _firstImg   = (() => {
                    if (!_rawImg) return null;
                    if (String(_rawImg).startsWith('[')) {
                      try { return JSON.parse(_rawImg).filter(Boolean)[0] || _rawImg; } catch {}
                    }
                    return _rawImg;
                  })();
                  const imgSrc      = _firstImg
                    ? (_firstImg.startsWith('http')
                        ? _firstImg
                        : _firstImg.startsWith('/uploads')
                          ? _firstImg.replace('/uploads', '/seller-uploads')
                          : `/seller-uploads${_firstImg.startsWith('/') ? '' : '/'}${_firstImg}`)
                    : FALLBACK;
                  const detailPath  = campaignId ? `/campaigns/${campaignId}` : '/campaigns';

                  return (
                    <div
                      key={campaignId ?? c.product_id}
                      onClick={() => guardedNav(detailPath)}
                      style={{
                        background: '#fff', borderRadius: 8, border: '1px solid #e3e6e6',
                        overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        position: 'relative', transition: 'box-shadow 0.2s, border-color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.14)'; e.currentTarget.style.borderColor = '#c9cdd2'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e3e6e6'; }}
                    >
                      {/* Wishlist heart top-right */}
                      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#9ca3af', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                        ♡
                      </div>
                      {/* Product image */}
                      <div style={{ background: '#f9fafb', overflow: 'hidden' }}>
                        <img src={imgSrc} alt={c.product_name} onError={e => { e.target.src = FALLBACK; }}
                          style={{ width: '100%', height: 160, objectFit: 'contain', display: 'block' }} />
                      </div>
                      {/* Card body */}
                      <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: 2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {c.category || 'Hold Deal'}
                        </p>
                        <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f1111', marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.3em' }}>
                          {c.product_name}
                        </p>
                        {/* Progress bar */}
                        <div style={{ marginBottom: 5 }}>
                          <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct >= 100 ? '#16a34a' : '#2a5298', transition: 'width 0.4s ease' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                            <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                              <span style={{ fontWeight: 700, color: '#1e3c72' }}>{currentHold}/{target}</span> joined
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>Group Deal</span>
                          </div>
                          <div style={{ fontSize: '0.68rem', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            <span style={{ fontWeight: 800, color: '#dc2626' }}>₹{bestGroupPrice.toLocaleString('en-IN')}</span>
                            <span style={{ background: '#dc2626', color: '#fff', borderRadius: 3, padding: '1px 4px' }}>{maxDiscountPct}% off</span>
                          </div>
                        </div>
                        {/* Price */}
                        <div style={{ marginBottom: 8, marginTop: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f1111' }}>₹{displayPrice.toLocaleString('en-IN')}</span>
                            {discountPct > 0 && <span style={{ fontSize: '0.78rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{retailPrice.toLocaleString('en-IN')}</span>}
                          </div>
                          <p style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 1 }}>Inclusive of all taxes</p>
                        </div>
                        {/* View Deal button */}
                        <button
                          onClick={e => { e.stopPropagation(); guardedNav(detailPath); }}
                          style={{ width: '100%', padding: '7px 0', background: '#f0c14b', border: '1px solid #a88734', borderRadius: 4, fontWeight: 700, fontSize: '0.82rem', color: '#111', cursor: 'pointer' }}
                        >
                          View Deal
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Brand marquee ── */}
        <div style={{ background: '#f4f6f8', borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd', overflow: 'hidden', padding: '10px 0', marginBottom: 12, borderRadius: 4 }}>
          <div className="hk-brands-track">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <div key={i} className="hk-brand-item">
                <img src={b.logo} alt={b.name} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                <span style={{ display: 'none', fontWeight: 700, fontSize: '0.9rem', color: '#333' }}>{b.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── App promo banner ── */}
        <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 12, display: 'flex', minHeight: 200, background: 'linear-gradient(135deg, #7b1fa2, #ab47bc)' }}>
          <div style={{ background: '#FF9800', minWidth: 200, padding: '28px 28px 28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5D3A00', marginBottom: 4, letterSpacing: 0.3 }}>Up to</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#4A148C', lineHeight: 1, marginBottom: 4, textShadow: '0 2px 0 rgba(255,255,255,0.3)' }}>35% OFF</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3E2700', marginBottom: 2 }}>on first order</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5D3A00', marginBottom: 16 }}>*Only on App</div>
            <button onClick={() => guardedNav('/products')}
              style={{ background: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 800, fontSize: '0.85rem', color: '#333', cursor: 'pointer', alignSelf: 'flex-start', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', letterSpacing: 0.3 }}>
              Order Now
            </button>
            <div style={{ position: 'absolute', left: 8, bottom: 10, fontSize: '0.55rem', color: 'rgba(0,0,0,0.4)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>T&amp;C Apply*</div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, padding: '18px 20px', alignItems: 'center' }}>
            {[
              { label: 'Trending Now',     img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&q=80' },
              { label: 'Budget Buys',      img: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=300&q=80' },
              { label: 'Top Rated Picks',  img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80' },
              { label: 'Daily Essentials', img: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=300&q=80' },
            ].map((cat, idx) => (
              <div key={idx} onClick={() => guardedNav('/products')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0 8px' }}>
                <div style={{ width: '100%', maxWidth: 150, aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.55)', position: 'relative', boxShadow: '0 6px 20px rgba(0,0,0,0.35)', background: '#ddd' }}>
                  <img src={cat.img} alt={cat.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '5px 14px', color: '#fff', fontWeight: 700, fontSize: '0.78rem', textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.25)', letterSpacing: 0.2 }}>
                  {cat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Featured products ── */}
        <div style={{ background: '#fff', borderRadius: 4, border: '1px solid #ddd', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f1111' }}>Top Picks For You</h2>
              <p style={{ fontSize: '0.75rem', color: '#565959', marginTop: 3 }}>Based on your browsing & order history</p>
            </div>
            <button onClick={() => guardedNav('/products')} className="hk-see-more" style={{ fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>See all products →</button>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
              {[...Array(10)].map((_, i) => <div key={i} className="hk-skel" style={{ height: 280 }} />)}
            </div>
          ) : featured.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#888' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>📦</div>
              <p style={{ fontWeight: 600, color: '#444' }}>No featured products yet</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                {featured.map(p => (
                  <div key={p.productId} className="hk-prod-wrap">
                    <ProductCard product={p} alreadyJoined={joinedProductIds.has(Number(p.productId))} />
                  </div>
                ))}
                {featuredLoading && [...Array(5)].map((_, i) => (
                  <div key={`skel-${i}`} className="hk-skel" style={{ height: 280 }} />
                ))}
              </div>
              {/* Sentinel — always mounted so the observer never needs to reconnect */}
              <div ref={featuredSentinelRef} style={{ height: 1, marginTop: 8 }} />
              {!featuredHasMore && featured.length > 10 && (
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#888', marginTop: 12 }}>
                  ✓ All products loaded
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Trust badges ── */}
        <div style={{ background: '#232f3e', borderRadius: 4, marginTop: 12, padding: '18px 28px', display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[
            { icon: '✅', t: 'Quality Certified', s: 'Every item verified' },
            { icon: '🚚', t: 'Fast Delivery',      s: 'Pan India shipping' },
            { icon: '🔄', t: 'Easy Returns',        s: '7-day return policy' },
            { icon: '🛡️', t: 'Secure Payments',    s: '100% safe checkout' },
            { icon: '💬', t: '24/7 Support',        s: 'Always here to help' },
          ].map(b => (
            <div key={b.t} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
              <span style={{ fontSize: '1.5rem' }}>{b.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{b.t}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{b.s}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}