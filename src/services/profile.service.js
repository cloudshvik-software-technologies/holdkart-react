import api from './api.js';
export const getProfile         = ()     => api.get('/api/customer/profile/get');
export const updateProfile      = (data) => api.put('/api/customer/profile/update', data);
export const uploadProfileImage = (form) => api.post('/api/customer/profile/upload-image', form);
export const deleteProfileImage = ()     => api.delete('/api/customer/profile/delete-image');
export const getDeactivationInfo    = ()         => api.get('/api/customer/profile/deactivation-info');
export const getDeactivationWarnings = ()         => api.get('/api/customer/profile/deactivation-check');
export const deactivateAccount  = (password, reason) => api.post('/api/customer/profile/deactivate', { password, reason });
export const reactivateAccount  = ()     => api.post('/api/customer/profile/reactivate');