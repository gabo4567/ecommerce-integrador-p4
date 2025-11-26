const axios = require("axios");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
const TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";
const FEED_URL = process.env.INVENTORY_FEED_URL || "";

async function applyUpdates(updates) {
  if (!TOKEN) return {processed: 0};
  const http = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${TOKEN}` },
    timeout: 25000,
  });
  let processed = 0;
  if (updates && Array.isArray(updates.products)) {
    for (const p of updates.products) {
      if (p && p.id) {
        await http.patch(`products/${p.id}/`, {price: p.price, stock: p.stock});
        processed++;
      }
    }
  }
  if (updates && Array.isArray(updates.variants)) {
    for (const v of updates.variants) {
      if (v && v.id) {
        await http.patch(`variants/${v.id}/`, {price: v.price, stock: v.stock, active: v.active});
        processed++;
      }
    }
  }
  return {processed};
}

exports.inventorySyncCron = onSchedule({schedule: "every 24 hours", timeZone: "UTC"}, async () => {
  if (!FEED_URL || !TOKEN) return;
  const {data} = await axios.get(FEED_URL, {timeout: 30000});
  await applyUpdates(data);
});

exports.inventorySyncHttp = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send({error: "method_not_allowed"});
      return;
    }
    const result = await applyUpdates(req.body || {});
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send({error: "internal_error"});
  }
});

exports.applyInventoryUpdates = applyUpdates;
