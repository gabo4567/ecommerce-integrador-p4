import { useAuthStore } from "../store/auth";

const baseUrl = (import.meta.env?.VITE_API_BASE_URL) ?? "http://localhost:8000/api/";

async function request(path, method = "GET", body) {
  const auth = useAuthStore.getState();
  const headers = { "Content-Type": "application/json" };
  if (auth.accessToken && auth.refreshToken) headers["Authorization"] = `Bearer ${auth.accessToken}`;
  const res = await fetch(new URL(path, baseUrl).toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && auth.refreshToken) {
    const refreshed = await refreshToken(auth.refreshToken);
    if (refreshed) {
      const newHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${useAuthStore.getState().accessToken}` };
      const retry = await fetch(new URL(path, baseUrl).toString(), {
        method,
        headers: newHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!retry.ok) throw new Error(await retry.text());
      return retry.json();
    }
  }
  if (res.status === 401 && method === "GET") {
    try { useAuthStore.getState().logout?.(); } catch {}
    return null;
  }
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

async function refreshToken(refresh) {
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
  get: (path) => request(path, "GET"),
  post: (path, body) => request(path, "POST", body),
  put: (path, body) => request(path, "PUT", body),
  patch: (path, body) => request(path, "PATCH", body),
  del: (path) => request(path, "DELETE"),
  baseUrl,
};

