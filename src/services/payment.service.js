import api from './api.js';

export const createCashfreeOrder = (data) => api.post('/api/customer/payment/create-order', data);
export const verifyPayment       = (data) => api.post('/api/customer/payment/verify', data);
