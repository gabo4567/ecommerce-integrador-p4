const axios = require("axios");
const {onRequest} = require("firebase-functions/v2/https");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
let TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";
const REFRESH = process.env.SERVICE_REFRESH_TOKEN || "";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

const rateWindowMs = 60_000;
const rateMax = Number(process.env.RATE_MAX_PER_MIN || 30);
const hits = new Map();

function allowCORS(req, res) {
  const origin = req.headers.origin;
  if (!ALLOWED_ORIGINS.length) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function isRateLimited(req, keySuffix) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const key = `${ip}:${keySuffix}`;
  const now = Date.now();
  const bucket = hits.get(key) || { count: 0, reset: now + rateWindowMs };
  if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + rateWindowMs; }
  bucket.count += 1;
  hits.set(key, bucket);
  return bucket.count > rateMax;
}

exports.auditForwarder = onRequest(async (req, res) => {
  allowCORS(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (isRateLimited(req, "auditForwarder")) { res.status(429).send({ error: "rate_limited" }); return; }
  try {
    const http = axios.create({ baseURL: BASE_URL, timeout: 15000, headers: { Authorization: TOKEN ? `Bearer ${TOKEN}` : "" } });
    if (req.method === "GET") {
      const {data} = await http.get("audit/");
      res.status(200).send(data);
      return;
    }
    if (req.method === "POST") {
      try {
        const {data} = await http.post("audit/", req.body || {});
        res.status(201).send(data);
      } catch (err) {
        let code = err?.response?.status || 500;
        if (code === 405) { res.status(501).send({ error: "audit_post_not_supported" }); return; }
        const needRefresh = (code === 401) || (err?.response?.data?.code === 'token_not_valid');
        if (needRefresh && REFRESH) {
          try {
            const ref = await axios.post(`${BASE_URL}token/refresh/`, { refresh: REFRESH });
            TOKEN = ref?.data?.access || TOKEN;
            const retry = await axios.post("audit/", req.body || {}, { headers: { Authorization: `Bearer ${TOKEN}` } });
            res.status(201).send(retry.data);
            return;
          } catch (e) {
            code = e?.response?.status || 500;
            res.status(code).send({ error: "audit_forward_error" });
            return;
          }
        }
        res.status(code).send({ error: "audit_forward_error" });
      }
      return;
    }
    res.status(405).send({ error: "method_not_allowed" });
  } catch (err) {
    const code = err?.response?.status || 500;
    res.status(code).send({ error: "audit_forward_error" });
  }
});
