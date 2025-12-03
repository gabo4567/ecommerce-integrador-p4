const raw = import.meta.env?.VITE_AI_BASE_URL;
const defaultUrl = "http://localhost:5002/";
const baseUrl = (typeof raw === "string" && /^https?:\/\//i.test(raw)) ? raw : defaultUrl;

async function request(path, method = "POST", body) {
  const headers = { "Content-Type": "application/json" };
  const url = new URL(path, baseUrl).toString();
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const ai = {
  generateDescription: (payload) => request("api/generate-description", "POST", payload),
  generateSpecs: (payload) => request("api/generate-specs", "POST", payload),
  baseUrl,
};
