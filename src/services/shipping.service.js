import api from './api.js';

/**
 * Fetch available couriers for a product delivery.
 * productId — the product being shipped (used to look up seller's pickup pincode)
 * destPin   — customer's delivery pincode
 * weight    — parcel weight in kg (default 0.5)
 * cod       — 1 for cash-on-delivery, 0 for prepaid
 */
export const getAvailableCouriers = (productId, destPin, weight = 0.5, cod = 0) =>
  api.get('/api/customer/shipping/couriers', {
    params: { productId, destPin, weight, cod },
  });