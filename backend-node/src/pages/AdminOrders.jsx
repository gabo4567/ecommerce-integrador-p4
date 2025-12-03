import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";
import { formatMoney, statusLabel } from "../lib/utils";
import { Link } from "react-router-dom";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true); setError(null);
      const data = await api.get("orders/");
      setOrders(Array.isArray(data) ? data : []);
      try { const us = await api.get("users/"); setUsers(Array.isArray(us) ? us : []); } catch {}
    }
    catch (e) { setError(e?.message || "Error cargando órdenes"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Órdenes (Admin)</h2>
      </div>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-3">
        {orders.map(o => (
          <div key={o.id} className="p-4 bg-white border rounded flex items-center justify-between">
            <div>
              <p className="font-medium">Orden #{o.id}</p>
              <p className="text-sm text-gray-600">Estado: {statusLabel(o.status)} • Usuario: {(() => { const u = users.find(x => x.id === o.user); return u ? (u.first_name || u.email || u.username) : o.user; })()}</p>
              <p className="text-sm text-gray-600">Total: ${formatMoney(Number(o.total || 0))}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/admin/orden/${o.id}`} className="px-3 py-2 bg-gray-200 rounded">Ver detalles</Link>
            </div>
          </div>
        ))}
        {(orders.length === 0 && !loading && !error) && <p>No hay órdenes.</p>}
      </div>
    </Layout>
  );
}

