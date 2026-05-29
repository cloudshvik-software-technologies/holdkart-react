// import { useState, useEffect, useRef, useCallback } from 'react';
// import { Link } from 'react-router-dom';

// const NAV_LINKS = [
//   { label: 'How it Works', href: '#how-it-works' },
//   { label: 'Hold Deals', href: '#hold-deals' },
//   { label: 'Categories', href: '#categories' },
//   { label: 'Why HoldKart', href: '#why' },
// ];

// const MARQUEE_ITEMS = [
//   '📱 Smartphones', '💻 Laptops', '🎧 Audio Gear', '📷 Cameras',
//   '🎮 Gaming', '📺 Smart TVs', '⌚ Wearables', '🔌 Accessories',
//   '🏠 Home Appliances', '🧴 Beauty & Wellness',
// ];

// const STATS = [
//   { value: 50000, suffix: '+', label: 'Happy Customers', icon: '😊' },
//   { value: 2, suffix: 'L+', label: 'Products Listed', icon: '📦' },
//   { value: 85, suffix: '%', label: 'Savings vs Retail', icon: '💰' },
//   { value: 500, suffix: '+', label: 'Cities Covered', icon: '🗺️' },
// ];

// const STEPS = [
//   { num: '01', icon: '📝', title: 'Register Free', desc: 'Create your account in seconds with just your email and mobile number.' },
//   { num: '02', icon: '🔍', title: 'Browse Products', desc: 'Explore hundreds of quality-certified products across all categories.' },
//   { num: '03', icon: '🎯', title: 'Join a Hold Deal', desc: 'Reserve a product at a discounted hold price before the campaign fills up.' },
//   { num: '04', icon: '🚚', title: 'Receive & Enjoy', desc: 'Once the hold target is met, your order ships fast with full warranty.' },
// ];

// const BENEFITS = [
//   { icon: '💸', title: 'Unbeatable Prices', desc: 'Hold deals unlock group-buy pricing up to 85% below retail. The more people who join, the lower the price.' },
//   { icon: '✅', title: 'Quality Certified', desc: 'Every product is tested, certified, and comes with a valid warranty. No surprises, no fakes.' },
//   { icon: '🔒', title: 'Safe Payments', desc: 'Your money is held securely until the deal closes. Full refund if the campaign doesn\'t hit its target.' },
//   { icon: '🚚', title: 'Pan-India Delivery', desc: 'Fast, reliable shipping powered by 10+ top logistics partners across 500+ cities in India.' },
//   { icon: '🔄', title: '7-Day Returns', desc: 'Not satisfied? Return it within 7 days for a full, no-questions-asked refund.' },
//   { icon: '💬', title: '24/7 Support', desc: 'Our dedicated customer support team is always here to help you with any query.' },
// ];

// const CATEGORIES = [
//   { icon: '📱', name: 'Mobiles', desc: 'Smartphones & tablets' },
//   { icon: '💻', name: 'Laptops', desc: 'Work & gaming machines' },
//   { icon: '🎧', name: 'Audio', desc: 'Earbuds, headphones & speakers' },
//   { icon: '📷', name: 'Cameras', desc: 'DSLR, mirrorless & accessories' },
//   { icon: '🎮', name: 'Gaming', desc: 'Consoles, controllers & games' },
//   { icon: '📺', name: 'TVs', desc: 'Smart TVs & home theatre' },
//   { icon: '⌚', name: 'Wearables', desc: 'Smartwatches & fitness bands' },
//   { icon: '🔌', name: 'Accessories', desc: 'Cables, chargers & more' },
//   { icon: '🏠', name: 'Appliances', desc: 'Kitchen & home essentials' },
//   { icon: '🧴', name: 'Beauty', desc: 'Skincare, wellness & grooming' },
// ];

