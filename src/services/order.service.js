import api from './api.js';
  export const placeOrder  = (data) => api.post('/api/customer/orders/place', data);
  export const listOrders  = ()     => api.get('/api/customer/orders/list');
  export const getOrder    = (id)   => api.get(`/api/customer/orders/${id}`);
  export const cancelOrder = (data) => api.put('/api/customer/orders/cancel', data);
  export const returnOrder = (data) => {
    const { evidencePhotos, ...fields } = data;
    if (!evidencePhotos || !evidencePhotos.length) {
      return api.put('/api/customer/orders/return', fields);
    }
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
      if (v == null) return;
      // FIX: FormData stringifies objects as "[object Object]" — JSON-encode
      // non-primitive fields (e.g. refundPayoutDetails) so the backend gets
      // real data instead of a useless string, same as evidencePhotos being
      // handled separately below.
      formData.append(k, typeof v === 'object' ? JSON.stringify(v) : v);
    });
    evidencePhotos.forEach(f => formData.append('evidencePhotos', f));
    return api.put('/api/customer/orders/return', formData);
  };
  export const trackOrder  = (id)   => api.get(`/api/customer/orders/track/${id}`);