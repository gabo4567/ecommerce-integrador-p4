const axios = require("axios");
const {onRequest} = require("firebase-functions/v2/https");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

const rateWindowMs = 60_000;
const rateMax = Number(process.env.RATE_MAX_PER_MIN || 60);
const hits = new Map();

function allowCORS(req, res) {
  const origin = req.headers.origin;
  if (!ALLOWED_ORIGINS.length) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function isRateLimited(req) {
  try {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const key = `${ip}:authProxyLogin`;
    const now = Date.now();
    const bucket = hits.get(key) || { count: 0, reset: now + rateWindowMs };
    if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + rateWindowMs; }
    bucket.count += 1;
    hits.set(key, bucket);
    return bucket.count > rateMax;
  } catch { return false; }
}

async function forwardLogin(payload) {
  const http = axios.create({ baseURL: BASE_URL, timeout: 15000 });
  if (payload && typeof payload.refresh === "string" && payload.refresh.length) {
    const {data} = await http.post("token/refresh/", { refresh: payload.refresh });
    return data;
  }
  const {data} = await http.post("token/", { username: payload?.username, password: payload?.password });
  return data;
}

exports.authProxyLogin = onRequest(async (req, res) => {
  allowCORS(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send({ error: "method_not_allowed" }); return; }
  if (isRateLimited(req)) { res.status(429).send({ error: "rate_limited" }); return; }
  try {
    const result = await forwardLogin(req.body || {});
    console.log("authProxyLogin", req.method, req.path, 200);
    res.status(200).send(result);
  } catch (err) {
    console.error("authProxyLogin error", err?.response?.status, err?.message);
    const code = err?.response?.status || 500;
    res.status(code).send({ error: "auth_proxy_error" });
  }
});