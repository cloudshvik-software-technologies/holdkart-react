import api from './api.js';

export const addToCart      = (data) => api.post('/api/customer/cart/add', data);
export const getCart        = ()     => api.get('/api/customer/cart/list');
export const updateCartItem = (data) => api.put('/api/customer/cart/update', data);
export const removeFromCart = (data) => api.delete('/api/customer/cart/remove', { data });
export const clearCart      = ()     => api.delete('/api/customer/cart/clear');

/**
 * Sends the guest cart items to the backend to be merged into the
 * authenticated customer's cart. Called once right after login.
 *
 * @param {Array<{ productId: number|string, quantity: number }>} items
 */
export const mergeGuestCart = (items) => api.post('/api/customer/cart/merge', { items });