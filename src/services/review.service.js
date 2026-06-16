import api from './api.js';

export const canReview         = (productId) => api.get(`/api/customer/review/can-review/${productId}`);
export const addReview         = (data)       => {
  // data may be FormData (when images are attached) or a plain object
  if (data instanceof FormData) {
    return api.post('/api/customer/review/add', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.post('/api/customer/review/add', data);
};
export const getProductReviews = (id)         => api.get(`/api/customer/review/list/${id}`);
export const getMyReview       = (orderId)    => api.get(`/api/customer/review/my-review/${orderId}`);
export const deleteReview      = (reviewId)   => api.delete(`/api/customer/review/${reviewId}`);
export const toggleReviewLike  = (reviewId)   => api.post(`/api/customer/review/${reviewId}/like`);