// const FAQS = [
//   { q: 'What is a Hold Deal?', a: 'A Hold Deal is a group-buy campaign where buyers reserve a product at a discounted price. The deal unlocks only when enough buyers join. If the target is not met, you get a full refund.' },
//   { q: 'Is my payment safe?', a: 'Absolutely. Your payment is held securely in escrow until the deal is confirmed. If the target is not reached, your full amount is refunded automatically.' },
//   { q: 'How much can I save?', a: 'Hold Deals can save you anywhere from 20% to 85% compared to retail prices, depending on the product and how many people join the campaign.' },
//   { q: 'When will I receive my order?', a: 'Once the hold target is met and the deal closes, orders are shipped within 2–3 business days and delivered within 5–7 business days across India.' },
//   { q: 'Can I return a product?', a: 'Yes! We offer a 7-day no-questions-asked return policy. Just raise a return request from your orders page and our team will arrange a pickup.' },
//   { q: 'Do products come with a warranty?', a: 'Yes. All products on HoldKart are certified and come with the manufacturer\'s warranty. We also offer extended warranty options on select products.' },
// ];

// function useCounter(target, duration = 2000, started = false) {
//   const [count, setCount] = useState(0);
//   useEffect(() => {
//     if (!started) return;
//     let start = 0;
//     const step = target / (duration / 16);
//     const timer = setInterval(() => {
//       start += step;
//       if (start >= target) { setCount(target); clearInterval(timer); }
//       else setCount(Math.floor(start));
//     }, 16);
//     return () => clearInterval(timer);
//   }, [target, duration, started]);
//   return count;
// }

// function useInView(threshold = 0.15) {
//   const ref = useRef(null);
//   const [inView, setInView] = useState(false);
//   useEffect(() => {
//     const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
//     if (ref.current) obs.observe(ref.current);
//     return () => obs.disconnect();
//   }, [threshold]);
//   return [ref, inView];
// }

// function AnimatedStat({ value, prefix = '', suffix = '', label, icon, started }) {
//   const count = useCounter(value, 1800, started);
//   return (
//     <div style={{ textAlign: 'center', padding: '40px 20px', flex: '1 1 180px' }}>
//       <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
//       <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
//         {prefix}{count.toLocaleString('en-IN')}{suffix}
//       </div>
//       <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', marginTop: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
//     </div>
//   );
// }

// export default function Home() {
//   const [scrolled, setScrolled] = useState(false);
//   const [openFaq, setOpenFaq] = useState(null);
//   const [statsRef, statsInView] = useInView();

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 60);
//     window.addEventListener('scroll', onScroll, { passive: true });
//     return () => window.removeEventListener('scroll', onScroll);
//   }, []);

//   const smoothScroll = useCallback((href) => {
//     const el = document.querySelector(href);
//     if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
//   }, []);

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
//         :root {
//           --blue-deep: #0f2557; --blue-mid: #1e3c72; --blue-brand: #2a5298;
//           --blue-light: #3b6fd4; --blue-pale: #eef4ff; --blue-xpale: #f5f8ff;
//           --green: #10b981; --text-primary: #0a1628; --text-secondary: #475569;
//           --text-muted: #94a3b8; --border: #e2e8f5; --surface: #fff;
//           --shadow-sm: 0 1px 4px rgba(15,37,87,0.06); --shadow-md: 0 4px 20px rgba(15,37,87,0.1);
//           --shadow-lg: 0 12px 40px rgba(15,37,87,0.15); --radius: 16px;
//         }
//         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
//         html { scroll-behavior: smooth; }
//         body { font-family: 'Instrument Sans', sans-serif; background: #fff; color: var(--text-primary); -webkit-font-smoothing: antialiased; }
//         a { text-decoration: none; }

//         .landing-btn-primary {
//           display: inline-flex; align-items: center; gap: 8px;
//           background: var(--blue-mid); color: #fff;
//           padding: 13px 26px; border-radius: 10px;
//           font-family: 'Instrument Sans', sans-serif; font-weight: 600; font-size: 0.95rem;
//           transition: all 0.22s; border: none; cursor: pointer;
//           box-shadow: 0 4px 14px rgba(30,60,114,0.35);
//         }
//         .landing-btn-primary:hover { background: var(--blue-light); transform: translateY(-2px); }

//         .landing-btn-white {
//           display: inline-flex; align-items: center; gap: 8px;
//           background: #fff; color: var(--blue-mid);
//           padding: 13px 26px; border-radius: 10px;
//           font-family: 'Instrument Sans', sans-serif; font-weight: 700; font-size: 0.95rem;
//           transition: all 0.22s; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
//         }
//         .landing-btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.22); }

