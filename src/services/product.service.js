import api from './api.js';
  export const listProducts  = (params) => api.get('/api/customer/product/list', { params });
  export const getProduct    = (id)     => api.get(`/api/customer/product/${id}`);
  export const getCategories = ()       => api.get('/api/customer/product/categories');
  export const getFeatured   = (page = 1, limit = 10) => api.get('/api/customer/product/featured', { params: { page, limit } });