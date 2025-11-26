const axios = require("axios");
const {onSchedule} = require("firebase-functions/v2/scheduler");

const BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:8000/api/";
const TOKEN = process.env.SERVICE_ACCESS_TOKEN || "";

async function run() {
  if (!TOKEN) return;
  const http = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${TOKEN}` },
    timeout: 15000,
  });
  const {data} = await http.get("discounts/");
  const now = new Date();
  const tasks = [];
  for (const d of Array.isArray(data) ? data : []) {
    const start = new Date(d.start_date);
    const end = new Date(d.end_date);
    const shouldBeActive = now >= start && now <= end;
    if (shouldBeActive !== Boolean(d.active)) {
      tasks.push(http.patch(`discounts/${d.id}/`, {active: shouldBeActive}));
    }
  }
  if (tasks.length) await Promise.allSettled(tasks);
}

exports.discountPublisher = onSchedule({schedule: "every 60 minutes", timeZone: "UTC"}, async () => {
  await run();
});

exports.runDiscountPublisher = run;
