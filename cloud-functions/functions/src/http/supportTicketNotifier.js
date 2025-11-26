const axios = require("axios");
const {onRequest} = require("firebase-functions/v2/https");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function isRateLimited(req) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const key = `${ip}:supportTicketNotifier`;
  const now = Date.now();
  const bucket = hits.get(key) || { count: 0, reset: now + rateWindowMs };
  if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + rateWindowMs; }
  bucket.count += 1;
  hits.set(key, bucket);
  return bucket.count > rateMax;
}

exports.supportTicketNotifier = onRequest(async (req, res) => {
  allowCORS(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send({ error: "method_not_allowed" }); return; }
  if (isRateLimited(req)) { res.status(429).send({ error: "rate_limited" }); return; }
  try {
    const payload = req.body || {};
    const type = (payload.type || payload.action || "create").toLowerCase();
    const http = axios.create({ baseURL: BASE_URL, timeout: 15000, headers: { Authorization: req.headers.authorization || "" } });
    if (type === "create") {
      const body = {
        order: payload.order || null,
        product: payload.product || null,
        subject: payload.subject,
        message: payload.message,
        priority: payload.priority || "normal",
      };
      const {data} = await http.post("support-tickets/", body);
      res.status(201).send(data);
      return;
    }
    if (type === "update") {
      const id = payload.id || payload.ticket_id;
      if (!id) { res.status(400).send({ error: "missing_ticket_id" }); return; }
      const body = {};
      if (payload.priority) body.priority = payload.priority;
      if (payload.status) body.status = payload.status;
      const {data} = await http.patch(`support-tickets/${id}/`, body);
      res.status(200).send(data);
      return;
    }
    res.status(400).send({ error: "invalid_type" });
  } catch (err) {
    const code = err?.response?.status || 500;
    res.status(code).send({ error: "support_ticket_error" });
  }
});