const EMULATOR_BASE = "http://127.0.0.1:5003/proyectoprog4-fb1eb/us-central1/";
const PROD_BASE = "https://us-central1-proyectoprog4-fb1eb.cloudfunctions.net/";

const raw = (import.meta.env?.VITE_FUNCTIONS_BASE_URL);
const baseUrl = typeof raw === 'string' && /^https?:\/\//i.test(raw)
  ? raw
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? EMULATOR_BASE
    : PROD_BASE;

async function request(fnName, method = 'POST', body) {
  const url = new URL(fnName, baseUrl).toString();
  let auth = null;
  try { auth = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null; } catch {}
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth ? { 'Authorization': `Bearer ${auth}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json().catch(() => ({}));
}

export const functionsApi = {
  post: (fnName, payload) => request(fnName, 'POST', payload),
  baseUrl,
};

