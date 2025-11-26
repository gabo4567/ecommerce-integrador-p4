const axios = require("axios");
const {onRequest} = require("firebase-functions/v2/https");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
const TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";

async function handlePromo(payload) {
  if (!TOKEN) throw new Error("missing_service_token");
  const http = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${TOKEN}` },
    timeout: 15000,
  });
  const {action, orderId, discountId, orderDiscountId} = payload || {};
  if (!action) throw new Error("missing_action");
  if (action === "apply") {
    if (!orderId || !discountId) throw new Error("missing_order_or_discount");
    const {data} = await http.post("order-discounts/", {order: orderId, discount: discountId});
    return {applied: true, orderDiscount: data};
  }
  if (action === "remove") {
    if (!orderDiscountId) throw new Error("missing_orderDiscountId");
    await http.delete(`order-discounts/${orderDiscountId}/`);
    return {removed: true};
  }
  throw new Error("invalid_action");
}

exports.promoApplier = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") { res.status(405).send({error: "method_not_allowed"}); return; }
    const result = await handlePromo(req.body || {});
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send({error: "internal_error"});
  }
});

exports.handlePromo = handlePromo;
