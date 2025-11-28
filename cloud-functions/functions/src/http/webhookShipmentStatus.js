import axios from "axios";
import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import 'dotenv/config';


// Usar variables de entorno para desarrollo local

export const webhookShipmentStatus = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send({ error: "method_not_allowed" });
      return;
    }
    const { id, status, tracking_number, order, old_status, new_status, reason } = req.body || {};
    if (!id || !status || !tracking_number) {
      res.status(400).send({ error: "invalid_body" });
      return;
    }
    const baseUrl = process.env.BACKEND_BASE_URL;
    const token = req.body.user_token || process.env.SERVICE_ACCESS_TOKEN;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const patchResp = await axios.patch(`${baseUrl}shipments/${id}/`, { status }, { headers });
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