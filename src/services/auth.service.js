import api from './api.js';
  export const register       = (data) => api.post('/api/customer/auth/register', data);
  export const login          = (data) => api.post('/api/customer/auth/login', data);
  export const forgotPassword = (data) => api.post('/api/customer/auth/forgot-password', data);
  export const resetPassword  = (data) => api.post('/api/customer/auth/reset-password', data);
  export const logout         = (data) => api.post('/api/customer/auth/logout', data);
  