// src/components/AdBanner.jsx
// Hero Banner  : auto-scrolling carousel (multiple ads, 5s interval)
// Scroll Banner: Flipkart-style 2.5 visible cards, smooth CSS slide, 4s auto-advance
// Sidebar Box  : cycles ALL active ads every 10 seconds
// Product Spot : single ad, exact 400×400 px
// Popup        : bottom-center, ONCE per login session, 10 second delay

import { useEffect, useState, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

async function fetchAds(adType) {
  try {
    const res  = await fetch(`${API_BASE}/api/customer/ads/active?type=${adType}`);
    const json = await res.json();
    if (json.success && json.data.length > 0) return json.data;
  } catch (_) {}
  return [];
}

// Derive a per-login key from the JWT token fingerprint
function getPopupKey() {
  try {
    const token = localStorage.getItem('customerToken') || '';
    const fingerprint = token.slice(0, 24) || 'guest';
    return `hk_popup_shown_${fingerprint}`;
  } catch {
    return 'hk_popup_shown_guest';
  }
}

// Check if 30 minutes have passed since last popup
function shouldShowPopup() {
  try {
    const key = getPopupKey();
    const last = localStorage.getItem(key);
    if (!last) return true;
    return Date.now() - parseInt(last, 10) >= 30 * 60 * 1000; // 30 minutes
  } catch {
    return true;
  }
}

function markPopupShown() {
  try {
    localStorage.setItem(getPopupKey(), String(Date.now()));
  } catch {}
}
export function HeroBannerAd({ style = {}, children }) {
  const [ads,    setAds]    = useState([]);
  const [idx,    setIdx]    = useState(0);
  const [fading, setFading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef            = useRef(null);

  useEffect(() => {
    fetchAds('hero_banner').then(result => { setAds(result); setLoaded(true); });
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => { setIdx(i => (i + 1) % ads.length); setFading(false); }, 400);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [ads]);

  if (!loaded) return null;
  if (!ads.length) return children ?? null;

  const ad = ads[idx];
  const imgEl = (
    <img
      className="hk-hero-img"
      src={ad.imageUrl}
      alt={ad.title || 'Advertisement'}
      style={{ width: 1200, height: 300, objectFit: 'fill', display: 'block',
        transition: 'opacity 0.4s ease', opacity: fading ? 0 : 1, imageRendering: 'auto' }}
      onError={e => { e.target.parentElement.style.display = 'none'; }}
    />
  );

  return (
    <div className="hk-hero-wrap" style={{ width: 1200, maxWidth: '100%', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto', ...style }}>
      <style>{`
        .hk-hero-dots { display:flex; gap:6px; justify-content:center; margin-top:6px; }
        .hk-hero-dot  { width:8px; height:8px; border-radius:50%; background:rgba(0,0,0,0.22); border:none; cursor:pointer; padding:0; transition:all 0.3s; }
        .hk-hero-dot.active { background:#1a73e8; width:22px; border-radius:4px; }
        /* ── Mobile/responsive only: scale the fixed 1200×300 banner image down to
             fit its shrunk wrapper instead of being clipped by overflow:hidden.
             Also leave a little side space (matching the rest of the page layout)
             and give it slightly more height instead of looking too thin/cropped. ── */
        @media (max-width: 768px) {
          .hk-hero-wrap { width: calc(100% - 8px) !important; margin: 8px auto 0 !important; border-radius: 6px; }
          .hk-hero-img  { width: 100% !important; height: auto !important; aspect-ratio: 1200 / 680 !important; }
          .hk-hero-dot  { width: 6px !important; height: 6px !important; }
          .hk-hero-dot.active { width: 16px !important; }
        }
      `}</style>
      {ad.redirectUrl
        ? <a href={ad.redirectUrl} target="_blank" rel="noopener noreferrer" style={{ display:'block', textDecoration:'none' }}>{imgEl}</a>
        : imgEl}
      {ads.length > 1 && (
        <div className="hk-hero-dots">
          {ads.map((_, i) => (
            <button key={i} className={`hk-hero-dot${i === idx ? ' active' : ''}`}
              onClick={() => { clearInterval(timerRef.current); setFading(true); setTimeout(() => { setIdx(i); setFading(false); }, 400); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Scroll Banner — Flipkart Epic Sale style ──────────────────────────────────
// Shows 2.5 visible cards (so user sees there's more). Smooth CSS translateX slide.
// Auto-advances every 4 seconds. Falls back to children if no active ads.
// ── Scroll Banner — 2.5 visible cards, slides left every 4 s, no arrows ────────
// Strategy: render a track of (ads + first-2 clones). Use a ref-based translateX
// so we can silently reset position after clones scroll in (infinite loop illusion).
export function ScrollBannerAd({ style = {}, children }) {
  const [ads,    setAds]    = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tick,   setTick]   = useState(0);   // forces dot re-render each slide
  const trackRef  = useRef(null);
  const posRef    = useRef(0);
  const animating = useRef(false);

  useEffect(() => {
    fetchAds('scroll_banner').then(result => { setAds(result); setLoaded(true); });
  }, []);

  // cardWidthPx = containerWidth / 2.5
  // We move the track by exactly one card width on each tick.
  useEffect(() => {
    if (ads.length < 2) return;

    const INTERVAL = 4000;
    const DURATION = 500; // ms for the slide animation

    function slide() {
      if (animating.current) return;
      const track = trackRef.current;
      if (!track) return;

      // Read the actual rendered card width (responsive-aware) instead of a
      // hardcoded desktop value, so the slide step is correct at any screen size.
      const firstCard = track.querySelector('.hk-sb-card');
      const cardWidth  = firstCard ? firstCard.offsetWidth : 600;
      const gap        = 8;
      const step       = cardWidth + gap;

      posRef.current += 1;
      animating.current = true;
      setTick(t => t + 1); // update dots

      // Animate smoothly
      track.style.transition = `transform ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      track.style.transform  = `translateX(-${posRef.current * step}px)`;

      setTimeout(() => {
        // If we've scrolled past the real ads into the clone zone, jump back silently
        if (posRef.current >= ads.length) {
          posRef.current = 0;
          track.style.transition = 'none';
          track.style.transform  = 'translateX(0)';
        }
        animating.current = false;
      }, DURATION + 20);
    }

    const timer = setInterval(slide, INTERVAL);
    return () => clearInterval(timer);
  }, [ads]);

  if (!loaded) return null;
  if (!ads.length) return children ?? null;

  // Duplicate ads array so last item wraps seamlessly back to first
  const loopAds = [...ads, ...ads.slice(0, 3)];

  return (
    <div style={{ marginBottom: 12, width: '100%', ...style }}>
      <style>{`
        .hk-sb-outer {
          width: 100%;
          overflow: hidden;
          background: #f0f0f0;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          position: relative;
          padding: 8px;
          box-sizing: border-box;
        }
        .hk-sb-track {
          display: flex;
          gap: 8px;
          will-change: transform;
          transform: translateX(0);
        }
        .hk-sb-card {
          flex-shrink: 0;
          width: 600px;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          background: #ddd;
        }
        .hk-sb-card img {
          width: 600px;
          height: 200px;
          object-fit: fill;
          display: block;
        }
        .hk-sb-ad-badge {
          position: absolute; bottom: 7px; right: 8px;
          background: rgba(0,0,0,0.52); color: #fff;
          font-size: 0.6rem; padding: 2px 6px; border-radius: 3px;
          font-weight: 700; letter-spacing: 0.6px; pointer-events: none;
        }
        .hk-sb-dots {
          display: flex; justify-content: center; gap: 5px; margin-top: 7px;
        }
        .hk-sb-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(0,0,0,0.18); border: none; cursor: pointer; padding: 0;
          transition: all 0.3s;
        }
        .hk-sb-dot.active { background: #2874f0; width: 22px; border-radius: 4px; }

        /* ── Mobile/responsive only: shrink the fixed 600px scroll-banner cards
             so they fit the screen instead of overflowing almost entirely off it ── */
        @media (max-width: 768px) {
          .hk-sb-card     { width: 86vw !important; }
          .hk-sb-card img { width: 100% !important; height: auto !important; aspect-ratio: 600 / 360 !important; }
        }
      `}</style>

      <div className="hk-sb-outer">
        <div className="hk-sb-track" ref={trackRef}>
          {loopAds.map((ad, i) => (
            <div
              key={`${ad.id || i}-${i}`}
              className="hk-sb-card"
              onClick={() => { if (ad.redirectUrl) window.open(ad.redirectUrl, '_blank', 'noopener'); }}
            >
              <img
                src={ad.imageUrl}
                alt={ad.title || 'Advertisement'}
                onError={e => { e.target.parentElement.style.display = 'none'; }}
              />
              <span className="hk-sb-ad-badge">AD</span>
            </div>
          ))}
        </div>
      </div>

      {ads.length > 1 && (
        <div className="hk-sb-dots">
          {ads.map((_, i) => (
            <button
              key={i}
              className={`hk-sb-dot${i === (posRef.current % ads.length) ? ' active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar Box Ad — cycles ALL active ads every 10 seconds ───────────────────
// Always renders a placeholder so the sidebar layout doesn't collapse.
export function SidebarBoxAd({ style = {} }) {
  const [ads,    setAds]    = useState([]);
  const [idx,    setIdx]    = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef            = useRef(null);

  useEffect(() => {
    fetchAds('sidebar_box').then(result => { setAds(result); });
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => { setIdx(i => (i + 1) % ads.length); setFading(false); }, 350);
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, [ads]);

  if (!ads.length) return (
    <div className="hk-sidebar-ad-box" style={{
      width: 300, marginTop: 16, borderRadius: 6,
      overflow: 'hidden', border: '1px dashed #d1d5db',
      background: 'linear-gradient(135deg,#f0f4ff,#e8f0fe)',
      marginLeft: 'auto', marginRight: 'auto',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: 250, gap: 8,
      ...style
    }}>
      <div style={{ fontSize: '2rem' }}>📢</div>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#2a5298' }}>Your Ad Here</div>
      <div style={{ fontSize: '0.72rem', color: '#6b7280', textAlign: 'center', padding: '0 16px' }}>300 × 250 px · Sidebar Box</div>
      <style>{`
        @media (max-width: 768px) {
          .hk-sidebar-ad-box { width: 100% !important; max-width: 300px !important; height: auto !important; aspect-ratio: 300 / 190 !important; }
        }
      `}</style>
    </div>
  );

  const ad = ads[idx];
  const imgEl = (
    <img
      className="hk-sidebar-ad-img"
      src={ad.imageUrl}
      alt={ad.title || 'Advertisement'}
      style={{
        width: 300, height: 250, minHeight: 250,
        objectFit: 'fill', display: 'block',
        transition: 'opacity 0.35s ease',
        opacity: fading ? 0 : 1,
        imageRendering: 'auto',
      }}
      onError={e => { e.target.parentElement.style.display = 'none'; }}
    />
  );

  return (
    <div className="hk-sidebar-ad-box" style={{
      width: 300, marginTop: 16, borderRadius: 6,
      overflow: 'hidden', border: '1px solid #e5e7eb',
      position: 'relative', background: '#f9f9f9',
      marginLeft: 'auto', marginRight: 'auto',
      ...style
    }}>
      {/* AD label */}
      <div style={{
        position: 'absolute', top: 6, left: 6, zIndex: 2,
        background: 'rgba(0,0,0,0.45)', color: '#fff',
        fontSize: '0.58rem', padding: '1px 5px', borderRadius: 3,
        fontWeight: 700, letterSpacing: '0.5px', pointerEvents: 'none',
      }}>AD</div>

      {ad.redirectUrl
        ? <a href={ad.redirectUrl} target="_blank" rel="noopener noreferrer" style={{ display:'block', textDecoration:'none' }}>{imgEl}</a>
        : imgEl}

      {ads.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '5px 0 4px', background: '#f9f9f9' }}>
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => { clearInterval(timerRef.current); setIdx(i); }}
              style={{
                width: i === idx ? 16 : 6, height: 6, borderRadius: 99, padding: 0,
                border: 'none', cursor: 'pointer',
                background: i === idx ? '#2a5298' : 'rgba(0,0,0,0.2)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .hk-sidebar-ad-box { width: 100% !important; max-width: 300px !important; }
          .hk-sidebar-ad-img { width: 100% !important; height: auto !important; aspect-ratio: 300 / 190 !important; }
        }
      `}</style>
    </div>
  );
}

// ── Product Spotlight Ad ───────────────────────────────────────────────────────
export function ProductSpotlightAd({ style = {}, children }) {
  const [ads,    setAds]    = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tick,   setTick]   = useState(0);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const trackRef  = useRef(null);
  const posRef    = useRef(0);   // current page index (0-based)
  const animating = useRef(false);

  useEffect(() => {
    fetchAds('product_spotlight').then(result => { setAds(result); setLoaded(true); });
  }, []);

  // Track viewport so mobile (1-per-page / 3s) vs desktop (3-per-page / 5s)
  // behavior stays correct across resizes, without affecting desktop logic.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const groupSize = isMobile ? 1 : 3;

  useEffect(() => {
    if (ads.length <= groupSize) return;

    const INTERVAL = isMobile ? 3000 : 5000;
    const DURATION = 500;

    // page width = container width; each page is exactly containerWidth px
    function getStep() {
      const track = trackRef.current;
      if (!track) return 0;
      return track.parentElement.offsetWidth;
    }

    function slide() {
      if (animating.current) return;
      const track = trackRef.current;
      if (!track) return;

      const totalPages = Math.ceil(ads.length / groupSize);
      posRef.current += 1;
      animating.current = true;
      setTick(t => t + 1);

      const step = getStep();
      track.style.transition = `transform ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      track.style.transform  = `translateX(-${posRef.current * step}px)`;

      setTimeout(() => {
        if (posRef.current >= totalPages) {
          posRef.current = 0;
          track.style.transition = 'none';
          track.style.transform  = 'translateX(0)';
        }
        animating.current = false;
      }, DURATION + 20);
    }

    const timer = setInterval(slide, INTERVAL);
    return () => clearInterval(timer);
  }, [ads, groupSize, isMobile]);

  if (!loaded) return null;
  if (!ads.length) return children ?? null;

  const totalPages  = Math.ceil(ads.length / groupSize);
  const pages       = Array.from({ length: totalPages }, (_, p) =>
    Array.from({ length: groupSize }, (_, offset) => ads[(p * groupSize + offset) % ads.length])
  );
  const loopPages   = [...pages, pages[0]];
  const currentPage = posRef.current % totalPages;

  return (
    <div style={{ width: '100%', marginBottom: 12, background: '#f0f0f0', borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', overflow: 'hidden', ...style }}>
      <div ref={trackRef} style={{ display: 'flex', willChange: 'transform', transform: 'translateX(0)' }}>
        {loopPages.map((page, pi) => (
          <div key={pi} style={{ display: 'flex', gap: 0, flexShrink: 0, width: '100%', padding: '8px 0', boxSizing: 'border-box', justifyContent: 'space-evenly', alignItems: 'center' }}>
            {page.map((ad, i) => {
              const imgEl = (
                <img
                  className="hk-spotlight-img"
                  src={ad.imageUrl}
                  alt={ad.title || 'Advertisement'}
                  style={{ width: 400, height: 400, objectFit: 'fill', display: 'block', imageRendering: 'auto' }}
                  onError={e => { e.target.parentElement.style.display = 'none'; }}
                />
              );
              return (
                <div key={i} className="hk-spotlight-box" style={{ width: 400, height: 400, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                  {ad.redirectUrl
                    ? <a href={ad.redirectUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>{imgEl}</a>
                    : imgEl}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .hk-spotlight-box { width: ${100 / (pages[0]?.length || 1)}% !important; height: auto !important; aspect-ratio: 1 / 0.82 !important; }
          .hk-spotlight-img { width: 100% !important; height: auto !important; aspect-ratio: 1 / 0.82 !important; }
        }
      `}</style>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', paddingBottom: 8 }}>
          {Array.from({ length: totalPages }).map((_, p) => (
            <button key={p} style={{
              width: p === currentPage ? 22 : 8, height: 8,
              borderRadius: 99, padding: 0, border: 'none', cursor: 'pointer',
              background: p === currentPage ? '#1a73e8' : 'rgba(0,0,0,0.22)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Popup Ad ──────────────────────────────────────────────────────────────────
// Shows ONCE PER LOGIN SESSION, 10 seconds after login.
// Key is derived from JWT token fingerprint — new login = new token = popup shows again.
export function PopupAd() {
  const [ad,   setAd]   = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchAds('popup').then(ads => {
      if (!ads.length) return;
      // Show popup if 30 minutes have passed since last shown
      if (shouldShowPopup()) {
        setTimeout(() => {
          setAd(ads[0]);
          setOpen(true);
        }, 10000); // 10-second delay on page load
      }
    });

    // Also set a recurring 30-minute interval to show popup again
    const interval = setInterval(() => {
      fetchAds('popup').then(ads => {
        if (!ads.length) return;
        setAd(ads[0]);
        setOpen(true);
      });
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  function close() {
    markPopupShown(); // Record timestamp so it won't show again for 30 minutes
    setOpen(false);
  }

  if (!ad || !open) return null;

  return (
    <>
      <style>{`
        @keyframes hk-popup-rise {
          from { transform: translateX(-50%) translateY(30px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
      `}</style>

      <div
        onClick={close}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.45)' }}
      />

      <div style={{
        position: 'fixed', bottom: 24, left: '50%',
        transform: 'translateX(-50%)', zIndex: 9999,
        width: 600, maxWidth: 'calc(100vw - 32px)',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.40)',
        animation: 'hk-popup-rise 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        background: '#000',
      }}>
        <button
          onClick={close}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.60)', border: 'none',
            color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          }}
          aria-label="Close advertisement"
        >×</button>

        {ad.redirectUrl ? (
          <a href={ad.redirectUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', textDecoration: 'none' }} onClick={close}>
            <img className="hk-popup-img" src={ad.imageUrl} alt={ad.title || 'Advertisement'}
              style={{ width: 600, height: 500, display: 'block', objectFit: 'fill', imageRendering: 'auto' }}
              onError={close} />
          </a>
        ) : (
          <img className="hk-popup-img" src={ad.imageUrl} alt={ad.title || 'Advertisement'}
            style={{ width: 600, height: 500, display: 'block', objectFit: 'fill', imageRendering: 'auto' }}
            onError={close} />
        )}
      </div>
      <style>{`
        /* ── Mobile/responsive only: scale the fixed 600×500 popup image down so
             it doesn't fill almost the entire screen height ── */
        @media (max-width: 768px) {
          .hk-popup-img { width: 100% !important; height: auto !important; aspect-ratio: 600 / 500 !important; }
        }
      `}</style>
    </>
  );
}

// ── Legacy default export — kept for backward compat ──────────────────────────
export default function AdBanner({ adType }) {
  if (adType === 'sidebar_box')        return <SidebarBoxAd />;
  if (adType === 'hero_banner')        return <HeroBannerAd />;
  if (adType === 'scroll_banner')      return <ScrollBannerAd />;
  if (adType === 'product_spotlight')  return <ProductSpotlightAd />;
  if (adType === 'popup')              return <PopupAd />;
  return null;
}