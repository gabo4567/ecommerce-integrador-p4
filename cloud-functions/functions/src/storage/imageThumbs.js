const axios = require("axios");
const {onObjectFinalized} = require("firebase-functions/v2/storage");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
const TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";

async function handler(event) {
  if (!TOKEN) return;
  const http = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${TOKEN}` },
    timeout: 15000,
  });
  const bucket = event.data.bucket;
  const name = event.data.name;
  const meta = event.data.metadata || {};
  const url = `https://storage.googleapis.com/${bucket}/${name}`;
  const parts = String(name).split("/");
  let productId = Number(parts[1]) || null;
  let variantId = parts.length > 2 ? Number(parts[2]) || null : null;
  if (meta.imageId) {
    await http.patch(`images/${meta.imageId}/`, {url});
    return;
  }
  const payload = {product: productId, variant: variantId, url};
  await http.post("images/", payload);
}

exports.imageThumbs = onObjectFinalized(handler);
exports.simulateImageFinalized = handler;
