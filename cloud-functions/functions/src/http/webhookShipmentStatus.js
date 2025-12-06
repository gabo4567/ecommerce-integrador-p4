import axios from "axios";
import { onRequest } from "firebase-functions/v2/https";
import "dotenv/config";
let SERVICE_TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";
const SERVICE_REFRESH = process.env.SERVICE_REFRESH_TOKEN || "";


// Usar variables de entorno para desarrollo local

export const webhookShipmentStatus = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send({ error: "method_not_allowed" });
      return;
    }
    const { id, shipmentId, status, tracking_number, order, old_status, new_status, reason } = req.body || {};
    const sid = id || shipmentId;
    if (!sid || !status) { res.status(400).send({ error: "invalid_body" }); return; }
    const baseUrl = process.env.BACKEND_BASE_URL;
    const token = req.body.user_token || SERVICE_TOKEN;
    const headers = { "Authorization": token ? `Bearer ${token}` : "", "Content-Type": "application/json" };
    let track = tracking_number;
    if (!track) {
      try { const cur = await axios.get(`${baseUrl}shipments/${sid}/`, { headers }); track = cur?.data?.tracking_number || ""; }
      catch {}
    }
    let patchResp;
    try {
      patchResp = await axios.patch(`${baseUrl}shipments/${sid}/`, { status, tracking_number: track }, { headers });
    } catch (err) {
      const needRefresh = (err?.response?.status === 401) || (err?.response?.data?.code === 'token_not_valid');
      if (needRefresh && SERVICE_REFRESH) {
        const ref = await axios.post(`${baseUrl}token/refresh/`, { refresh: SERVICE_REFRESH });
        SERVICE_TOKEN = ref?.data?.access || SERVICE_TOKEN;
        const headers2 = { "Authorization": `Bearer ${SERVICE_TOKEN}`, "Content-Type": "application/json" };
        patchResp = await axios.patch(`${baseUrl}shipments/${sid}/`, { status, tracking_number: track }, { headers: headers2 });
      } else { throw err; }
    }
    let historyResp = null;
    if (order && old_status && new_status) {
      const payload = { order, old_status, new_status, reason: reason || "Carrier update" };
      try {
        historyResp = await axios.post(
          `${baseUrl}order-status-history/`,
          payload,
          { headers }
        );
        console.log("[webhookShipmentStatus] Respuesta de order-status-history:", historyResp.status, historyResp.data);
      } catch (err) {
        console.error("[webhookShipmentStatus] Error en order-status-history:", err?.response?.status, err?.response?.data || err.message);
      }
    }
    res.status(200).send({ shipment: patchResp.data, history: historyResp ? historyResp.data : null });
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const payload = error.response?.data || { error: error.message };
    res.status(statusCode).send(payload);
  }
});

export const runWebhookShipmentStatus = webhookShipmentStatus