//         .landing-btn-ghost {
//           display: inline-flex; align-items: center; gap: 8px;
//           background: rgba(255,255,255,0.1); color: #fff;
//           padding: 12px 22px; border-radius: 10px;
//           font-family: 'Instrument Sans', sans-serif; font-weight: 500; font-size: 0.92rem;
//           border: 1.5px solid rgba(255,255,255,0.25); transition: all 0.22s;
//           backdrop-filter: blur(8px);
//         }
//         .landing-btn-ghost:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.5); transform: translateY(-2px); }

//         .landing-btn-outline {
//           display: inline-flex; align-items: center; gap: 8px;
//           background: transparent; color: var(--blue-mid);
//           padding: 12px 22px; border-radius: 10px;
//           font-family: 'Instrument Sans', sans-serif; font-weight: 600; font-size: 0.92rem;
//           border: 1.5px solid var(--border); transition: all 0.22s;
//         }
//         .landing-btn-outline:hover { border-color: var(--blue-brand); background: var(--blue-xpale); }

//         .landing-chip {
//           display: inline-flex; align-items: center; gap: 6px;
//           background: var(--blue-pale); color: var(--blue-mid);
//           padding: 5px 14px; border-radius: 100px;
//           font-size: 0.75rem; font-weight: 600;
//           letter-spacing: 0.07em; text-transform: uppercase;
//         }

//         .marquee-wrapper { overflow: hidden; white-space: nowrap; }
//         .marquee-track { display: inline-flex; gap: 0; width: max-content; animation: marquee 26s linear infinite; }
//         .marquee-wrapper:hover .marquee-track { animation-play-state: paused; }
//         @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

//         .hov-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
//         .hov-lift:hover { transform: translateY(-5px); box-shadow: 0 24px 60px rgba(15,37,87,0.2) !important; }

//         .landing-nav-link { color: var(--text-secondary); font-weight: 500; font-size: 0.9rem; transition: color 0.2s; background: none; border: none; cursor: pointer; font-family: 'Instrument Sans'; padding: 0; }
//         .landing-nav-link:hover { color: var(--blue-mid); }

//         .faq-body-l { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
//         .faq-body-l.open { max-height: 200px; }

//         @keyframes pulse-l { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.4)} }
//         .pulse-dot-l { animation: pulse-l 2s ease-in-out infinite; }
//         @keyframes float-l { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
//         .float-l { animation: float-l 4s ease-in-out infinite; }
//         .grad-text-l {
//           background: linear-gradient(135deg, #93c5fd 0%, #a5b4fc 50%, #6ee7b7 100%);
//           -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
//         }
//         ::-webkit-scrollbar { width: 5px; }
//         ::-webkit-scrollbar-track { background: #f0f5ff; }
//         ::-webkit-scrollbar-thumb { background: var(--blue-brand); border-radius: 4px; }
//       `}</style>

//       {/* ── NAVBAR ── */}
//       <nav style={{
//         position: 'sticky', top: 0, zIndex: 1000,
//         background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.98)',
//         backdropFilter: 'blur(20px)',
//         borderBottom: `1px solid ${scrolled ? 'rgba(226,232,245,0.8)' : 'rgba(226,232,245,0.5)'}`,
//         boxShadow: scrolled ? '0 4px 30px rgba(15,37,87,0.08)' : 'none',
//         transition: 'all 0.3s ease',
//       }}>
//         <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64, gap: 40 }}>
//           <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
//             <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1e3c72, #2a5298)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🛒</div>
//             <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: '1.2rem', color: '#0a1628', letterSpacing: '-0.03em' }}>
//               Hold<span style={{ color: '#2a5298' }}>Kart</span>
//             </span>
//           </Link>

//           <div style={{ display: 'flex', gap: 32, flex: 1, justifyContent: 'center' }}>
//             {NAV_LINKS.map(l => (
//               <button key={l.label} className="landing-nav-link" onClick={() => smoothScroll(l.href)}>{l.label}</button>
//             ))}
//           </div>

