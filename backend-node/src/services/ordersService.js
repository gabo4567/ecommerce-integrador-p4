import { api } from './http';

export async function listPendingOrders() {
  const { data } = await api.get('orders/', { params: { status: 'pending' } });
  return Array.isArray(data) ? data : [];
}

export async function cancelOrder(orderId) {
  const { data } = await api.patch(`orders/${orderId}/`, { status: 'cancelled' });
  return data;
}

