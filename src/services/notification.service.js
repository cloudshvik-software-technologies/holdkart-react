import api from './api.js';
  export const getNotifications = ()     => api.get('/api/customer/notifications/list');
  export const markRead         = (data) => api.put('/api/customer/notifications/mark-read', data);
  export const getUnreadCount   = ()     => api.get('/api/customer/notifications/unread-count');
  