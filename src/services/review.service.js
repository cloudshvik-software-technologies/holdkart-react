import api from './api.js';
  export const addReview         = (data) => api.post('/api/customer/review/add', data);
  export const getProductReviews = (id)   => api.get(`/api/customer/review/list/${id}`);
  