//           <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
//             <Link to="/login" className="landing-btn-outline" style={{ padding: '9px 18px', fontSize: '0.88rem' }}>Login</Link>
//             <Link to="/register" className="landing-btn-primary" style={{ padding: '9px 20px', fontSize: '0.88rem' }}>Shop Now →</Link>
//           </div>
//         </div>
//       </nav>

//       {/* ── HERO ── */}
//       <section style={{
//         background: 'linear-gradient(145deg, #060f25 0%, #0f2557 35%, #1e3c72 70%, #1a4a8a 100%)',
//         minHeight: '92vh', position: 'relative', overflow: 'hidden',
//         display: 'flex', alignItems: 'center', padding: '80px 32px 100px',
//       }}>
//         <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
//         <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,111,212,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
//         <div style={{ position: 'absolute', bottom: '-30%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
//         <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '38px 38px', pointerEvents: 'none' }} />

//         <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', position: 'relative', zIndex: 2 }}>
//           <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 80, alignItems: 'center' }}>
//             <div>
//               <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '7px 16px', marginBottom: 28 }}>
//                 <span className="pulse-dot-l" style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
//                 <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'Instrument Sans' }}>
//                   🇮🇳 INDIA'S HOLD-COMMERCE PLATFORM
//                 </span>
//               </div>

//               <h1 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', lineHeight: 1.1, letterSpacing: '-0.03em', color: '#fff', marginBottom: 24 }}>
//                 Shop Smarter with<br />
//                 <span className="grad-text-l">Hold Deals</span><br />
//                 &amp; Save Big
//               </h1>

//               <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: 500, marginBottom: 40, fontWeight: 400 }}>
//                 Join <strong style={{ color: '#fff', fontWeight: 600 }}>50,000+ buyers</strong> across India using HoldKart's group-buy hold model — commit to a deal, wait for the target, and unlock prices up to <strong style={{ color: '#4ade80', fontWeight: 700 }}>85% below retail</strong>.
//               </p>

//               <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 44 }}>
//                 <Link to="/register" className="landing-btn-white">Start Shopping Free →</Link>
//                 <Link to="/login" className="landing-btn-ghost">Existing Buyer? Login</Link>
//               </div>

//               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
//                 {['Free to join', 'Safe payments', '7-day returns', 'Pan-India delivery'].map(t => (
//                   <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
//                     <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '1.5px solid rgba(74,222,128,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                       <span style={{ color: '#4ade80', fontSize: '0.55rem', fontWeight: 800 }}>✓</span>
//                     </div>
//                     <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.83rem', fontWeight: 400 }}>{t}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Right: Shopping mockup */}
//             <div style={{ position: 'relative' }}>
//               <div className="float-l" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
//                   <div style={{ display: 'flex', gap: 6 }}>
//                     {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
//                   </div>
//                   <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
//                     <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>holdkart.com/deals</span>
//                   </div>
//                 </div>

//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
//                   {[
//                     { label: 'Active Deals', val: '124', change: '🔥 12 closing soon', up: true },
//                     { label: 'My Savings', val: '₹12,480', change: '+₹2,800 this month', up: true },
//                     { label: 'Orders Placed', val: '7', change: '2 in transit', up: null },
//                     { label: 'Wishlist', val: '14 items', change: '3 now on deal', up: true },
//                   ].map(item => (
//                     <div key={item.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
//                       <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{item.label}</div>
//                       <div style={{ color: '#fff', fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: '1.1rem' }}>{item.val}</div>
//                       <div style={{ color: item.up === true ? '#4ade80' : 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginTop: 4 }}>{item.change}</div>
//                     </div>
//                   ))}
//                 </div>

