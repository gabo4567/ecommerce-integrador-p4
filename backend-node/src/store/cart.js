import { create } from "zustand";
import { api } from "../api/client";
import { guestCartCount } from "../lib/utils";
import { useAuthStore } from "./auth";

export const useCartStore = create((set) => ({
  count: 0,
  refreshCount: async () => {
    try {
      const access = useAuthStore.getState().accessToken;
      if (!access) { set({ count: guestCartCount() }); return; }
      const me = await api.get("users/me/");
      const orders = await api.get("orders/");
      const pending = orders.find((o) => o.status === "pending" && o.user === me.id);
      if (!pending) { set({ count: 0 }); return; }
      const items = await api.get(`order-items/?order=${pending.id}`);
      const c = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
      set({ count: c });
    } catch {
      set({ count: guestCartCount() });
    }
  },
}));

