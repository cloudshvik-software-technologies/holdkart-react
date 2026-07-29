import api from './api.js';

/**
 * Fetch available couriers for a product delivery.
 * productId — the product being shipped (used to look up seller's pickup pincode
 *             and the product's stored weight)
 * destPin   — customer's delivery pincode
 * quantity  — number of units being ordered (default 1). The backend computes
 *             the parcel weight as product.weight * quantity, so the returned
 *             rate already covers the whole shipment — do not multiply it again.
 * cod       — 1 for cash-on-delivery, 0 for prepaid
 */
export const getAvailableCouriers = (productId, destPin, quantity = 1, cod = 0) =>
  api.get('/api/customer/shipping/couriers', {
    params: { productId, destPin, quantity, cod },
  });