import { api } from "./client";

export const adminApi = {
  listProducts: () => api.get("products/"),
  getProduct: (id) => api.get(`products/${id}/`),
  createProduct: (payload) => api.post("products/", payload),
  updateProduct: (id, payload) => api.patch(`products/${id}/`, payload),
  deleteProduct: (id) => api.del(`products/${id}/`),

  listVariants: () => api.get("variants/"),
  getVariant: (id) => api.get(`variants/${id}/`),
  createVariant: (payload) => api.post("variants/", payload),
  updateVariant: (id, payload) => api.patch(`variants/${id}/`, payload),
  deleteVariant: (id) => api.del(`variants/${id}/`),

  listImages: () => api.get("images/"),
  getImage: (id) => api.get(`images/${id}/`),
  createImage: (payload) => api.post("images/", payload),
  updateImage: (id, payload) => api.patch(`images/${id}/`, payload),
  deleteImage: (id) => api.del(`images/${id}/`),

  listShipments: () => api.get("shipments/"),
  updateShipment: (id, payload) => api.patch(`shipments/${id}/`, payload),
  deleteShipment: (id) => api.del(`shipments/${id}/`),

  listCategories: () => api.get("categories/"),
};

