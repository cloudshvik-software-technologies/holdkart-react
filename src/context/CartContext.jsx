import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { cartService } from '../services/index.js';
import { getGuestCartCount } from '../utils/guestCart.js';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(getGuestCartCount());
      return;
    }
    try {
      const data = await cartService.getCart();
      const items = Array.isArray(data) ? data : (data?.data || []);
      setCartCount(items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0));
    } catch {
      setCartCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCartCount();
    window.addEventListener('hk:cart-changed', refreshCartCount);
    return () => window.removeEventListener('hk:cart-changed', refreshCartCount);
  }, [refreshCartCount]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);