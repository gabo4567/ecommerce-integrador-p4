from django.http import HttpResponse

def index(request):
    return HttpResponse(
        """
        <!doctype html>
        <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>E-commerce P4</title>
          <style>
            :root { --bg: #0f172a; --card: #111827; --text: #e5e7eb; --muted: #94a3b8; --accent: #4f46e5; }
            @media (prefers-color-scheme: light) {
              :root { --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --muted: #475569; --accent: #2563eb; }
            }
            * { box-sizing: border-box; }
            body { margin: 0; background: linear-gradient(135deg, var(--bg), #111827 50%, var(--bg)); color: var(--text); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
            .container { max-width: 960px; margin: 0 auto; padding: 2.5rem 1.25rem; }
            header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
            .brand { display: flex; align-items: center; gap: .75rem; }
            .logo { width: 40px; height: 40px; border-radius: 12px; background: radial-gradient(circle at 30% 30%, #60a5fa, #8b5cf6); box-shadow: 0 10px 20px rgba(99,102,241,.35); }
            h1 { font-size: 1.5rem; margin: 0; }
            .subtitle { color: var(--muted); margin-top: .25rem; font-size: .95rem; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
            .card { background: var(--card); border: 1px solid rgba(148,163,184,.25); border-radius: 12px; padding: 1rem; box-shadow: 0 8px 24px rgba(0,0,0,.2); }
            .card h3 { margin: 0 0 .25rem; font-size: 1rem; }
            .card p { margin: 0 0 .75rem; color: var(--muted); font-size: .9rem; }
            a { color: var(--accent); text-decoration: none; font-weight: 600; }
            a:hover { text-decoration: underline; }
            .footer { margin-top: 2rem; color: var(--muted); font-size: .85rem; }
            .badge { display: inline-block; padding: .2rem .5rem; border: 1px solid rgba(148,163,184,.35); border-radius: 999px; font-size: .8rem; color: var(--muted); }
          </style>
        </head>
        <body>
          <div class="container">
            <header>
              <div class="brand">
                <div class="logo"></div>
                <div>
                  <h1>E-commerce P4</h1>
                  <div class="subtitle">Backend Django + DRF operativo</div>
                </div>
              </div>
              <div class="badge">DEBUG</div>
            </header>

            <div class="grid" style="margin-bottom:1rem">
              <div class="card">
                <h3>Administrador</h3>
                <p>Gestión completa de productos, pedidos, envíos, usuarios</p>
                <a href="/admin/">/admin/</a>
              </div>
              <div class="card">
                <h3>Autenticación JWT</h3>
                <p>Obtén tokens y refresca sesiones</p>
                <a href="/api/token/">/api/token/</a> · <a href="/api/token/refresh/">/api/token/refresh/</a>
              </div>
              <div class="card">
                <h3>Catálogo</h3>
                <p>Productos, categorías, variantes, especificaciones e imágenes</p>
                <a href="/api/products/">/api/products/</a> · <a href="/api/categories/">/api/categories/</a>
              </div>
              <div class="card">
                <h3>Carrito y pedidos</h3>
                <p>Gestión de órdenes e ítems, total dinámico</p>
                <a href="/api/orders/">/api/orders/</a> · <a href="/api/order-items/">/api/order-items/</a>
              </div>
              <div class="card">
                <h3>Envíos y estados</h3>
                <p>Control de envíos y trazabilidad de estado</p>
                <a href="/api/shipments/">/api/shipments/</a> · <a href="/api/order-status-history/">/api/order-status-history/</a>
              </div>
              <div class="card">
                <h3>Soporte</h3>
                <p>Tickets de soporte y conversación por ticket</p>
                <a href="/api/support-tickets/">/api/support-tickets/</a>
              </div>
              <div class="card">
                <h3>Auditoría</h3>
                <p>Registro de cambios críticos (solo staff)</p>
                <a href="/api/audit/">/api/audit/</a>
              </div>
              <div class="card">
                <h3>Configuraciones</h3>
                <p>Ver y actualizar settings globales</p>
                <a href="/api/settings/">/api/settings/</a>
              </div>
            </div>

            <div class="footer">Consulta los endpoints desde estas tarjetas o inicia sesión en el panel de administrador.</div>
          </div>
        </body>
        </html>
        """,
        content_type="text/html",
    )

