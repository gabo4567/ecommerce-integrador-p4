import axios from "axios"
import { onSchedule } from "firebase-functions/v2/scheduler"

const baseUrl = process.env.BACKEND_BASE_URL || ""
const token = process.env.SERVICE_ACCESS_TOKEN || ""

export const shipmentTrackingRefresh = onSchedule("every 60 minutes", async () => {
  const headers = { Authorization: `Bearer ${token}` }
  const listResp = await axios.get(`${baseUrl}shipments/`, { headers })
  const shipments = Array.isArray(listResp.data) ? listResp.data : listResp.data?.results || []
  for (const s of shipments) {
    if (!s?.id) continue
    const body = {}
    if (s?.tracking_number) body.tracking_number = s.tracking_number
    if (s?.status) body.status = s.status
    try {
      await axios.patch(`${baseUrl}shipments/${s.id}/`, body, { headers })
    } catch (e) { void e }
  }
})

export const runShipmentTrackingRefresh = shipmentTrackingRefresh