//                 <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
//                   <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.07em' }}>🎯 Live Hold Deal — Wireless Earbuds</div>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
//                     <div>
//                       <div style={{ color: '#fff', fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: '1.2rem' }}>₹1,299</div>
//                       <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', textDecoration: 'line-through' }}>₹4,999 retail</div>
//                     </div>
//                     <div style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
//                       <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.85rem' }}>74% OFF</span>
//                     </div>
//                   </div>
//                   <div style={{ marginBottom: 6 }}>
//                     <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden' }}>
//                       <div style={{ height: '100%', width: '87%', background: 'linear-gradient(90deg,#4ade80,#22c55e)', borderRadius: 99 }} />
//                     </div>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
//                       <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>87 / 100 joined</span>
//                       <span style={{ color: '#4ade80', fontSize: '0.68rem', fontWeight: 700 }}>13 spots left!</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Float: savings */}
//               <div style={{ position: 'absolute', top: -20, right: -28, zIndex: 10, background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 12, minWidth: 210 }}>
//                 <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>💸</div>
//                 <div>
//                   <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>You Save</div>
//                   <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: 1 }}>₹3,700</div>
//                   <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 1 }}>vs retail price · 74% off</div>
//                 </div>
//               </div>

//               {/* Float: shipped */}
//               <div style={{ position: 'absolute', bottom: -20, left: -28, zIndex: 10, background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
//                 <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#1e3c72,#3b6fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🚚</div>
//                 <div>
//                   <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Order Dispatched</div>
//                   <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0a1628', marginTop: 1 }}>Arriving Tomorrow</div>
//                   <div style={{ fontSize: '0.68rem', color: '#3b6fd4', marginTop: 1 }}>Delhivery · On time</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── MARQUEE ── */}
//       <div style={{ background: '#f8faff', borderTop: '1px solid #e2e8f5', borderBottom: '1px solid #e2e8f5', padding: '18px 0', overflow: 'hidden' }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
//           <div style={{ paddingLeft: 24, flexShrink: 0, color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>SHOP BY CATEGORY</div>
//           <div style={{ height: 20, width: 1, background: '#e2e8f5', flexShrink: 0 }} />
//           <div className="marquee-wrapper" style={{ flex: 1 }}>
//             <div className="marquee-track">
//               {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
//                 <span key={i} style={{ padding: '0 28px', color: '#64748b', fontSize: '0.85rem', fontWeight: 500, borderRight: '1px solid #e2e8f5', whiteSpace: 'nowrap' }}>{item}</span>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── STATS ── */}
//       <section ref={statsRef} style={{ background: 'linear-gradient(135deg, #0f2557, #1e3c72, #2a5298)', padding: '0 32px' }}>
//         <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
//           {STATS.map(s => <AnimatedStat key={s.label} {...s} started={statsInView} />)}
//         </div>
//       </section>

//       {/* ── HOW IT WORKS ── */}
//       <section id="how-it-works" style={{ padding: '120px 32px', background: '#fff' }}>
//         <div style={{ maxWidth: 1240, margin: '0 auto' }}>
//           <div style={{ textAlign: 'center', marginBottom: 80 }}>
//             <div className="landing-chip" style={{ marginBottom: 16 }}>✦ Simple Process</div>
//             <h2 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.03em', color: '#0a1628', marginBottom: 16 }}>Start Saving in 4 Easy Steps</h2>
//             <p style={{ color: '#475569', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.75 }}>From browsing to doorstep — your first Hold Deal is just minutes away.</p>
//           </div>

//           <div style={{ position: 'relative' }}>
//             <div style={{ position: 'absolute', top: 56, left: '12.5%', right: '12.5%', height: 2, background: 'linear-gradient(90deg,#1e3c72,#3b6fd4,#1e3c72)', borderRadius: 2, zIndex: 0 }} />
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, position: 'relative', zIndex: 1 }}>
//               {STEPS.map(step => (
//                 <div key={step.num} className="hov-lift" style={{ background: '#fff', borderRadius: 20, padding: '36px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(15,37,87,0.08)', border: '1px solid #e2e8f5' }}>
//                   <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3c72, #2a5298)', color: '#fff', fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 6px 20px rgba(30,60,114,0.3)' }}>{step.num}</div>
//                   <div style={{ fontSize: '2.2rem', marginBottom: 16 }}>{step.icon}</div>
//                   <h4 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: '1.05rem', marginBottom: 10, color: '#0a1628' }}>{step.title}</h4>
//                   <p style={{ color: '#94a3b8', fontSize: '0.87rem', lineHeight: 1.7 }}>{step.desc}</p>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div style={{ textAlign: 'center', marginTop: 56 }}>
//             <Link to="/register" className="landing-btn-primary" style={{ padding: '15px 36px', fontSize: '1rem' }}>Join Free &amp; Start Shopping →</Link>
//             <p style={{ marginTop: 14, color: '#94a3b8', fontSize: '0.82rem' }}>No credit card required · Free to join · Instant account</p>
//           </div>
//         </div>
//       </section>

