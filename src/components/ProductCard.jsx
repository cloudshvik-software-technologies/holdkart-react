import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating.jsx';
import { cartService, wishlistService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f4f8'/%3E%3Crect x='140' y='90' width='120' height='90' rx='10' fill='%23d1d9e6'/%3E%3Ccircle cx='200' cy='115' r='18' fill='%23a0aec0'/%3E%3Cpath d='M155 175 Q200 130 245 175Z' fill='%23a0aec0'/%3E%3Ctext x='200' y='225' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

function resolveImgSrc(imageUrl) {
  if (!imageUrl) return FALLBACK_IMG;
  if (imageUrl.startsWith('http')) return imageUrl;
  const normalised = imageUrl.startsWith('/uploads')
    ? imageUrl.replace('/uploads', '/seller-uploads')
    : `/seller-uploads${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  return normalised;
}

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(() => resolveImgSrc(product.imageUrl));

  // Anyone can view a product detail — no auth gate here
  const handleCardClick = () => {
    navigate(`/product/${product.productId}`);
  };

  // Cart requires login (cart API needs auth token)
  const handleCart = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      navigate('/login');
      return;
    }
    try {
      await cartService.addToCart({ productId: product.productId, quantity: 1 });
      toast.success('Added to cart!');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to add to cart'); }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to add to wishlist');
      navigate('/login');
      return;
    }
    try {
      await wishlistService.addToWishlist({ productId: product.productId });
      toast.success('Added to wishlist!');
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <img src={imgSrc} alt={product.name} onError={() => setImgSrc(FALLBACK_IMG)} />
      <div className="product-card-body">
        <div className="product-card-cat">{product.category}</div>
        <div className="product-card-name">{product.name}</div>
        {product.avgRating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <StarRating rating={product.avgRating} size="0.85rem" />
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>({product.reviewCount})</span>
          </div>
        )}
        <div className="product-card-price">
          {product.holdPrice && product.holdPrice !== product.retailPrice ? (
            <>
              <span className="price-retail">₹{product.holdPrice?.toLocaleString()}</span>
              <span className="price-hold">₹{product.retailPrice?.toLocaleString()}</span>
            </>
          ) : (
            <span className="price-retail">₹{product.retailPrice?.toLocaleString()}</span>
          )}
        </div>
        <div className="product-card-actions">
          <button className="btn-cart" onClick={handleCart}>🛒 Cart</button>
          <button className="btn-wish" onClick={handleWishlist}>♡ Wishlist</button>
        </div>
      </div>
    </div>
  );
}