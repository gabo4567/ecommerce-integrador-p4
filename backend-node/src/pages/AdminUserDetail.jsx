import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api/client";

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true); setError(null);
      const users = await api.get("users/");
      const u = Array.isArray(users) ? users.find(x => String(x.id) === String(id)) : null;
      setUser(u || null);
      const allOrders = await api.get("orders/");
      const list = Array.isArray(allOrders) ? allOrders.filter(o => String(o.user) === String(id)) : [];
      setOrders(list);
    } catch (e) { setError(e?.message || "Error cargando usuario"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  return (
    <Layout>
      <h2 className="text-2xl font-semibold mb-4">Usuario #{id}</h2>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {user && (
        <div className="p-4 bg-white border rounded mb-4">
          <p className="font-medium">{user.username ?? user.email ?? "Usuario"}</p>
          <p className="text-sm text-gray-600">Email: {user.email ?? "-"}</p>
        </div>
      )}
      <div>
        <h3 className="text-xl font-semibold mb-2">Órdenes</h3>
        <div className="grid gap-3">
          {orders.map(o => (
            <div key={o.id} className="p-4 bg-white border rounded">
              <p className="font-medium">Orden #{o.id} • Estado: {o.status}</p>
            </div>
          ))}
          {(orders.length === 0 && !loading && !error) && <p>Sin órdenes.</p>}
        </div>
      </div>
    </Layout>
  );
}

