import { api } from "./client";

export type Product = { id: number; name: string; description?: string; price: number; stock: number; category?: number };
export type Variant = { id: number; product: number; sku: string; price: number; stock: number; active: boolean };
export type Image = { id: number; product: number; variant?: number | null; url: string; is_primary?: boolean };
export type Shipment = { id: number; order: number; address: string; carrier: string; tracking_number?: string; status: string };
export type Category = { id: number; name: string };
export type Order = { id: number; user: number; status: string; total?: number; created_at?: string };
export type OrderItem = { id: number; order: number; product: number; quantity: number; unit_price: number };
export type OrderHistory = { id: number; order: number; old_status: string; new_status: string; changed_at: string; changed_by?: number | null; reason?: string };
export type AdminUser = { id: number; username?: string; email?: string; first_name?: string; last_name?: string; phone?: string; address?: string; role?: string; is_staff?: boolean; date_joined?: string };
export type PublicUser = { id: number; username?: string; email?: string; first_name?: string; last_name?: string };
export type Audit = { id: number; action: string; created_at: string; details?: string; user?: number | null };

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
  createShipment: (payload: Partial<Shipment>) => api.post<Shipment>("shipments/", payload),
  updateShipment: (id: number, payload: Partial<Shipment>) => api.patch<Shipment>(`shipments/${id}/`, payload),
  deleteShipment: (id: number) => api.del<void>(`shipments/${id}/`),

  // Categories
  listCategories: () => api.get<Category[]>("categories/"),

  // Admin Orders
  listAdminOrders: (params?: Record<string, string | number>): Promise<Order[]> =>
    api.get<any>(`admin/orders/${toQuery(params)}`).then((d: any) => Array.isArray(d) ? d as Order[] : ((d?.results ?? []) as Order[])),
  getAdminOrder: (id: number) => api.get<Order>(`admin/orders/${id}/`),
  listOrderItems: (orderId: number) => api.get<OrderItem[]>(`order-items/?order=${orderId}`),
  listOrderHistory: (orderId: number) => api.get<OrderHistory[]>(`order-status-history/?order=${orderId}`),
  createOrderHistory: (payload: Partial<OrderHistory>) => api.post<OrderHistory>(`order-status-history/`, payload),
  updateOrderStatus: (id: number, status: string, reason?: string) => api.patch<Order>(`orders/${id}/`, { status, reason }),

  // Admin Users
  listAdminUsers: (params?: Record<string, string | number>): Promise<AdminUser[]> =>
    api.get<any>(`admin/users/${toQuery(params)}`).then((d: any) => Array.isArray(d) ? d as AdminUser[] : ((d?.results ?? []) as AdminUser[])),
  listAdminUsersAll: async (): Promise<AdminUser[]> => {
    const first = await api.get<any>(`admin/users/`)
    const acc: AdminUser[] = Array.isArray(first) ? first as AdminUser[] : ((first?.results ?? []) as AdminUser[])
    let next: string | null = (first && typeof first === 'object') ? (first.next ?? null) : null
    while (next) {
      try {
        const u = new URL(next)
        const rel = `${u.pathname}${u.search}`.replace(/^\/?api\/?/, '')
        const page = await api.get<any>(rel.startsWith('/') ? rel.slice(1) : rel)
        const items: AdminUser[] = Array.isArray(page) ? page as AdminUser[] : ((page?.results ?? []) as AdminUser[])
        acc.push(...items)
        next = (page && typeof page === 'object') ? (page.next ?? null) : null
      } catch { break }
    }
    return acc
  },
  getAdminUser: (id: number) => api.get<AdminUser>(`admin/users/${id}/`),
  updateAdminUser: async (id: number, payload: Partial<AdminUser>) => {
    try {
      return await api.patch<AdminUser>(`admin/users/${id}/`, payload)
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (/405|Method.*PATCH/i.test(msg)) {
        try { return await api.put<AdminUser>(`admin/users/${id}/`, payload) } catch {}
      }
      try { return await api.patch<AdminUser>(`users/${id}/`, payload) } catch {}
      try { return await api.put<AdminUser>(`users/${id}/`, payload) } catch {}
      throw e
    }
  },
  setUserRole: (id: number, role: string) => api.patch<AdminUser>(`admin/users/${id}/set_role/`, { role }),

  // Public Users (fallback, sin Authorization)
  getPublicUser: async (id: number): Promise<PublicUser> => {
    const url = new URL(`users/${id}/`, api.baseUrl).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<PublicUser>;
  },

  // Admin Audit
  listAdminAudit: (params?: Record<string, string | number>): Promise<Audit[]> =>
    api.get<any>(`admin/audit/${toQuery(params)}`).then((d: any) => Array.isArray(d) ? d as Audit[] : ((d?.results ?? []) as Audit[])),
  listAdminAuditAll: async (params?: Record<string, string | number>): Promise<Audit[]> => {
    const first = await api.get<any>(`admin/audit/${toQuery(params)}`)
    const acc: Audit[] = Array.isArray(first) ? first as Audit[] : ((first?.results ?? []) as Audit[])
    let next: string | null = (first && typeof first === 'object') ? (first.next ?? null) : null
    while (next) {
      // Convert absolute URL to relative path for api client
      try {
        const u = new URL(next)
        const rel = `${u.pathname}${u.search}`.replace(/^\/?api\/?/, '')
        const page = await api.get<any>(rel.startsWith('/') ? rel.slice(1) : rel)
        const items: Audit[] = Array.isArray(page) ? page as Audit[] : ((page?.results ?? []) as Audit[])
        acc.push(...items)
        next = (page && typeof page === 'object') ? (page.next ?? null) : null
      } catch {
        break
      }
    }
    return acc
  },
};

function toQuery(params?: Record<string, string | number>): string {
  if (!params || Object.keys(params).length === 0) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    sp.append(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