def demo(request):
    return HttpResponse(
        """
        <!doctype html>
        <html lang=\"es\">
        <head>
          <meta charset=\"utf-8\" />
          <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
          <title>Demo – E-commerce P4</title>
          <style>
            :root { --bg: #0f172a; --card: #111827; --text: #e5e7eb; --muted: #94a3b8; --accent: #4f46e5; }
            @media (prefers-color-scheme: light) { :root { --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --muted: #475569; --accent: #2563eb; } }
            body { margin: 0; background: var(--bg); color: var(--text); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
            .container { max-width: 980px; margin: 0 auto; padding: 2rem 1rem; }
            h1 { margin: 0 0 1rem; font-size: 1.5rem; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
            .card { background: var(--card); border: 1px solid rgba(148,163,184,.25); border-radius: 12px; padding: 1rem; }
            .card h2 { margin: 0 0 .5rem; font-size: 1.1rem; }
            label { display: block; margin: .5rem 0 .25rem; font-size: .9rem; color: var(--muted); }
            input, select { width: 100%; padding: .5rem; border-radius: 8px; border: 1px solid rgba(148,163,184,.35); background: transparent; color: var(--text); }
            button { margin-top: .75rem; padding: .5rem .75rem; border-radius: 8px; border: 1px solid rgba(148,163,184,.35); background: var(--accent); color: white; cursor: pointer; }
            button.secondary { background: transparent; color: var(--accent); border-color: var(--accent); }
            pre { background: rgba(148,163,184,.12); padding: .75rem; border-radius: 8px; overflow: auto; font-size: .85rem; }
            .row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
            a { color: var(--accent); text-decoration: none; }
          </style>
        </head>
        <body>
          <div class=\"container\">
            <h1>Demo – E-commerce P4</h1>
            <div class=\"grid\">
              <div class=\"card\">
                <h2>Login (JWT)</h2>
                <label>Usuario</label>
                <input id=\"u\" value=\"admin\" />
                <label>Contraseña</label>
                <input id=\"p\" type=\"password\" value=\"Admin123!\" />
                <button id=\"btnLogin\">Obtener token</button>
                <pre id=\"outLogin\"></pre>
              </div>

              <div class=\"card\">
                <h2>Productos</h2>
                <button id=\"btnListProducts\">Listar productos</button>
                <pre id=\"outProducts\"></pre>
              </div>

              <div class=\"card\">
                <h2>Pedido</h2>
                <div class=\"row\">
                  <div>
                    <label>ID Pedido</label>
                    <input id=\"orderId\" />
                  </div>
                  <div>
                    <label>Estado</label>
                    <select id=\"orderStatus\"><option>pending</option><option>paid</option><option>shipped</option><option>delivered</option></select>
                  </div>
                </div>
                <button id=\"btnCreateOrder\">Crear pedido pending</button>
                <button class=\"secondary\" id=\"btnUpdateOrder\">Actualizar estado</button>
                <pre id=\"outOrder\"></pre>
              </div>

              <div class=\"card\">
                <h2>Carrito (OrderItems)</h2>
                <div class=\"row\">
                  <div>
                    <label>Producto ID</label>
                    <input id=\"productId\" />
                  </div>
                  <div>
                    <label>Cantidad</label>
                    <input id=\"qty\" value=\"1\" />
                  </div>
                </div>
                <label>Precio unitario</label>
                <input id=\"unitPrice\" value=\"100\" />
                <button id=\"btnAddItem\">Agregar al pedido</button>
                <button class=\"secondary\" id=\"btnListItems\">Ver ítems del pedido</button>
                <pre id=\"outItems\"></pre>
              </div>

              <div class=\"card\">
                <h2>Envíos</h2>
                <button id=\"btnListShipments\">Ver envíos del usuario</button>
                <pre id=\"outShipments\"></pre>
              </div>

              <div class=\"card\">
                <h2>Soporte</h2>
                <label>Asunto</label>
                <input id=\"ticketSubject\" value=\"Consulta\" />
                <label>Mensaje</label>
                <input id=\"ticketMessage\" value=\"Necesito ayuda\" />
                <button id=\"btnCreateTicket\">Abrir ticket</button>
                <button class=\"secondary\" id=\"btnListTickets\">Mis tickets</button>
                <pre id=\"outTickets\"></pre>
              </div>

              <div class=\"card\">
                <h2>Settings</h2>
                <button id=\"btnListSettings\">Ver settings</button>
                <div class=\"row\" style=\"margin-top:.5rem\">
                  <div>
                    <label>Key</label>
                    <input id=\"settingKey\" value=\"impuesto_iva\" />
                  </div>
                  <div>
                    <label>Value</label>
                    <input id=\"settingValue\" value=\"21\" />
                  </div>
                </div>
                <button class=\"secondary\" id=\"btnUpdateSetting\">Actualizar setting (staff)</button>
                <pre id=\"outSettings\"></pre>
              </div>

              <div class=\"card\">
                <h2>Auditoría (staff)</h2>
                <button id=\"btnListAudit\">Ver auditoría</button>
                <pre id=\"outAudit\"></pre>
              </div>
            </div>

            <p style=\"margin-top:1rem\">Token guardado en memoria de la página; usa <a href=\"/api/token/\">/api/token/</a> para credenciales propias.</p>
          </div>

          <script>
            const out = id => document.getElementById(id);
            let token = null;
            const auth = () => token ? { Authorization: `Bearer ${token}` } : {};
            const j = r => r.json();

            document.getElementById('btnLogin').onclick = () => {
              const username = document.getElementById('u').value;
              const password = document.getElementById('p').value;
              fetch('/api/token/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
                .then(j)
                .then(d => { token = d.access; out('outLogin').textContent = JSON.stringify(d, null, 2); });
            };

            document.getElementById('btnListProducts').onclick = () => {
              fetch('/api/products/', { headers: auth() }).then(j).then(d => out('outProducts').textContent = JSON.stringify(d, null, 2));
            };

            document.getElementById('btnCreateOrder').onclick = () => {
              fetch('/api/orders/', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ status: 'pending' }) })
                .then(j)
                .then(d => { document.getElementById('orderId').value = d.id; out('outOrder').textContent = JSON.stringify(d, null, 2); });
            };

            document.getElementById('btnUpdateOrder').onclick = () => {
              const id = document.getElementById('orderId').value; const status = document.getElementById('orderStatus').value;
              fetch(`/api/orders/${id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ status }) })
                .then(j).then(d => out('outOrder').textContent = JSON.stringify(d, null, 2));
            };

            document.getElementById('btnAddItem').onclick = () => {
              const order = parseInt(document.getElementById('orderId').value, 10);
              const product = parseInt(document.getElementById('productId').value, 10);
              const quantity = parseInt(document.getElementById('qty').value, 10);
              const unit_price = document.getElementById('unitPrice').value;
              fetch('/api/order-items/', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ order, product, quantity, unit_price }) })
                .then(j).then(d => out('outItems').textContent = JSON.stringify(d, null, 2));
            };

            document.getElementById('btnListItems').onclick = () => {
              const order = document.getElementById('orderId').value;
              fetch(`/api/order-items/?order=${order}`, { headers: auth() }).then(j).then(d => out('outItems').textContent = JSON.stringify(d, null, 2));
            };

            document.getElementById('btnListShipments').onclick = () => {
              fetch('/api/shipments/', { headers: auth() }).then(j).then(d => out('outShipments').textContent = JSON.stringify(d, null, 2));
            };

            document.getElementById('btnCreateTicket').onclick = () => {
              const subject = document.getElementById('ticketSubject').value; const message = document.getElementById('ticketMessage').value;
              fetch('/api/support-tickets/', { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ subject, message }) })
                .then(j).then(d => out('outTickets').textContent = JSON.stringify(d, null, 2));
            };

            document.getElementById('btnListTickets').onclick = () => {
              fetch('/api/support-tickets/', { headers: auth() }).then(j).then(d => out('outTickets').textContent = JSON.stringify(d, null, 2));
            };

            document.getElementById('btnListSettings').onclick = () => {
              fetch('/api/settings/').then(j).then(d => out('outSettings').textContent = JSON.stringify(d, null, 2));
            };

            document.getElementById('btnUpdateSetting').onclick = () => {
              const key = document.getElementById('settingKey').value; const value = document.getElementById('settingValue').value;
              fetch(`/api/settings/${key}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ value }) })
                .then(j).then(d => out('outSettings').textContent = JSON.stringify(d, null, 2));
            };

            document.getElementById('btnListAudit').onclick = () => {
              fetch('/api/audit/', { headers: auth() }).then(r => r.status === 200 ? r.json() : Promise.resolve({ status: r.status })).then(d => out('outAudit').textContent = JSON.stringify(d, null, 2));
            };
          </script>
        </body>
        </html>
        """,
        content_type="text/html",
    )

