import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";
import { Link } from "react-router-dom";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try { setLoading(true); setError(null); const data = await api.get("users/"); setUsers(Array.isArray(data) ? data : []); }
    catch (e) { setError(e?.message || "Error cargando usuarios"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <h2 className="text-2xl font-semibold mb-4">Usuarios (Admin)</h2>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-3">
        {users.map(u => (
          <div key={u.id} className="p-4 bg-white border rounded flex items-center justify-between">
            <div>
              <p className="font-medium">#{u.id} • {u.username ?? u.email ?? "Usuario"}</p>
              <p className="text-sm text-gray-600">Email: {u.email ?? "-"}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/admin/usuario/${u.id}`} className="px-3 py-2 bg-gray-200 rounded">Ver</Link>
            </div>
          </div>
        ))}
        {(users.length === 0 && !loading && !error) && <p>No hay usuarios.</p>}
      </div>
    </Layout>
  );
}

