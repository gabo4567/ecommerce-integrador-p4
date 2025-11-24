import axios from "axios"
import { onRequest } from "firebase-functions/v2/https"
import { defineSecret } from "firebase-functions/params"

const baseUrl = process.env.BACKEND_BASE_URL || ""
const SERVICE_ACCESS_TOKEN = defineSecret("SERVICE_ACCESS_TOKEN")

export const webhookShipmentStatus = onRequest({ secrets: [SERVICE_ACCESS_TOKEN] }, async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send({ error: "method_not_allowed" })
      return
    }
    const { id, status, tracking_number, order, old_status, new_status, reason } = req.body || {}
    if (!id || !status || !tracking_number) {
      res.status(400).send({ error: "invalid_body" })
      return
    }
    const headers = { Authorization: `Bearer ${SERVICE_ACCESS_TOKEN.value()}` }
    const patchResp = await axios.patch(`${baseUrl}shipments/${id}/`, { status, tracking_number }, { headers })
    let historyResp = null
    if (order && old_status && new_status) {
      historyResp = await axios.post(
        `${baseUrl}order-status-history/`,
        { order, old_status, new_status, reason: reason || "Carrier update" },
        { headers }
      )
    }
    res.status(200).send({ shipment: patchResp.data, history: historyResp ? historyResp.data : null })
  } catch (error) {
    const statusCode = error.response?.status || 500
    const payload = error.response?.data || { error: error.message }
    res.status(statusCode).send(payload)
  }
})

export const runWebhookShipmentStatus = webhookShipmentStatus