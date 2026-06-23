
import { getStorage, setStorage } from './storage.js';

const GUEST_CART_KEY = 'holdkart_guest_cart';

const readCart = () => {
  try {
    const raw = getStorage(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCart = (items) => {
  setStorage(GUEST_CART_KEY, JSON.stringify(items));
};

export const getGuestCart = () => readCart();

export const getGuestCartCount = () =>
  readCart().reduce((sum, i) => sum + (i.quantity || 0), 0);

export const addGuestCartItem = (product, quantity = 1) => {
  const items = readCart();
  const productId = product.productId;
  const stock = product.stock ?? product.remainingStock ?? 99;
  const imageUrl = product.imageUrl || product.images?.[0] || null;
  const retailPrice = Number(product.retailPrice) || 0;

  const existing = items.find(i => Number(i.productId) === Number(productId));
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, stock || existing.quantity + quantity);
  } else {
    items.push({
      cartId: `guest-${productId}`,
      productId,
      name: product.name,
      imageUrl,
      category: product.category || null,
      retailPrice,
      effectivePrice: retailPrice,
      quantity,
      stock: stock || 99,
      hasGroupDeal: false,
      depositPaid: 0,
    });
  }

  writeCart(items);
  return items;
};

export const updateGuestCartItem = (cartId, quantity) => {
  let items = readCart();
  if (quantity <= 0) {
    items = items.filter(i => i.cartId !== cartId);
  } else {
    items = items.map(i => (i.cartId === cartId ? { ...i, quantity } : i));
  }
  writeCart(items);
  return items;
};

export const removeGuestCartItem = (cartId) => {
  const items = readCart().filter(i => i.cartId !== cartId);
  writeCart(items);
  return items;
};

export const clearGuestCart = () => writeCart([]);