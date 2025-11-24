# Cloud Functions — Integrante 3 (Envíos y Tracking)

## Objetivo
- Implementar funciones para actualizar estado de envíos vía webhook y refrescar tracking de forma periódica.
- Todas las llamadas al backend Python usan `Authorization: Bearer <SERVICE_ACCESS_TOKEN>` y respetan rutas, métodos y bodies definidos.

## Estructura
- `src/http/webhookShipmentStatus.js`
- `src/cron/shipmentTrackingRefresh.js`
- `src/index.js` exporta ambas funciones

## Variables de entorno
- `BACKEND_BASE_URL` (ejemplo: `http://localhost:8000/api/`)
- `SERVICE_ACCESS_TOKEN`
- Windows (PowerShell):
  - `setx BACKEND_BASE_URL "http://localhost:8000/api/"`
  - `setx SERVICE_ACCESS_TOKEN "<tu_token>"`
- Reinicia la terminal para que apliquen.
- Nota: No se usan Secrets ni despliegue de Functions; este proyecto está preparado para plan Spark usando emuladores y variables locales.

## Funciones
- `webhookShipmentStatus` (HTTP)
  - Método: `POST`
  - Body requerido (shipment):
    - `id` (number)
    - `status` (`preparing|shipped|delivered|cancelled`)
    - `tracking_number` (string)
  - Body opcional (history):
    - `order` (number)
    - `old_status` (`paid|shipped`)
    - `new_status` (`shipped|delivered|cancelled`)
    - `reason` (string, por defecto `Carrier update`)
  - Comportamiento:
    - `PATCH /api/shipments/{id}/` con `{ status, tracking_number }`
    - Si se envía historia, `POST /api/order-status-history/` con `{ order, old_status, new_status, reason }`
  - Respuesta: `{ shipment, history|null }`

- `shipmentTrackingRefreshHttp` (HTTP)
  - Método: `POST`
  - Comportamiento:
    - `GET /api/shipments/`
    - Itera envíos y hace `PATCH /api/shipments/{id}/` con `tracking_number` y `status` existentes (idempotente)

## Ejemplos
- HTTP (emulador Functions):
  - Reemplaza `<project-id>` y región si difiere.
  - `curl -X POST "http://localhost:5001/<project-id>/us-central1/webhookShipmentStatus" -H "Content-Type: application/json" -d "{ \"id\": 123, \"status\": \"shipped\", \"tracking_number\": \"ABC123\", \"order\": 456, \"old_status\": \"paid\", \"new_status\": \"shipped\", \"reason\": \"Carrier update\" }"`

## Test local (sin emulador)
- Cada archivo exporta también un alias para invocar en pruebas:
  - `runWebhookShipmentStatus`
  - `runShipmentTrackingRefresh`
- Úsalo desde un script Node que construya `req` y `res` mínimos.

## Emuladores
- `firebase emulators:start --only functions,storage`
- Invoca las funciones HTTP con `curl` y verifica que el backend responda correctamente.
- Despliegue a Firebase Cloud Functions requiere plan Blaze; se trabaja en local con emuladores.

## Buenas prácticas
- Validar método y body.
- Manejar errores devolviendo códigos HTTP del backend o `500` si aplica.
- Registrar logs para diagnóstico.
- Mantener idempotencia en cron.
- Usar `SERVICE_ACCESS_TOKEN` vigente y `BACKEND_BASE_URL` correcto.