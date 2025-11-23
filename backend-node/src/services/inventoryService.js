import { api, cf } from './http';

export async function syncInventory(updates) {
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

