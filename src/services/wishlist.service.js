import api from './api.js';
  export const addToWishlist      = (data) => api.post('/api/customer/wishlist/add', data);
  export const getWishlist        = ()     => api.get('/api/customer/wishlist/list');
  export const removeFromWishlist = (data) => api.delete('/api/customer/wishlist/remove', { data });
  