import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard.jsx';
import { productService, wishlistService, campaignService, cartService } from '../services/index.js';
// personalised + guest section helpers (new methods on productService)
import { useAuth } from '../context/AuthContext.jsx';
import { HeroBannerAd, ScrollBannerAd, ProductSpotlightAd, PopupAd, SidebarBoxAd } from '../components/AdBanner.jsx';

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
    leftImg:  { src: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=480&q=90', alt: 'Smartphone' },
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
/* ─── SUGGESTED FOR YOU CAROUSEL ────────────────────────────────── */
function SuggestedForYou({ items: itemsProp, loading, guardedNav, title = 'Suggested For You' }) {
  const trackRef = useRef(null);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const t = trackRef.current;
    if (!t) return;
    setCanRight(t.scrollLeft + t.clientWidth < t.scrollWidth - 4);
  };

  const scroll = (dir) => {
    const t = trackRef.current;
    if (!t) return;
    t.scrollBy({ left: dir * 900, behavior: 'smooth' });
    setTimeout(updateArrows, 400);
  };

  if (loading || !itemsProp || itemsProp.length === 0) return null;

  const items = itemsProp;
  const catName = items[0]?.category || items[0]?.categoryName || 'Products';

  const resolveImg = (p) => {
    const raw = p.imageUrl || p.image_url || p.image;
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    return raw.startsWith('/uploads')
      ? raw.replace('/uploads', '/seller-uploads')
      : `/seller-uploads${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  return (
    <div style={{ background: '#fff', borderRadius: 4, border: '1px solid #ddd', padding: '16px 20px', marginBottom: 12, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f1111', margin: 0 }}>{title}</h2>
        <button
          onClick={() => guardedNav(`/products`)}
          style={{ width: 38, height: 38, borderRadius: '50%', background: '#0f1111', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >→</button>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div
          ref={trackRef}
          onScroll={updateArrows}
          style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '4px 2px' }}
        >
          {items.map((p) => {
            const imgSrc  = resolveImg(p);
            const price   = Number(p.price || p.retailPrice || p.retail_price) || 0;
            const mrp     = Number(p.mrp || p.originalPrice || price) || price;
            const upiPrice = price > 0 ? Math.round(price * 0.9) : 0;

            return (
              <div
                key={p.productId}
                onClick={() => guardedNav(`/product/${p.productId}`)}
                style={{ flexShrink: 0, width: 220, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <div style={{ width: 220, height: 220, background: '#f7f7f7', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imgSrc
                    ? <img src={imgSrc} alt={p.name || p.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                    : <div style={{ fontSize: '2.5rem', color: '#ccc' }}>📦</div>
                  }
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0f1111', fontWeight: 500, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.name || p.productName || catName}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  {mrp > price && <span style={{ fontSize: '0.75rem', color: '#878787', textDecoration: 'line-through' }}>₹{mrp.toLocaleString('en-IN')}</span>}
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f1111' }}>₹{price.toLocaleString('en-IN')}</span>
                </div>
                {upiPrice > 0 && price > 0 && (
                  <div style={{ fontSize: '0.72rem', color: '#2874f0', fontWeight: 600 }}>
                    ₹{upiPrice.toLocaleString('en-IN')} <span style={{ fontWeight: 400 }}>with deal + more</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canRight && (
          <button
            onClick={() => scroll(1)}
            style={{ position: 'absolute', right: -12, zIndex: 10, width: 32, height: 80, background: '#fff', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >›</button>
        )}
      </div>
    </div>
  );
}

/* ─── SHOP MORE GRID ─────────────────────────────────────────────── */
function ShopMoreGrid({ items: itemsProp, allProducts, categories, loading, guardedNav }) {
  // allProducts = full featured list used for padding; itemsProp = browsing-based priority list
  const pool = (allProducts && allProducts.length > 0) ? allProducts : (itemsProp || []);
  if (loading || pool.length === 0) return null;

  const SECTION_TITLES = [
    'Explore more', 'Keep shopping for', 'Up to 50% off | Top picks', 'Continue shopping for',
  ];

  // Build category map from full pool so we have the widest variety
  const catMap = {};
  for (const p of pool) {
    const cat = p.category || p.categoryName || 'More';
    if (!catMap[cat]) catMap[cat] = [];
    catMap[cat].push(p);
  }

  // Priority: categories the user actually browsed come first
  const browsedCats = new Set();
  for (const p of (itemsProp || [])) {
    browsedCats.add(p.category || p.categoryName || 'More');
  }

  const allCats = Object.keys(catMap);
  const orderedCats = [
    ...allCats.filter(c => browsedCats.has(c)),
    ...allCats.filter(c => !browsedCats.has(c)),
  ];

  // Pick 4 unique categories; each card shows different products
  const usedProductIds = new Set();
  const entries = [];
  for (const cat of orderedCats) {
    if (entries.length >= 4) break;
    // Skip products already used in a previous card
    const freshItems = catMap[cat].filter(p => !usedProductIds.has(p.productId));
    if (freshItems.length === 0) continue;
    freshItems.slice(0, 4).forEach(p => usedProductIds.add(p.productId));
    entries.push([cat, freshItems]);
  }

  // If still fewer than 4, fill with remaining unused products across any category
  if (entries.length < 4) {
    const remaining = pool.filter(p => !usedProductIds.has(p.productId));
    const extraCatMap = {};
    for (const p of remaining) {
      const cat = p.category || p.categoryName || 'More';
      if (!extraCatMap[cat]) extraCatMap[cat] = [];
      extraCatMap[cat].push(p);
    }
    for (const [cat, items] of Object.entries(extraCatMap)) {
      if (entries.length >= 4) break;
      items.slice(0, 4).forEach(p => usedProductIds.add(p.productId));
      entries.push([cat, items]);
    }
  }

  if (entries.length === 0) return null;

  const resolveImg = (p) => {
    const raw = p.imageUrl || p.image_url || p.image;
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    return raw.startsWith('/uploads')
      ? raw.replace('/uploads', '/seller-uploads')
      : `/seller-uploads${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  // Pre-compute all 4 cards' thumbnail arrays before rendering,
  // using a single globally-claimed set so no product ever appears twice across cards.
  // Heroes are NOT pre-claimed — they can still appear as thumbnails in other cards.
  const globalClaimedIds = new Set();

  const cardData = entries.map(([cat, items]) => {
    const hero = items && items[0];
    if (!hero) return { cat, hero: null, thumbs: [] };

    // Start thumbs from the card's own items (up to 4)
    let thumbs = items.slice(0, 4);
    thumbs.forEach(p => globalClaimedIds.add(p.productId));

    if (thumbs.length < 4) {
      // Pass 1: same category from full pool, not yet claimed globally
      for (const p of pool) {
        if (thumbs.length >= 4) break;
        if (
          (p.category || p.categoryName || 'More') === cat &&
          !globalClaimedIds.has(p.productId)
        ) {
          thumbs = [...thumbs, p];
          globalClaimedIds.add(p.productId);
        }
      }
      // Pass 2: any category, not yet claimed
      for (const p of pool) {
        if (thumbs.length >= 4) break;
        if (!globalClaimedIds.has(p.productId)) {
          thumbs = [...thumbs, p];
          globalClaimedIds.add(p.productId);
        }
      }
      // Pass 3: absolute last resort — allow repeats from pool start
      if (thumbs.length < 4) {
        const thumbIds = new Set(thumbs.map(p => p.productId));
        for (const p of pool) {
          if (thumbs.length >= 4) break;
          if (!thumbIds.has(p.productId)) {
            thumbs = [...thumbs, p];
            thumbIds.add(p.productId);
          }
        }
      }
    }

    return { cat, hero, thumbs };
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
      {cardData.map(({ cat, hero, thumbs }, si) => {
        if (!hero) return null;
        const heroImg = resolveImg(hero);
        const price = Number(hero.price || hero.retailPrice || hero.retail_price) || 0;
        const mrp   = Number(hero.mrp || hero.originalPrice || price) || price;

        return (
          <div key={cat} style={{ background: '#fff', borderRadius: 4, border: '1px solid #ddd', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Title */}
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f1111', lineHeight: 1.3, margin: 0 }}>
              {SECTION_TITLES[si] || cat}
            </h3>

            {/* Hero image */}
            <div
              onClick={() => guardedNav(`/product/${hero.productId}`)}
              style={{ cursor: 'pointer', width: '100%', height: 180, background: '#f7f7f7', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {heroImg
                ? <img src={heroImg} alt={hero.name || hero.productName} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                : <div style={{ fontSize: '2.5rem', color: '#ccc' }}>📦</div>
              }
            </div>

            {/* Product name */}
            <div style={{ fontSize: '0.78rem', color: '#0f1111', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {hero.name || hero.productName || cat}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                ₹{price.toLocaleString('en-IN')}
                <sup style={{ fontSize: '0.55rem', verticalAlign: 'super' }}>00</sup>
              </span>
              {mrp > price && (
                <span style={{ fontSize: '0.72rem', color: '#565959' }}>
                  M.R.P: <span style={{ textDecoration: 'line-through' }}>₹{mrp.toLocaleString('en-IN')}</span>
                </span>
              )}
            </div>

            {/* Thumbnails */}
            <div style={{ display: 'flex', gap: 6 }}>
              {thumbs.map((p, ti) => {
                const tImg = resolveImg(p);
                return (
                  <div
                    key={ti}
                    onClick={() => guardedNav(`/product/${p.productId}`)}
                    style={{
                      width: 52, height: 52, borderRadius: 4, border: ti === 0 ? '2px solid #007185' : '1px solid #ddd',
                      background: '#f7f7f7', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {tImg
                      ? <img src={tImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                      : <span style={{ fontSize: '1rem', color: '#ccc' }}>📦</span>
                    }
                  </div>
                );
              })}
            </div>

            {/* See more */}
            <a onClick={() => guardedNav(`/products?category=${encodeURIComponent(cat)}`)} style={{ fontSize: '0.78rem', color: '#007185', cursor: 'pointer', fontWeight: 500, marginTop: 'auto' }}>
              See more
            </a>
          </div>
        );
      })}
    </div>
  );
}

/* ─── BROWSING HISTORY CAROUSEL ─────────────────────────────────── */
function BrowsingHistoryCarousel({ items: itemsProp, loading, guardedNav, joinedProductIds, title = 'Inspired by your browsing history' }) {
  const trackRef = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);
  const CARD_W = 180; // card width + gap

  const updateArrows = () => {
    const t = trackRef.current;
    if (!t) return;
    setCanLeft(t.scrollLeft > 4);
    setCanRight(t.scrollLeft + t.clientWidth < t.scrollWidth - 4);
  };

  const scroll = (dir) => {
    const t = trackRef.current;
    if (!t) return;
    t.scrollBy({ left: dir * CARD_W * 3, behavior: 'smooth' });
    setTimeout(updateArrows, 400);
  };

  if (loading || !itemsProp || itemsProp.length === 0) return null;

  // Show up to 14 items
  const items = itemsProp.slice(0, 14);

  return (
    <div style={{ background: '#fff', borderRadius: 4, border: '1px solid #ddd', padding: '16px', marginBottom: 12, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f1111' }}>{title}</h2>
        <span style={{ fontSize: '0.78rem', color: '#565959' }}>Page 1 of {Math.ceil(itemsProp.length / 7)}</span>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          disabled={!canLeft}
          style={{
            position: 'absolute', left: -16, zIndex: 10,
            width: 32, height: 90, background: '#fff',
            border: '1px solid #ddd', borderRadius: 4,
            cursor: canLeft ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: canLeft ? '#333' : '#ccc',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >‹</button>

        {/* Scrollable track */}
        <div
          ref={trackRef}
          onScroll={updateArrows}
          style={{
            display: 'flex', gap: 12, overflowX: 'auto', scrollBehavior: 'smooth',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
            padding: '4px 0',
          }}
        >
          <style>{`.hk-bh-track::-webkit-scrollbar { display: none; }`}</style>
          {items.map((p) => {
            const rawImg = p.imageUrl || p.image_url || p.image;
            const imgSrc = rawImg
              ? (rawImg.startsWith('http') ? rawImg : rawImg.startsWith('/uploads')
                ? rawImg.replace('/uploads', '/seller-uploads')
                : `/seller-uploads${rawImg.startsWith('/') ? '' : '/'}${rawImg}`)
              : null;
            const price   = Number(p.price || p.retailPrice || p.retail_price) || 0;
            const mrp     = Number(p.mrp || p.originalPrice || price) || price;
            const discPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

            return (
              <div
                key={p.productId}
                onClick={() => guardedNav(`/product/${p.productId}`)}
                style={{
                  flexShrink: 0, width: 168, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}
              >
                <div style={{ width: 168, height: 168, background: '#f7f7f7', borderRadius: 4, overflow: 'hidden', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imgSrc
                    ? <img src={imgSrc} alt={p.name || p.productName} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                    : <div style={{ fontSize: '2rem', color: '#ccc' }}>📦</div>
                  }
                </div>
                <div style={{ fontSize: '0.78rem', color: '#007185', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.name || p.productName || 'Product'}
                </div>
                {discPct > 0 && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cc0c39' }}>-{discPct}%</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>₹{price.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {mrp > price && (
                  <div style={{ fontSize: '0.7rem', color: '#565959' }}>
                    M.R.P: <span style={{ textDecoration: 'line-through' }}>₹{mrp.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          disabled={!canRight}
          style={{
            position: 'absolute', right: -16, zIndex: 10,
            width: 32, height: 90, background: '#fff',
            border: '1px solid #ddd', borderRadius: 4,
            cursor: canRight ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: canRight ? '#333' : '#ccc',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >›</button>
      </div>
    </div>
  );
}

/* ─── BASED ON YOUR CART CAROUSEL ───────────────────────────────── */
function BasedOnCartCarousel({ items: itemsProp, loading, guardedNav, title = 'Based on your cart' }) {
  const trackRef = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const t = trackRef.current;
    if (!t) return;
    setCanLeft(t.scrollLeft > 4);
    setCanRight(t.scrollLeft + t.clientWidth < t.scrollWidth - 4);
  };

  const scroll = (dir) => {
    const t = trackRef.current;
    if (!t) return;
    t.scrollBy({ left: dir * 900, behavior: 'smooth' });
    setTimeout(updateArrows, 400);
  };


  const resolveImg = (p) => {
    const raw = p.imageUrl || p.image_url || p.image;
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    return raw.startsWith('/uploads')
      ? raw.replace('/uploads', '/seller-uploads')
      : `/seller-uploads${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  const items = (itemsProp && itemsProp.length > 0) ? itemsProp : [];

  return (
    <div style={{ background: '#fff', borderRadius: 4, border: '1px solid #ddd', padding: '16px 20px', marginBottom: 12, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f1111', margin: 0 }}>{title}</h2>
        <button
          onClick={() => guardedNav('/products')}
          style={{ background: 'none', border: 'none', color: '#007185', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >See more →</button>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {canLeft && (
          <button onClick={() => scroll(-1)}
            style={{ position: 'absolute', left: -12, zIndex: 10, width: 32, height: 80, background: '#fff', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >‹</button>
        )}

        <div
          ref={trackRef}
          onScroll={updateArrows}
          style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '2px 0' }}
        >
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="hk-skel" style={{ flexShrink: 0, width: 220, height: 220, marginRight: 0 }} />
              ))
            : items.map((p) => {
                const imgSrc = resolveImg(p);
                return (
                  <div
                    key={p.productId}
                    onClick={() => guardedNav(`/product/${p.productId}`)}
                    style={{ flexShrink: 0, width: 220, height: 220, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                  >
                    {imgSrc
                      ? <img src={imgSrc} alt={p.name || p.productName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
                          onError={e => { e.target.style.display = 'none'; }}
                          onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
                          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        />
                      : <div style={{ width: '100%', height: '100%', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#ccc' }}>📦</div>
                    }
                  </div>
                );
              })
          }
        </div>

        {canRight && (
          <button onClick={() => scroll(1)}
            style={{ position: 'absolute', right: -12, zIndex: 10, width: 32, height: 80, background: '#fff', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >›</button>
        )}
      </div>
    </div>
  );
}

export default function Home({ isGuest = false }) {
  const { customer } = useAuth();
  const navigate = useNavigate();

  const AUTH_ONLY_PATHS = ['/orders', '/order/', '/profile', '/notifications', '/complaints', '/checkout', '/buy-now', '/invoice/'];

  const guardedNav = (path) => {
    if (isGuest && AUTH_ONLY_PATHS.some(p => path.startsWith(p))) {
      toast.error('Please sign in to continue');
      navigate('/login');
      return;
    }
    window.scrollTo(0, 0);
    navigate(path);
  };

  // ── Advertisement state is managed inside AdBanner components ───────────────

  const [cartItems, setCartItems]         = useState([]);
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

  // ── Personalised section data (logged-in) ────────────────────────────────────
  const [personalizedCart,      setPersonalizedCart]      = useState([]);
  const [personalizedBrowsing,  setPersonalizedBrowsing]  = useState([]);
  const [personalizedSuggested, setPersonalizedSuggested] = useState([]);
  const [personalizedLoading,   setPersonalizedLoading]   = useState(true);

  // ── Guest section data (logged-out) ──────────────────────────────────────────
  const [guestDeals,     setGuestDeals]     = useState([]);
  const [guestTrending,  setGuestTrending]  = useState([]);
  const [guestTopRated,  setGuestTopRated]  = useState([]);
  const [guestLoading,   setGuestLoading]   = useState(true);

  // ── Fetch all ad slots on mount ───────────────────────────────────────────────
  useEffect(() => {
    const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
    // Advertisements are fetched inside AdBanner components
  }, []);

  // ── Ask for location on Home load (browser's native permission prompt, same as
  //    flipkart.com) and cache the detected address so the Address Details form
  //    (Profile/Checkout) can pre-fill itself with it later. Only asked once per
  //    browser; if denied or unsupported, users continue to enter address manually
  //    exactly as before — nothing else changes.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.navigator?.geolocation) return;
    if (localStorage.getItem('holdkart_location_prompted')) return;
    localStorage.setItem('holdkart_location_prompted', '1');

    window.navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const pincode = data?.postcode;
          const city = data?.city || data?.locality || '';
          const state = data?.principalSubdivision || '';
          const validPincode = pincode && /^[1-9][0-9]{5}$/.test(pincode);
          if (validPincode || city || state) {
            const detected = {
              address: '',
              city,
              state,
              pincode: validPincode ? pincode : '',
            };
            localStorage.setItem('holdkart_detected_address', JSON.stringify(detected));
          }
        } catch { /* reverse-geocoding failed — manual address entry remains available */ }
      },
      () => { /* user denied or location unavailable — manual address entry remains available */ },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (isGuest) {
          const f = await productService.getFeatured(1, 10).catch(() => []);
          const featArr = Array.isArray(f) ? f : [];
          setFeatured(featArr);
          setFeaturedHasMore(featArr.length === 10);
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
          const [f, c, wl, camp, cartRes] = await Promise.all([
            productService.getFeatured(1, 10).catch(() => []),
            productService.getCategories().catch(() => []),
            wishlistService.getWishlist().catch(() => []),
            campaignService.getMyCampaigns().catch(() => []),
            cartService.getCart().catch(() => []),
          ]);
          const featArr = Array.isArray(f) ? f : [];
          setFeatured(featArr);
          setFeaturedHasMore(featArr.length === 10);
          setCategories(Array.isArray(c) ? c : []);
          setWishlistCount(Array.isArray(wl) ? wl.length : 0);
          const cartArr = Array.isArray(cartRes) ? cartRes : (cartRes?.items || cartRes?.data || []);
          setCartItems(Array.isArray(cartArr) ? cartArr : []);
          const campArr = Array.isArray(camp) ? camp : [];
          setCampaigns(campArr.slice(0, 6));
          const activeCamp = campArr.filter(c => c.campaignStatus === 'ACTIVE' || c.campaignStatus === 'PAUSED');
          setJoinedProductIds(new Set(activeCamp.map(c => Number(c.product_id))));

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
                  const img = resolveImg(cam.image_url);
                  items.push({
                    img,
                    label: cam.product_name || cat,
                    sub: cam.target > 0 ? `Up to ${cam.target}% off` : 'Group Deal',
                    productId: pid,
                  });
                }
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

  // ── Fetch personalised section data (after main data loads) ──────────────────
  useEffect(() => {
    if (isGuest) {
      // Not logged in: fetch public guest sections
      setGuestLoading(true);
      Promise.all([
        productService.getGuestSection
          ? productService.getGuestSection('deals',     14).catch(() => [])
          : Promise.resolve([]),
        productService.getGuestSection
          ? productService.getGuestSection('trending',  14).catch(() => [])
          : Promise.resolve([]),
        productService.getGuestSection
          ? productService.getGuestSection('top_rated', 14).catch(() => [])
          : Promise.resolve([]),
      ]).then(([deals, trending, topRated]) => {
        setGuestDeals(    Array.isArray(deals)    ? deals    : []);
        setGuestTrending( Array.isArray(trending) ? trending : []);
        setGuestTopRated( Array.isArray(topRated) ? topRated : []);
      }).catch(() => {}).finally(() => setGuestLoading(false));
    } else {
      // Logged in: fetch personalised sections + trending as fallback
      setPersonalizedLoading(true);
      Promise.all([
        productService.getPersonalizedCart
          ? productService.getPersonalizedCart(14).catch(() => [])
          : Promise.resolve([]),
        productService.getPersonalizedBrowsing
          ? productService.getPersonalizedBrowsing(14).catch(() => [])
          : Promise.resolve([]),
        productService.getPersonalizedSuggested
          ? productService.getPersonalizedSuggested(14).catch(() => [])
          : Promise.resolve([]),
        // Always fetch trending so new users see "Trending Now" until they build history
        productService.getGuestSection
          ? productService.getGuestSection('trending', 14).catch(() => [])
          : Promise.resolve([]),
      ]).then(([cart, browsing, suggested, trending]) => {
        setPersonalizedCart(      Array.isArray(cart)     ? cart     : []);
        setPersonalizedBrowsing(  Array.isArray(browsing) ? browsing : []);
        setPersonalizedSuggested( Array.isArray(suggested)? suggested: []);
        setGuestTrending(         Array.isArray(trending) ? trending : []);
      }).catch(() => {}).finally(() => setPersonalizedLoading(false));
    }
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

  useEffect(() => {
    if (isGuest) return;
    const handleCampaignJoined = async () => {
      try {
        const camp = await campaignService.getMyCampaigns();
        const campArr = Array.isArray(camp) ? camp : [];
        setCampaigns(campArr.slice(0, 6));
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
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreFeatured]);


  return (
    <div style={{ background: '#e3e6e6', minHeight: '100vh', fontFamily: "'Amazon Ember', 'Segoe UI', Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Segoe UI', sans-serif; }

        .hk-banner-content { transition: opacity 0.35s ease, transform 0.35s ease; }
        .hk-banner-content.out { opacity: 0; transform: translateX(-14px); }
        .hk-banner-content.in  { opacity: 1; transform: translateX(0); }

        .hk-prod-img { transition: opacity 0.35s ease; }
        .hk-prod-img.out { opacity: 0; }
        .hk-prod-img.in  { opacity: 1; }

        .hk-deal-card { background:#fff; border-radius:4px; padding:16px; transition:box-shadow 0.2s; cursor:pointer; }
        .hk-deal-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.18); }
        .hk-sub-item { transition: opacity 0.15s; }
        .hk-sub-item:hover { opacity: 0.78; }

        .hk-prod-wrap { transition: transform 0.2s, box-shadow 0.2s; }
        .hk-prod-wrap:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.13); }

        .hk-ord-row { transition: background 0.15s; cursor:pointer; }
        .hk-ord-row:hover { background: #f3f3f3 !important; }

        .hk-camp-card { background:#fff; border-radius:4px; overflow:hidden; transition:box-shadow 0.2s; cursor:pointer; border:1px solid #ddd; }
        .hk-camp-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.15); }

        .hk-skel { background:linear-gradient(90deg,#e8e8e8 25%,#f5f5f5 50%,#e8e8e8 75%); background-size:400% 100%; animation:skel 1.4s ease-in-out infinite; border-radius:4px; }
        @keyframes skel { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .hk-promo-pill { display:inline-block; border:1px solid rgba(255,255,255,0.25); border-radius:3px; padding:4px 12px; font-size:0.72rem; font-weight:700; margin-bottom:8px; }

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

        .hk-see-more { color:#007185; font-size:0.8rem; font-weight:500; text-decoration:none; }
        .hk-see-more:hover { color:#c7511f; text-decoration:underline; }

        .hk-cta { display:inline-block; background:linear-gradient(180deg,#f7dfa5,#f0c14b); border:1px solid #a88734; border-radius:3px; padding:9px 24px; font-size:0.88rem; font-weight:700; color:#111; cursor:pointer; margin-top:14px; transition:background 0.15s; font-family:inherit; }
        .hk-cta:hover { background:linear-gradient(180deg,#f5d78e,#e8b842); }
        .hk-cta-blue { background:linear-gradient(180deg,#7ac6e6,#4ba3cc); border-color:#367c96; color:#fff; }
        .hk-cta-blue:hover { background:linear-gradient(180deg,#6ab8da,#3a95be); }

        .hk-digit { background:#111; color:#fff; border-radius:4px; padding:6px 10px; font-size:1.15rem; font-weight:800; min-width:36px; text-align:center; display:inline-block; font-variant-numeric:tabular-nums; }

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

      {/* ════════════ HERO BANNER AD — shows carousel of ads; renders nothing if no ──
           active ad exists, so the deal grid below becomes the top section right
           under the accent bar instead of showing a fallback carousel ════════════ */}
      <HeroBannerAd style={{ marginTop: 24 }} />

      {/* ════════════ MAIN CONTENT ════════════ */}
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '12px 12px 60px' }}>

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

        {/* ── Scroll Banner Ad — Flipkart-style 2.5 cards, above Hold Deals ── */}
        <ScrollBannerAd>
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
        </ScrollBannerAd>

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
                  const rawCampaignId = String(c.campaign_id || c.id || '').split(':')[0];
                  const campaignId    = rawCampaignId ? parseInt(rawCampaignId, 10) || null : null;
                  const currentHold  = c.current_hold || 0;
                  const target       = c.target || 0;
                  const retailPrice  = Number(c.retail_price) || 0;
                  const holdPrice    = Number(c.hold_price)   || 0;
                  const discountPct  = currentHold;
                  const displayPrice = discountPct > 0 ? Math.round(retailPrice * (1 - discountPct / 100)) : retailPrice;
                  const maxDiscountPct = target;
                  const bestGroupPrice = target > 0 ? Math.round(retailPrice * (1 - maxDiscountPct / 100)) : holdPrice;
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
                    ? (_firstImg.startsWith('http') ? _firstImg : _firstImg.startsWith('/uploads') ? _firstImg.replace('/uploads', '/seller-uploads') : `/seller-uploads${_firstImg.startsWith('/') ? '' : '/'}${_firstImg}`)
                    : FALLBACK;
                  const detailPath  = campaignId ? `/campaigns/${campaignId}` : '/campaigns';

                  return (
                    <div
                      key={campaignId ?? c.product_id}
                      onClick={() => guardedNav(detailPath)}
                      style={{ background: '#fff', borderRadius: 8, border: '1px solid #e3e6e6', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'box-shadow 0.2s, border-color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.14)'; e.currentTarget.style.borderColor = '#c9cdd2'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e3e6e6'; }}
                    >
                      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#9ca3af', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                        ♡
                      </div>
                      <div style={{ background: '#f9fafb', overflow: 'hidden' }}>
                        <img src={imgSrc} alt={c.product_name} onError={e => { e.target.src = FALLBACK; }}
                          style={{ width: '100%', height: 160, objectFit: 'contain', display: 'block' }} />
                      </div>
                      <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <p style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: 2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {c.category || 'Hold Deal'}
                        </p>
                        <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f1111', marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.3em' }}>
                          {c.product_name}
                        </p>
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
                        <div style={{ marginBottom: 8, marginTop: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f1111' }}>₹{displayPrice.toLocaleString('en-IN')}</span>
                            {discountPct > 0 && <span style={{ fontSize: '0.78rem', color: '#9ca3af', textDecoration: 'line-through' }}>₹{retailPrice.toLocaleString('en-IN')}</span>}
                          </div>
                          <p style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 1 }}>Inclusive of all taxes</p>
                        </div>
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
        <div style={{ background: '#f4f6f8', borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd', overflow: 'hidden', padding: '10px 0', marginBottom: 12, borderRadius: 4, display: 'none' }}>
          <div className="hk-brands-track">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <div key={i} className="hk-brand-item">
                <img src={b.logo} alt={b.name} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                <span style={{ display: 'none', fontWeight: 700, fontSize: '0.9rem', color: '#333' }}>{b.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Based on your cart (logged in) / Today's Deals (guest or new user) ── */}
        <BasedOnCartCarousel
          items={
            !isGuest && personalizedCart.length > 0 ? personalizedCart
            : guestDeals.length > 0 ? guestDeals
            : featured
          }
          loading={isGuest ? guestLoading : (personalizedLoading && personalizedCart.length === 0 && featured.length === 0)}
          guardedNav={guardedNav}
          title={!isGuest && personalizedCart.length > 0 ? 'Based on your cart' : "Today's Deals"}
        />

        {/* ── Product Spotlight Ad — renders nothing if no active ads, so the next ──
             section (Trending Now / Based on browsing history) moves up directly
             instead of showing a dummy promo banner ── */}
        <ProductSpotlightAd />

        {/* ── Based on your browsing history (logged in) / Trending Now (guest or new user) ── */}
        {isGuest
          ? <BrowsingHistoryCarousel
              items={guestTrending}
              loading={guestLoading}
              guardedNav={guardedNav}
              joinedProductIds={joinedProductIds}
              title="Trending Now"
            />
          : personalizedBrowsing.length > 0
            ? <BrowsingHistoryCarousel
                items={personalizedBrowsing}
                loading={personalizedLoading}
                guardedNav={guardedNav}
                joinedProductIds={joinedProductIds}
                title="Based on your browsing history"
              />
            : <BrowsingHistoryCarousel
                items={guestTrending}
                loading={personalizedLoading}
                guardedNav={guardedNav}
                joinedProductIds={joinedProductIds}
                title="Trending Now"
              />
        }

        {/* ── Explore more / Keep shopping for (logged in) / Top Offers (guest) ── */}
        {isGuest
          ? <ShopMoreGrid
              items={guestTopRated}
              allProducts={featured}
              categories={categories}
              loading={guestLoading}
              guardedNav={guardedNav}
            />
          : <ShopMoreGrid
              items={personalizedBrowsing}
              allProducts={featured}
              categories={categories}
              loading={personalizedLoading}
              guardedNav={guardedNav}
            />
        }

        {/* ── Suggested For You (logged in only) / Most Popular (guest) ── */}
        {isGuest
          ? <SuggestedForYou
              items={guestTopRated.length > 0 ? guestTopRated : guestDeals}
              loading={guestLoading}
              guardedNav={guardedNav}
              title="Most Popular"
            />
          : <SuggestedForYou
              items={personalizedSuggested}
              loading={personalizedLoading}
              guardedNav={guardedNav}
              title="Suggested For You"
            />
        }

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
                {featured.map((p, i) => (
                  <React.Fragment key={p.productId}>
                    {i === 4 && (
                      <div style={{ borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', minHeight: 250 }}>
                        <div style={{ width: 300, height: 250, flexShrink: 0, overflow: 'hidden' }}>
                          <SidebarBoxAd style={{ marginTop: 0, marginLeft: 0, marginRight: 0 }} />
                        </div>
                      </div>
                    )}
                    <div className="hk-prod-wrap">
                      <ProductCard product={p} alreadyJoined={joinedProductIds.has(Number(p.productId))} />
                    </div>
                  </React.Fragment>
                ))}
                {featuredLoading && [...Array(5)].map((_, i) => (
                  <div key={`skel-${i}`} className="hk-skel" style={{ height: 280 }} />
                ))}
              </div>
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

      {/* ════════════ POPUP AD ════════════ */}
      <PopupAd />

    </div>
  );
}