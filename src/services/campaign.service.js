import api from './api.js';
export const listCampaigns  = ()     => api.get('/api/customer/campaign/list');
export const joinCampaign   = (data) => api.post('/api/customer/campaign/join', data);
export const leaveCampaign  = (data) => api.post('/api/customer/campaign/leave', data);
export const getMyCampaigns = ()     => api.get('/api/customer/campaign/mine');