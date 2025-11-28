import { api } from "./client";

export type Product = { id: number; name: string; description?: string; price: number; stock: number; category?: number };
export type Variant = { id: number; product: number; sku: string; price: number; stock: number; active: boolean };
export type Image = { id: number; product: number; variant?: number | null; url: string; is_primary?: boolean };
export type Shipment = { id: number; order: number; address: string; carrier: string; tracking_number?: string; status: string };
export type Category = { id: number; name: string };

export const adminApi = {
  // Products
  listProducts: () => api.get<Product[]>("products/"),
  getProduct: (id: number) => api.get<Product>(`products/${id}/`),
  createProduct: (payload: Partial<Product>) => api.post<Product>("products/", payload),
  updateProduct: (id: number, payload: Partial<Product>) => api.patch<Product>(`products/${id}/`, payload),
  deleteProduct: (id: number) => api.del<void>(`products/${id}/`),

  // Variants
  listVariants: () => api.get<Variant[]>("variants/"),
  getVariant: (id: number) => api.get<Variant>(`variants/${id}/`),
  createVariant: (payload: Partial<Variant>) => api.post<Variant>("variants/", payload),
  updateVariant: (id: number, payload: Partial<Variant>) => api.patch<Variant>(`variants/${id}/`, payload),
  deleteVariant: (id: number) => api.del<void>(`variants/${id}/`),

  // Images
  listImages: () => api.get<Image[]>("images/"),
  getImage: (id: number) => api.get<Image>(`images/${id}/`),
  createImage: (payload: Partial<Image>) => api.post<Image>("images/", payload),
  updateImage: (id: number, payload: Partial<Image>) => api.patch<Image>(`images/${id}/`, payload),
  deleteImage: (id: number) => api.del<void>(`images/${id}/`),

  // Shipments
  listShipments: () => api.get<Shipment[]>("shipments/"),
  updateShipment: (id: number, payload: Partial<Shipment>) => api.patch<Shipment>(`shipments/${id}/`, payload),
  deleteShipment: (id: number) => api.del<void>(`shipments/${id}/`),

  // Categories
  listCategories: () => api.get<Category[]>("categories/"),
};
