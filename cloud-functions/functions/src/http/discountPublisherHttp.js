const {onRequest} = require("firebase-functions/v2/https");
const {runDiscountPublisher} = require("../cron/discountPublisher");

exports.discountPublisherHttp = onRequest(async (req, res) => {
  if (req.method !== "POST") { res.status(405).send({error: "method_not_allowed"}); return; }
  try { await runDiscountPublisher(); res.status(200).send({ok: true}); }
  catch { res.status(500).send({error: "internal_error"}); }
});

