import api from './api.js';

// Fired whenever the cart contents change (add/update/remove/clear/merge) so
// any component — most importantly the header's cart badge — can refresh its
// count without every call site having to remember to trigger it itself.
const notifyCartChanged = () => window.dispatchEvent(new Event('hk:cart-changed'));

const withCartNotify = (fn) => async (...args) => {
  const result = await fn(...args);
  notifyCartChanged();
  return result;
};

export const addToCart      = withCartNotify((data) => api.post('/api/customer/cart/add', data));
export const getCart        = ()     => api.get('/api/customer/cart/list');
export const updateCartItem = withCartNotify((data) => api.put('/api/customer/cart/update', data));
export const removeFromCart = withCartNotify((data) => api.delete('/api/customer/cart/remove', { data }));
export const clearCart      = withCartNotify(()     => api.delete('/api/customer/cart/clear'));

/**
 * Sends the guest cart items to the backend to be merged into the
 * authenticated customer's cart. Called once right after login.
 *
 * @param {Array<{ productId: number|string, quantity: number }>} items
 */
export const mergeGuestCart = withCartNotify((items) => api.post('/api/customer/cart/merge', { items }));