//       {/* ── HOLD DEALS SECTION ── */}
//       <section id="hold-deals" style={{ padding: '120px 32px', background: '#f8faff' }}>
//         <div style={{ maxWidth: 1240, margin: '0 auto' }}>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
//             <div>
//               <div className="landing-chip" style={{ marginBottom: 20 }}>🎯 Hold Deals Explained</div>
//               <h2 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', letterSpacing: '-0.03em', color: '#0a1628', marginBottom: 18, lineHeight: 1.15 }}>
//                 The Smarter Way<br />to Buy Online
//               </h2>
//               <p style={{ color: '#475569', fontSize: '0.97rem', lineHeight: 1.8, marginBottom: 28 }}>
//                 A Hold Deal is a group-buy campaign where buyers reserve a product together at a below-retail price. The deal only unlocks when enough buyers join. You commit first, we source the stock, you save massively.
//               </p>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
//                 {['Set a hold on the product you want at the campaign price', 'The deal unlocks automatically when the target is reached', 'Auto-refund if target isn\'t met — zero risk, always'].map(p => (
//                   <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
//                     <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eef4ff', border: '1.5px solid #1e3c7233', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
//                       <span style={{ color: '#1e3c72', fontSize: '0.65rem', fontWeight: 800 }}>✓</span>
//                     </div>
//                     <span style={{ color: '#374151', fontSize: '0.92rem', lineHeight: 1.6 }}>{p}</span>
//                   </div>
//                 ))}
//               </div>
//               <Link to="/register" className="landing-btn-primary">Browse Live Deals →</Link>
//             </div>

//             <div style={{ background: '#eef4ff', borderRadius: 24, padding: 40, border: '1px solid rgba(30,60,114,0.1)', minHeight: 380, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
//               <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(30,60,114,0.08)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
//               {[
//                 { name: 'Bluetooth Speaker', retail: '₹8,999', hold: '₹2,499', pct: 72, joined: 45, target: 60 },
//                 { name: 'Mechanical Keyboard', retail: '₹5,500', hold: '₹1,899', pct: 55, joined: 33, target: 60 },
//                 { name: 'Laptop Stand', retail: '₹2,200', hold: '₹649', pct: 90, joined: 54, target: 60 },
//               ].map(item => (
//                 <div key={item.name} className="hov-lift" style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 4px 20px rgba(15,37,87,0.1)', position: 'relative', zIndex: 2 }}>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
//                     <div>
//                       <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0a1628' }}>{item.name}</div>
//                       <div style={{ fontSize: '0.72rem', color: '#94a3b8', textDecoration: 'line-through' }}>{item.retail} retail</div>
//                     </div>
//                     <div style={{ textAlign: 'right' }}>
//                       <div style={{ fontWeight: 800, color: '#1e3c72', fontSize: '1rem' }}>{item.hold}</div>
//                       <div style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 99, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 700 }}>Save {Math.round((1 - parseInt(item.hold.replace(/\D/g,'')) / parseInt(item.retail.replace(/\D/g,''))) * 100)}%</div>
//                     </div>
//                   </div>
//                   <div style={{ background: '#e5e7eb', borderRadius: 99, height: 6, overflow: 'hidden' }}>
//                     <div style={{ height: '100%', width: item.pct + '%', background: 'linear-gradient(90deg,#1e3c72,#3b6fd4)', borderRadius: 99 }} />
//                   </div>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
//                     <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{item.joined}/{item.target} joined</span>
//                     <span style={{ fontSize: '0.7rem', color: '#2a5298', fontWeight: 700 }}>Join now →</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── CATEGORIES ── */}
//       <section id="categories" style={{ padding: '120px 32px', background: '#fff' }}>
//         <div style={{ maxWidth: 1240, margin: '0 auto' }}>
//           <div style={{ textAlign: 'center', marginBottom: 64 }}>
//             <div className="landing-chip" style={{ marginBottom: 16 }}>✦ Product Categories</div>
//             <h2 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.03em', color: '#0a1628', marginBottom: 16 }}>Shop Across 10+ Categories</h2>
//             <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.75 }}>New Hold Deals added every day across all categories</p>
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 48 }}>
//             {CATEGORIES.map(c => (
//               <div key={c.name} className="hov-lift" style={{ background: '#f8faff', borderRadius: 16, padding: '28px 16px', textAlign: 'center', border: '1px solid #e2e8f5', cursor: 'pointer', boxShadow: '0 1px 4px rgba(15,37,87,0.06)' }}>
//                 <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>{c.icon}</div>
//                 <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: '0.9rem', color: '#0a1628', marginBottom: 4 }}>{c.name}</div>
//                 <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{c.desc}</div>
//               </div>
//             ))}
//           </div>
//           <div style={{ textAlign: 'center' }}>
//             <Link to="/register" className="landing-btn-primary">Browse All Products →</Link>
//           </div>
//         </div>
//       </section>

