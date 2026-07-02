import api from './api.js';

export const listProducts  = (params) => api.get('/api/customer/product/list', { params });
export const getProduct    = (id)     => api.get(`/api/customer/product/${id}`);
export const getVariants   = (id)     => api.get(`/api/customer/product/${id}/variants`);
export const getCategories = ()       => api.get('/api/customer/product/categories');
export const getFeatured   = (page = 1, limit = 10) =>
  api.get('/api/customer/product/featured', { params: { page, limit } });

// ── Personalised sections (logged-in only) ────────────────────────────────────
export const getPersonalizedBrowsing  = (limit = 14) =>
  api.get('/api/customer/product/personalized/browsing',  { params: { limit } });

export const getPersonalizedCart      = (limit = 14) =>
  api.get('/api/customer/product/personalized/cart',      { params: { limit } });

export const getPersonalizedSuggested = (limit = 14) =>
  api.get('/api/customer/product/personalized/suggested', { params: { limit } });

// ── Track a product view (fire-and-forget, logged-in only) ───────────────────
export const trackProductView = (productId) =>
  api.post(`/api/customer/product/track-view/${productId}`).catch(() => {});

// ── Guest public sections (no auth) ──────────────────────────────────────────
// type: 'deals' | 'trending' | 'top_rated'
export const getGuestSection = (type, limit = 14) =>
  api.get(`/api/customer/product/guest-section/${type}`, { params: { limit } });