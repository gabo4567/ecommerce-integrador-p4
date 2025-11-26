import { create } from "zustand";
import { api } from "../api/client";

type CartState = {
  count: number;
  refreshCount: () => Promise<void>;
};

export const useCartStore = create<CartState>((set) => ({
  count: 0,
  refreshCount: async () => {
    try {
      const me = await api.get<any>("users/me/");
      const orders = await api.get<any[]>("orders/");
      const pending = orders.find((o: any) => o.status === "pending" && o.user === me.id);
      if (!pending) { set({ count: 0 }); return; }
      const items = await api.get<any[]>(`order-items/?order=${pending.id}`);
      const c = items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0);
      set({ count: c });
    } catch {
      set({ count: 0 });
    }
  },
}));

