const axios = require("axios");
const {onRequest} = require("firebase-functions/v2/https");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
let TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";
const REFRESH = process.env.SERVICE_REFRESH_TOKEN || "";

async function ensureAuth() {
  if (!TOKEN && REFRESH) {
    const {data} = await axios.post(`${BASE_URL}token/refresh/`, { refresh: REFRESH });
    TOKEN = data?.access || TOKEN;
  }
  if (!TOKEN) throw new Error("missing_service_token");
}

async function handlePromo(payload) {
  await ensureAuth();
  const http = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${TOKEN}` },
    timeout: 15000,
  });
  const {action, orderId, discountId, orderDiscountId, percent} = payload || {};
  if (!action) throw new Error("missing_action");
  if (action === "apply") {
    if (!orderId) throw new Error("missing_orderId");
    let did = discountId;
    if (!did && percent) {
      try {
        const {data: ds} = await http.get("discounts/");
        const match = (ds || []).find(d => Number(d.percentage) === Number(percent) && d.active);
        if (match) did = match.id;
      } catch {}
      if (!did) {
        const now = new Date();
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const payloadD = { name: `Auto ${percent}%`, percentage: Number(percent), start_date: now.toISOString().slice(0,10), end_date: end.toISOString().slice(0,10), active: true };
        const {data: created} = await http.post("discounts/", payloadD);
        did = created.id;
      }
    }
    if (!did) throw new Error("missing_discountId");
    try {
      const {data: existing} = await http.get(`order-discounts/?order=${orderId}`);
      const already = (existing || []).some(od => Number(od.discount) === Number(did));
      if (already) return {applied: false, already: true, discountId: did};
    } catch {}
    let data;
    try {
      ({data} = await http.post("order-discounts/", {order: orderId, discount: did}));
    } catch (err) {
      const needRefresh = (err?.response?.status === 401) || (err?.response?.data?.code === 'token_not_valid');
      if (needRefresh && REFRESH) {
        const ref = await axios.post(`${BASE_URL}token/refresh/`, { refresh: REFRESH });
        TOKEN = ref?.data?.access || TOKEN;
        const retry = await axios.post(`${BASE_URL}order-discounts/`, {order: orderId, discount: did}, { headers: { Authorization: `Bearer ${TOKEN}` } });
        data = retry.data;
      } else {
        throw err;
      }
    }
    return {applied: true, orderDiscount: data, discountId: did};
  }
  if (action === "remove") {
    if (orderDiscountId) {
      await http.delete(`order-discounts/${orderDiscountId}/`);
      return {removed: true};
    }
    if (!orderId) throw new Error("missing_orderId_for_remove");
    const {data: ods} = await http.get(`order-discounts/?order=${orderId}`);
    const first = (ods || [])[0];
    if (!first) return {removed: false, none: true};
    try {
      await http.delete(`order-discounts/${first.id}/`);
    } catch (err) {
      const needRefresh = (err?.response?.status === 401) || (err?.response?.data?.code === 'token_not_valid');
      if (needRefresh && REFRESH) {
        const ref = await axios.post(`${BASE_URL}token/refresh/`, { refresh: REFRESH });
        TOKEN = ref?.data?.access || TOKEN;
        await axios.delete(`${BASE_URL}order-discounts/${first.id}/`, { headers: { Authorization: `Bearer ${TOKEN}` } });
      } else {
        throw err;
      }
    }
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
    const code = err?.response?.status || (err.message === 'missing_service_token' ? 401 : 500);
    const data = err?.response?.data || { error: err.message || "internal_error" };
    res.status(code).send(data);
  }
});

exports.handlePromo = handlePromo;
