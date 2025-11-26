const axios = require("axios");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
const TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";

async function reconcilePayments() {
  if (!TOKEN) return;
  const headers = { Authorization: `Bearer ${TOKEN}` };
  const { data: payments } = await axios.get(`${BASE_URL}payments/`, { headers });
  const tasks = [];
  for (const payment of Array.isArray(payments) ? payments : []) {
    let providerStatus = payment.amount > 0 ? "approved" : "rejected";
    if (payment.status !== providerStatus) {
      tasks.push(axios.patch(`${BASE_URL}payments/${payment.id}/`, { status: providerStatus }, { headers }));
      tasks.push(axios.patch(`${BASE_URL}orders/${payment.order}/`, { status: providerStatus === "approved" ? "paid" : "rejected" }, { headers }));
      tasks.push(axios.post(`${BASE_URL}order-status-history/`, {
        order: payment.order,
        old_status: payment.status,
        new_status: providerStatus === "approved" ? "paid" : "rejected",
        reason: "Reconciliación automática"
      }, { headers }));
    }
  }
  if (tasks.length) await Promise.allSettled(tasks);
}

exports.paymentReconciliation = onSchedule({ schedule: "every 1 hours", timeZone: "UTC" }, async () => {
  await reconcilePayments();
});

exports.runPaymentReconciliation = reconcilePayments;
