import api from './api.js';

export const listAddresses    = ()          => api.get('/api/customer/addresses');
export const createAddress    = (data)      => api.post('/api/customer/addresses', data);
export const updateAddress    = (id, data)  => api.put(`/api/customer/addresses/${id}`, data);
export const deleteAddress    = (id)        => api.delete(`/api/customer/addresses/${id}`);
export const setDefaultAddress = (id)       => api.put(`/api/customer/addresses/${id}/set-default`);