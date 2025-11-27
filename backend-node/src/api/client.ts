import { useAuthStore } from "../store/auth";

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:8000/api/";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(path: string, method: HttpMethod = "GET", body?: any) {
  const auth = useAuthStore.getState();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.accessToken) headers["Authorization"] = `Bearer ${auth.accessToken}`;
  const res = await fetch(new URL(path, baseUrl).toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && auth.refreshToken) {
    const refreshed = await refreshToken(auth.refreshToken);
    if (refreshed) {
      const newHeaders: Record<string, string> = { "Content-Type": "application/json", "Authorization": `Bearer ${useAuthStore.getState().accessToken}` };
      const retry = await fetch(new URL(path, baseUrl).toString(), {
        method,
        headers: newHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!retry.ok) throw new Error(await retry.text());
      return retry.json() as Promise<T>;
    }
  }
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

async function refreshToken(refresh: string) {
  try {
    const res = await fetch(new URL("token/refresh/", baseUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    useAuthStore.getState().setTokens(data.access, (data.refresh ?? refresh));
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, "GET"),
  post: <T>(path: string, body: any) => request<T>(path, "POST", body),
  put: <T>(path: string, body: any) => request<T>(path, "PUT", body),
  patch: <T>(path: string, body: any) => request<T>(path, "PATCH", body),
  del: <T>(path: string) => request<T>(path, "DELETE"),
  baseUrl,
};
