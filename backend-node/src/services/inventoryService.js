import { api, cf, cfEnabled } from './http';

export async function syncInventory(updates) {
  if (!cfEnabled) throw new Error('Cloud Functions no disponible');
  const { data } = await cf.post('inventorySyncHttp', updates);
  return data;
}

export async function patchProduct(id, payload) {
  const { data } = await api.patch(`products/${id}/`, payload);
  return data;
}

export async function patchVariant(id, payload) {
  const { data } = await api.patch(`variants/${id}/`, payload);
  return data;
}

