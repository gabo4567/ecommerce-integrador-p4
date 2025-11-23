const axios = require("axios");
const { onRequest } = require("firebase-functions/v2/https");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
const TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";

exports.webhookPaymentNotify = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send({ error: "method_not_allowed" });
      return;
    }
    const payment = req.body;
    if (!payment || !payment.order) {
      res.status(400).send({ error: "missing_order" });
      return;
    }
    const headers = { Authorization: `Bearer ${TOKEN}` };
    await axios.post(`${BASE_URL}payments/`, payment, { headers });
    const orderStatus = payment.status === "approved" ? "paid" : payment.status === "rejected" ? "rejected" : "pending";
    await axios.patch(`${BASE_URL}orders/${payment.order}/`, { status: orderStatus }, { headers });
    await axios.post(`${BASE_URL}order-status-history/`, {
      order: payment.order,
      old_status: "pending",
      new_status: orderStatus,
      reason: payment.status === "approved" ? "Pago aprobado" : payment.status === "rejected" ? "Pago rechazado" : "Pago pendiente"
    }, { headers });
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
