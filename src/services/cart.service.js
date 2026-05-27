import api from './api.js';
  export const addToCart      = (data) => api.post('/api/customer/cart/add', data);
  export const getCart        = ()     => api.get('/api/customer/cart/list');
  export const updateCartItem = (data) => api.put('/api/customer/cart/update', data);
  export const removeFromCart = (data) => api.delete('/api/customer/cart/remove', { data });
  export const clearCart      = ()     => api.delete('/api/customer/cart/clear');
  