const axios = require("axios");
const {onSchedule} = require("firebase-functions/v2/scheduler");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
const TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";
const AGE_HOURS = Number(process.env.ORDER_CANCEL_AGE_HOURS || 48);

async function run() {
  if (!TOKEN) return;
  const http = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${TOKEN}` },
    timeout: 20000,
  });
  const {data} = await http.get("orders/", {params: {status: "pending"}});
  const now = Date.now();
  const tasks = [];
  for (const o of Array.isArray(data) ? data : []) {
    const created = new Date(o.created_at).getTime();
    const ageHours = (now - created) / 3600000;
    if (ageHours >= AGE_HOURS) {
      tasks.push(http.patch(`orders/${o.id}/`, {status: "cancelled"}));
      tasks.push(http.post("order-status-history/", {order: o.id, old_status: o.status, new_status: "cancelled", changed_by: null, reason: "auto-cancel"}));
    }
  }
  if (tasks.length) await Promise.allSettled(tasks);
}

exports.orderAutoCancel = onSchedule({schedule: "every 1 hours", timeZone: "UTC"}, async () => {
  await run();
});

exports.runOrderAutoCancel = run;
