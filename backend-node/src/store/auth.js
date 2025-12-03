import { create } from "zustand";
import { api } from "../api/client";
import { getGuestCart } from "../lib/utils";
import { useCartStore } from "./cart";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function setCookie(name, value) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; expires=${expires}`;
}
function delCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

const initialAccess = typeof window !== "undefined" ? (localStorage.getItem("accessToken") || getCookie("accessToken")) : null;
const initialRefresh = typeof window !== "undefined" ? (localStorage.getItem("refreshToken") || getCookie("refreshToken")) : null;
const initialUsername = typeof window !== "undefined" ? (localStorage.getItem("username") || getCookie("username")) : null;
const initialRole = typeof window !== "undefined" ? (localStorage.getItem("role") || getCookie("role")) : null;

export const useAuthStore = create((set) => ({
  accessToken: initialAccess,
  refreshToken: initialRefresh,
  username: initialUsername,
  role: initialRole,
  setTokens: (access, refresh) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", access ?? "");
      if (refresh) localStorage.setItem("refreshToken", refresh); else localStorage.removeItem("refreshToken");
      if (access) setCookie("accessToken", access); else delCookie("accessToken");
      if (refresh) setCookie("refreshToken", refresh); else delCookie("refreshToken");
    }
    set({ accessToken: access, refreshToken: refresh ?? null });
  },
  login: async (identifier, password) => {
    try {
      const base = (import.meta).env?.VITE_API_BASE_URL ?? "http://localhost:8000/api/";
      const isEmail = typeof identifier === "string" && identifier.includes("@");
      const url = new URL(isEmail ? "token/by-email/" : "token/", base).toString();
      const body = isEmail ? { email: identifier, password } : { username: identifier, password };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) return false;
      const data = await res.json();
      const username = data?.username ?? (isEmail ? identifier : identifier);
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        localStorage.setItem("username", username);
        setCookie("accessToken", data.access);
        setCookie("refreshToken", data.refresh);
        setCookie("username", username);
      }
      set({ accessToken: data.access, refreshToken: data.refresh, username });
      try {
        const meRes = await fetch(new URL("users/me/", base).toString(), { headers: { "Authorization": `Bearer ${data.access}` } });
        if (meRes.ok) {
          const me = await meRes.json();
          const role = me?.role ?? null;
          if (typeof window !== "undefined") {
            if (role) localStorage.setItem("role", role); else localStorage.removeItem("role");
            if (role) setCookie("role", role); else delCookie("role");
          }
          set({ role });
        }
      } catch {}
      try {
        const guest = getGuestCart();
        if (guest.length) {
          const me = await api.get("users/me/");
          const orders = await api.get("orders/");
          let pending = orders.find((o) => o.status === "pending" && o.user === me.id);
          if (!pending) pending = await api.post("orders/", {});
          for (const it of guest) {
            await api.post("order-items/", { order: pending.id, product: it.id, quantity: it.quantity, unit_price: it.price });
          }
          if (typeof window !== "undefined") localStorage.removeItem("guestCartItems");
          await useCartStore.getState().refreshCount();
        }
      } catch {}
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      delCookie("accessToken");
      delCookie("refreshToken");
      delCookie("username");
      delCookie("role");
    }
    set({ accessToken: null, refreshToken: null, username: null, role: null });
  },
}));

