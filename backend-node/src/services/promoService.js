import { api, cf } from './http';

export async function applyPromo(orderId, discountId) {
  const { data } = await cf.post('promoApplier', { action: 'apply', orderId, discountId });
  return data;
}

export async function removePromo(orderDiscountId) {
  const { data } = await cf.post('promoApplier', { action: 'remove', orderDiscountId });
  return data;
}

export async function listDiscounts() {
  const { data } = await api.get('discounts/');
  return Array.isArray(data) ? data : [];
}

