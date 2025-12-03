const {onRequest} = require("firebase-functions/v2/https");
const {runOrderAutoCancel} = require("../cron/orderAutoCancel");

exports.orderAutoCancelHttp = onRequest(async (req, res) => {
  if (req.method !== "POST") { res.status(405).send({error: "method_not_allowed"}); return; }
  try { await runOrderAutoCancel(); res.status(200).send({ok: true}); }
  catch { res.status(500).send({error: "internal_error"}); }
});

