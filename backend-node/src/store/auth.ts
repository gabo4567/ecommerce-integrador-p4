import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  setTokens: (access: string, refresh: string | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const initialAccess = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const initialRefresh = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
const initialUsername = typeof window !== "undefined" ? localStorage.getItem("username") : null;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialAccess,
  refreshToken: initialRefresh,
  username: initialUsername,
  setTokens: (access, refresh) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", access ?? "");
      if (refresh) localStorage.setItem("refreshToken", refresh); else localStorage.removeItem("refreshToken");
    }
    set({ accessToken: access, refreshToken: refresh ?? null });
  },
  login: async (username, password) => {
    try {
      const res = await fetch("http://localhost:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        localStorage.setItem("username", username);
      }
      set({ accessToken: data.access, refreshToken: data.refresh, username });
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
    }
    set({ accessToken: null, refreshToken: null, username: null });
  },
}));
