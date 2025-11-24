import axios from "axios"
import { onRequest } from "firebase-functions/v2/https"
import { defineSecret } from "firebase-functions/params"

const baseUrl = process.env.BACKEND_BASE_URL || ""
const SERVICE_ACCESS_TOKEN = defineSecret("SERVICE_ACCESS_TOKEN")

export const shipmentTrackingRefreshHttp = onRequest({ secrets: [SERVICE_ACCESS_TOKEN] }, async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send({ error: "method_not_allowed" })
      return
    }
    const headers = { Authorization: `Bearer ${SERVICE_ACCESS_TOKEN.value()}` }
    const listResp = await axios.get(`${baseUrl}shipments/`, { headers })
    const shipments = Array.isArray(listResp.data) ? listResp.data : listResp.data?.results || []
    const results = []
    for (const s of shipments) {
      if (!s?.id) continue
      const body = {}
      if (s?.tracking_number) body.tracking_number = s.tracking_number
      if (s?.status) body.status = s.status
      try {
        const pr = await axios.patch(`${baseUrl}shipments/${s.id}/`, body, { headers })
        results.push({ id: s.id, ok: true })
      } catch (e) {
        results.push({ id: s.id, ok: false })
      }
    }
    res.status(200).send({ refreshed: results.length, results })
  } catch (error) {
    const statusCode = error.response?.status || 500
    const payload = error.response?.data || { error: error.message }
    res.status(statusCode).send(payload)
  }
})

export const runShipmentTrackingRefreshHttp = shipmentTrackingRefreshHttp