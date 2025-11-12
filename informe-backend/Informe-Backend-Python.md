# Informe Técnico Backend Python — Onboarding, Endpoints y Cambios

Este documento está listo para compartir internamente. No modifica el proyecto. Resume qué se implementó, cómo instalar y correr el backend, qué endpoints existen y cuáles se pueden habilitar.

## Visión General
- Carrito de compras usando `Order` con estado `pending` y `OrderItem`; el `total` del pedido se recalcula automáticamente al crear/editar/eliminar ítems.
- Catálogo extendido:
  - `ProductVariant` para SKU/stock/precio por variante (color, almacenamiento).
  - `ProductSpec` para ficha técnica clave–valor (no afecta el SKU).
  - `ProductImage` para imágenes por producto y por variante (opcional).
- Pedidos: `OrderStatusHistory` para trazabilidad del estado del pedido.
- Sistema: `SupportTicket` para tickets de soporte, con vínculo opcional a pedido y producto.
- Autenticación JWT integrada (login y refresh).
- Migraciones generadas y aplicadas en `products`, `orders`, `system`.

## Quick Start (Instalación y Ejecución en Windows)
- Prerrequisitos:
  - `Python 3.11+`
  - `PostgreSQL 14+` con base y usuario creados
- Preparación:
  - `git clone <repo>`
  - `cd backend-python`
  - `python -m venv venv`
  - `venv\Scripts\activate`
  - `pip install -r requirements.txt`
- Base de datos:
  - `python manage.py migrate`
  - `python manage.py createsuperuser`
- Ejecutar servidor:
  - `python manage.py runserver`
  - Acceso: `http://localhost:8000/`

## Variables de Entorno (.env)
- Ruta: `backend-python/.env` (cargado en `core/settings.py`).
- Requeridas:
  - `DJANGO_SECRET_KEY=<clave-segura>`
  - `DJANGO_DEBUG=1` (dev) o `0` (prod)
  - `DB_NAME=<tu_db>`
  - `DB_USER=<tu_usuario>`
  - `DB_PASSWORD=<tu_password>`
  - `DB_HOST=localhost`
  - `DB_PORT=5432`
