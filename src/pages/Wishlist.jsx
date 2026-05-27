import { useState, useEffect } from 'react';
  import { useNavigate, Link } from 'react-router-dom';
  import { wishlistService, cartService } from '../services/index.js';
  import { useAuth } from '../context/AuthContext.jsx';
  import toast from 'react-hot-toast';

  const SELLER_URL = import.meta.env.VITE_SELLER_API_URL || 'http://localhost:8080';

  export default function Wishlist() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = async () => {
      try { const data = await wishlistService.getWishlist(); setWishlist(Array.isArray(data) ? data : []); }
      catch {} finally { setLoading(false); }
    };

    useEffect(() => { if (!isAuthenticated) { navigate('/login'); return; } fetchWishlist(); }, [isAuthenticated]);

    const remove = async (productId) => {
      try { await wishlistService.removeFromWishlist({ productId }); fetchWishlist(); toast.success('Removed'); }
      catch { toast.error('Failed'); }
    };

    const addToCart = async (productId) => {
      try { await cartService.addToCart({ productId, quantity: 1 }); toast.success('Added to cart!'); }
      catch(e) { toast.error(e?.response?.data?.message || 'Failed'); }
    };

    const getImg = (url) => url ? (url.startsWith('http') ? url : SELLER_URL + url) : 'https://via.placeholder.com/200?text=No+Image';

    if (loading) return <div className="page-wrap">Loading…</div>;

    return (
      <div className="page-wrap">
        <h1 className="page-title">My Wishlist ({wishlist.length})</h1>
        {wishlist.length === 0 ? (
          <div className="empty-state">
            <div className="icon">♡</div>
            <h3>Your wishlist is empty</h3>
            <p>Save items you love to buy later</p>
            <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20 }}>Browse Products</Link>
          </div>
        ) : (
          <div className="product-grid">
            {wishlist.map(item => (
              <div key={item.wishlistId} style={{ background: '#fff', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/product/${item.productId}`)}>
                  <img src={getImg(item.imageUrl)} alt={item.name} style={{ width: '100%', height: 200, objectFit: 'cover' }} onError={e => e.target.src = 'https://via.placeholder.com/200?text=No+Image'} />
                  <button onClick={e => { e.stopPropagation(); remove(item.productId); }} style={{ position: 'absolute', top: 10, right: 10, background: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>✕</button>
                  {!item.active && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>Unavailable</div>}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 4 }}>{item.category}</div>
                  <div style={{ fontWeight: 600, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontWeight: 700, color: 'var(--blue-dark)', marginBottom: 12 }}>₹{item.retailPrice?.toLocaleString()}</div>
                  <button className="btn-cart" style={{ width: '100%', padding: '8px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem' }} onClick={() => addToCart(item.productId)} disabled={!item.active || item.stock === 0}>
                    {item.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  