//       {/* ── WHY HOLDKART ── */}
//       <section id="why" style={{ padding: '120px 32px', background: '#f8faff' }}>
//         <div style={{ maxWidth: 1240, margin: '0 auto' }}>
//           <div style={{ textAlign: 'center', marginBottom: 64 }}>
//             <div className="landing-chip" style={{ marginBottom: 16 }}>✦ Why Choose Us</div>
//             <h2 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.03em', color: '#0a1628', marginBottom: 16 }}>Built for Smart Shoppers</h2>
//             <p style={{ color: '#475569', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.75 }}>Every feature of HoldKart is designed to save you money and give you peace of mind.</p>
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
//             {BENEFITS.map((b, i) => (
//               <div key={b.title} className="hov-lift" style={{ background: i === 0 ? 'linear-gradient(135deg,#0f2557,#1e3c72)' : '#fff', borderRadius: 20, padding: '32px 28px', border: '1px solid', borderColor: i === 0 ? 'transparent' : '#e2e8f5', boxShadow: i === 0 ? '0 12px 30px rgba(15,37,87,0.25)' : '0 1px 4px rgba(15,37,87,0.06)' }}>
//                 <div style={{ fontSize: '2rem', marginBottom: 16, width: 52, height: 52, borderRadius: 14, background: i === 0 ? 'rgba(255,255,255,0.1)' : '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.icon}</div>
//                 <h4 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: '1rem', marginBottom: 10, color: i === 0 ? '#fff' : '#0a1628' }}>{b.title}</h4>
//                 <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: i === 0 ? 'rgba(255,255,255,0.65)' : '#475569' }}>{b.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── CTA BANNER ── */}
//       <section style={{ padding: '120px 32px', background: 'linear-gradient(145deg, #060f25, #0f2557, #1e3c72)', position: 'relative', overflow: 'hidden' }}>
//         <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
//         <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
//           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '7px 18px', marginBottom: 28 }}>
//             <span className="pulse-dot-l" style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
//             <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.06em' }}>124 HOLD DEALS LIVE RIGHT NOW</span>
//           </div>
//           <h2 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 'clamp(2.2rem,5vw,3.8rem)', letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
//             Ready to Start<br />Saving Big?
//           </h2>
//           <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 500, margin: '0 auto 44px' }}>
//             Join thousands of smart shoppers who use Hold Deals to buy quality products at unbeatable prices. Register free and start saving today.
//           </p>
//           <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
//             <Link to="/register" className="landing-btn-white" style={{ padding: '15px 32px', fontSize: '1rem' }}>Create Free Account →</Link>
//             <Link to="/login" className="landing-btn-ghost" style={{ padding: '14px 28px', fontSize: '0.95rem' }}>Already a Member? Login</Link>
//           </div>
//           <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>Free to join · No credit card required · Safe &amp; secure payments</p>
//         </div>
//       </section>