- Opcionales (email y branding):
  - `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `EMAIL_USE_SSL`
  - `SITE_NAME`, `SITE_URL`

## Dependencias (backend-python/requirements.txt)
- `Django`
- `djangorestframework`
- `djangorestframework_simplejwt`
- `django-cors-headers`
- `psycopg2-binary`
- `python-dotenv`

## Rutas y Configuración
- Archivo raíz de rutas: `backend-python/core/urls.py`.
- Incluye:
  - `admin/`
  - `api/` → `products.urls`
  - `api/users/` → `users.urls`
  - `api/token/`, `api/token/refresh/` (JWT)
- Acción requerida para habilitar carrito/pedidos:
  - Agregar `path('api/', include('orders.urls')),` en `core/urls.py`.

## Endpoints Actuales
- Autenticación (JWT):
  - `POST /api/token/`
  - `POST /api/token/refresh/`
- Usuarios (cambio y reset de contraseña):
  - `POST /api/users/change-password/`
  - `POST /api/users/password-reset/request/`
  - `POST /api/users/password-reset/confirm/`
- Productos (DRF Router):
  - `GET /api/products/`
  - `POST /api/products/`
  - `GET /api/products/{id}/`
  - `PATCH /api/products/{id}/`
  - `DELETE /api/products/{id}/`
  - `GET /api/categories/`, `POST /api/categories/`, `GET/PATCH/DELETE /api/categories/{id}/`

## Pedidos y Carrito (se habilitan al incluir orders.urls)
- Orders:
  - `GET /api/orders/`
  - `POST /api/orders/`
  - `GET/PATCH/DELETE /api/orders/{id}/`
- Ítems del pedido (carrito):
  - `GET /api/order-items/?order={order_id}`
  - `POST /api/order-items/` (body: `order`, `product`, `quantity`, `unit_price`)
  - `GET /api/order-items/{id}/`
  - `PATCH /api/order-items/{id}/`
  - `DELETE /api/order-items/{id}/`
- Seguridad:
  - Usuarios autenticados solo ven y modifican sus propios pedidos e ítems.
  - `Order.total` se recalcula automáticamente en modificaciones de ítems.

## Modelos Añadidos (ya migrados)
- `ProductVariant`
  - `product`, `sku` (único), `price`, `stock`, `color`, `storage`, `active`
  - Índices: `product`, `active`
- `ProductSpec`
  - `product`, `key`, `value`, `unit` (opcional), `display_order`, `searchable`
  - Unicidad: `(product, key)`; índice `(product, key)`; orden por `display_order`, `key`
- `ProductImage`
  - `product`, `variant` (opcional), `url`, `is_primary`, `sort_order`, `created_at`
  - Índices: `product`, `variant`, `is_primary`; orden por `sort_order`, `created_at`
- `OrderStatusHistory`
  - `order`, `old_status`, `new_status`, `changed_by`, `changed_at`, `reason`
  - Índices: `order`, `new_status`
- `SupportTicket`
  - `user`, `order` (opcional), `product` (opcional), `subject`, `message`, `status`, `priority`, `created_at`, `closed_at`
  - Índices: `(user, status)`, `order`

## Endpoints Propuestos (modelos ya creados, faltan serializers/viewsets/urls)
- Variantes de producto:
  - `GET /api/product-variants/?product={id}`
  - `POST /api/product-variants/`
  - `GET/PATCH/DELETE /api/product-variants/{id}/`
- Especificaciones de producto:
  - `GET /api/product-specs/?product={id}`
  - `POST /api/product-specs/`
  - `GET/PATCH/DELETE /api/product-specs/{id}/`
- Imágenes de producto:
  - `GET /api/product-images/?product={id}` y `?variant={id}`
  - `POST /api/product-images/`
  - `GET/PATCH/DELETE /api/product-images/{id}/`
- Historial de pedido:
  - `GET /api/orders/{order_id}/status-history/`
  - `POST /api/orders/{order_id}/status-history/`
- Tickets de soporte:
  - `GET /api/support-tickets/?status=open&order={id}`
  - `POST /api/support-tickets/`
  - `GET/PATCH /api/support-tickets/{id}/`

## Flujo de Carrito
- Crear carrito: `POST /api/orders/` con `status=pending`
- Agregar productos: `POST /api/order-items/` con `{ order, product, quantity, unit_price }`
- Ver carrito: `GET /api/orders/{id}/` o `GET /api/order-items/?order={id}`
- Checkout: actualizar `Order` y añadir `Invoice`, `Payment`, `Shipment` (si se exponen)

## Ejemplos cURL
- Obtener token:
  - `curl -X POST http://localhost:8000/api/token/ -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"pass\"}"`
- Listar productos:
  - `curl http://localhost:8000/api/products/`
- Crear pedido y agregar ítem:
  - `curl -X POST http://localhost:8000/api/orders/ -H "Authorization: Bearer <access>" -H "Content-Type: application/json" -d "{\"status\":\"pending\"}"`
  - `curl -X POST http://localhost:8000/api/order-items/ -H "Authorization: Bearer <access>" -H "Content-Type: application/json" -d "{\"order\":1,\"product\":10,\"quantity\":2,\"unit_price\":\"199.99\"}"`

## Permisos y Seguridad
- Productos, variantes, imágenes:
  - Lectura pública (si se desea), escritura limitada a staff/admin.
- Pedidos y carrito:
  - Propiedad por usuario; validaciones para evitar acceso/edición de pedidos ajenos.
- Historial de pedido:
  - Crear registros al modificar `Order.status` (controlado en vistas/servicios).
- Tickets de soporte:
  - Usuarios ven sus tickets; staff/soporte gestiona todos.

## Notas Operativas
- `CORS_ALLOW_ALL_ORIGINS = True` está habilitado en dev; restringir en producción.
- `docker-compose.yml` no está configurado para backend Python; si se desea Docker, preparar servicios `web` (Django) y `db` (Postgres).
- Registrar en Admin los nuevos modelos facilita gestión manual:
  - `products/admin.py`: `ProductVariant`, `ProductSpec`, `ProductImage`
  - `orders/admin.py`: `OrderStatusHistory`
  - `system/admin.py`: `SupportTicket`

## Checklist para Nuevos Integrantes
- Configurar `backend-python/.env` con credenciales reales de Postgres.
- `pip install -r requirements.txt`
- `python manage.py migrate`
- `python manage.py createsuperuser`
- `python manage.py runserver`
- Probar JWT con `POST /api/token/` y luego `GET /api/products/` con `Authorization: Bearer ...`
- Agregar `path('api/', include('orders.urls')),` en `core/urls.py` para habilitar carrito/pedidos.