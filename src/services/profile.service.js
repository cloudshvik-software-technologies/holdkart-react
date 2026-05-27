import api from './api.js';
  export const getProfile         = ()     => api.get('/api/customer/profile/get');
  export const updateProfile      = (data) => api.put('/api/customer/profile/update', data);
  export const uploadProfileImage = (form) => api.post('/api/customer/profile/upload-image', form);
  