//       {/* ── FAQ ── */}
//       <section style={{ padding: '120px 32px', background: '#f8faff' }}>
//         <div style={{ maxWidth: 1240, margin: '0 auto' }}>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 100, alignItems: 'start' }}>
//             <div style={{ position: 'sticky', top: 100 }}>
//               <div className="landing-chip" style={{ marginBottom: 20 }}>✦ FAQs</div>
//               <h2 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 'clamp(1.8rem,3vw,2.4rem)', letterSpacing: '-0.03em', color: '#0a1628', marginBottom: 16, lineHeight: 1.2 }}>Frequently Asked<br />Questions</h2>
//               <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: 28 }}>Have more questions? We're here 24×7 to help.</p>
//               <a href="mailto:support@holdkart.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', padding: '13px 20px', borderRadius: 12, color: '#1e3c72', fontWeight: 600, fontSize: '0.88rem', border: '1px solid #e2e8f5', boxShadow: '0 1px 4px rgba(15,37,87,0.06)', transition: 'all 0.25s' }}>
//                 <span>📧</span> Contact Support
//               </a>
//             </div>

//             <div>
//               {FAQS.map((f, i) => (
//                 <div key={i} style={{ background: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', border: '1px solid', borderColor: openFaq === i ? '#c7d7f5' : '#e2e8f5', boxShadow: openFaq === i ? '0 8px 30px rgba(15,37,87,0.1)' : '0 1px 4px rgba(15,37,87,0.06)', transition: 'all 0.3s ease' }}>
//                   <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '20px 24px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'Instrument Sans', fontWeight: 600, fontSize: '0.95rem', color: openFaq === i ? '#1e3c72' : '#0a1628', textAlign: 'left' }}>
//                     <span>{f.q}</span>
//                     <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginLeft: 16, background: openFaq === i ? 'linear-gradient(135deg,#1e3c72,#2a5298)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: openFaq === i ? '#fff' : '#94a3b8', fontSize: '1.1rem', fontWeight: 700, transition: 'all 0.3s ease', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</div>
//                   </button>
//                   <div className={`faq-body-l${openFaq === i ? ' open' : ''}`}>
//                     <p style={{ padding: '0 24px 22px', color: '#475569', fontSize: '0.9rem', lineHeight: 1.75 }}>{f.a}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── FOOTER ── */}
//       <footer style={{ background: '#0a1628', padding: '80px 32px 40px' }}>
//         <div style={{ maxWidth: 1240, margin: '0 auto' }}>
//           <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60, marginBottom: 60, paddingBottom: 60, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
//             <div>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
//                 <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1e3c72,#3b6fd4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🛒</div>
//                 <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.03em' }}>Hold<span style={{ color: '#3b6fd4' }}>Kart</span></span>
//               </div>
//               <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', lineHeight: 1.8, maxWidth: 280, marginBottom: 24 }}>
//                 India's hold-commerce platform. Buy smarter with group deals and unlock prices up to 85% below retail.
//               </p>
//             </div>

//             {[
//               { head: 'Shop', links: ['All Products', 'Hold Deals', 'New Arrivals', 'Best Sellers', 'Categories'] },
//               { head: 'Account', links: ['Register Free', 'Login', 'My Orders', 'Wishlist', 'Support'] },
//               { head: 'Company', links: ['About HoldKart', 'Blog', 'Careers', 'Press', 'Contact Us'] },
//             ].map(col => (
//               <div key={col.head}>
//                 <h4 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col.head}</h4>
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
//                   {col.links.map(l => (
//                     <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', transition: 'color 0.2s' }}
//                       onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.85)'}
//                       onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>{l}</a>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
//             <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem' }}>© 2025 HoldKart Technologies Pvt. Ltd. · All rights reserved · Made with ❤️ in India</p>
//             <div style={{ display: 'flex', gap: 24 }}>
//               {['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Cookie Policy'].map(l => (
//                 <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', transition: 'color 0.2s' }}
//                   onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
//                   onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}>{l}</a>
//               ))}
//             </div>
//           </div>
//         </div>
//       </footer>
//     </>
//   );
// }