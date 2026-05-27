import api from './api.js';
  export const submitComplaint = (data) => api.post('/api/customer/complaints/submit', data);
  export const listComplaints  = ()     => api.get('/api/customer/complaints/list');
  