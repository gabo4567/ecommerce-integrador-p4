import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api/client";
import { formatMoney, statusLabel } from "../lib/utils";

export default function AdminOrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true); setError(null);
      const orders = await api.get("orders/");
      const found = Array.isArray(orders) ? orders.find(o => String(o.id) === String(id)) : null;
      setOrder(found || null);
      const its = await api.get(`order-items/?order=${id}`);
      setItems(Array.isArray(its) ? its : []);
      try { const us = await api.get("users/"); const u = Array.isArray(us) && found ? us.find(x => x.id === found.user) : null; setUser(u || null); } catch {}
      try { const prods = await api.get("products/"); setProducts(Array.isArray(prods) ? prods : []); } catch {}
    } catch (e) {
      setError(e?.message || "Error cargando la orden");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  return (
    <Layout>
      <h2 className="text-2xl font-semibold mb-4">Orden #{id}</h2>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {order && (
        <div className="p-4 bg-white border rounded mb-4">
          <p className="font-medium">Estado: {statusLabel(order.status)}</p>
          <p className="text-sm text-gray-600">Usuario: {user ? (user.first_name || user.email || user.username) : order.user}</p>
          <p className="text-sm text-gray-600">Total: ${formatMoney(Number(order.total || 0))}</p>
        </div>
      )}
      <div className="grid gap-3">
        {items.map(it => (
          <div key={it.id} className="p-4 bg-white border rounded flex items-center justify-between">
            <div>
              <p className="font-medium">Ítem #{it.id}</p>
              <p className="text-sm text-gray-600">Producto: {(() => { const p = products.find(x => x.id === it.product); return p ? p.name : it.product; })()} • Cantidad: {it.quantity} • Precio: ${formatMoney(Number(it.unit_price||0))}</p>
            </div>
          </div>
        ))}
        {(items.length === 0 && !loading && !error) && <p>No hay ítems.</p>}
      </div>
    </Layout>
  );
}

