const axios = require("axios");
const { onRequest } = require("firebase-functions/v2/https");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
const TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";

exports.invoiceOnPayment = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send({ error: "method_not_allowed" });
      return;
    }
    const invoice = req.body;
    if (!invoice || !invoice.order) {
      res.status(400).send({ error: "missing_order" });
      return;
    }
    const headers = { Authorization: `Bearer ${TOKEN}` };
    const { data } = await axios.post(`${BASE_URL}invoices/`, invoice, { headers });
    res.status(200).send({ success: true, invoice: data });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
