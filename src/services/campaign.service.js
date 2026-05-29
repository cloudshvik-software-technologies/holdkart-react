import api from './api.js';

export const listCampaigns    = ()     => api.get('/api/customer/campaign/list');
export const joinCampaign     = (data) => api.post('/api/customer/campaign/join', data);
export const leaveCampaign    = (data) => api.post('/api/customer/campaign/leave', data);
export const getMyCampaigns   = ()     => api.get('/api/customer/campaign/mine');
export const getCampaignById  = (id)   => api.get(`/api/customer/campaign/${id}`);
export const startCampaign    = (data) => api.post('/api/customer/campaign/start', data);
export const searchProducts   = (q)    => api.get('/api/customer/products', { params: { search: q, limit: 20 } });
