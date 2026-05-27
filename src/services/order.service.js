import api from './api.js';
  export const placeOrder  = (data) => api.post('/api/customer/orders/place', data);
  export const listOrders  = ()     => api.get('/api/customer/orders/list');
  export const getOrder    = (id)   => api.get(`/api/customer/orders/${id}`);
  export const cancelOrder = (data) => api.put('/api/customer/orders/cancel', data);
  