import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { adminApi, Product } from "@/api/admin";
import { Link } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try { setLoading(true); setError(null); const data = await adminApi.listProducts(); setItems(data || []); }
    catch (e: any) { setError(e?.message || "Error cargando productos"); }
    finally { setLoading(false); }
  }

  const [toDelete, setToDelete] = useState<Product | null>(null);
  async function confirmDelete() {
    if (!toDelete) return;
    try { await adminApi.deleteProduct(toDelete.id); setToDelete(null); await load(); } catch (e: any) { alert(e?.message || "Error eliminando"); }
  }

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Productos (Admin)</h2>
        <div className="flex items-center gap-3">
          <Link to="/admin/producto/nuevo" className="px-4 py-2 bg-blue-600 text-white rounded">Nuevo producto</Link>
        </div>
      </div>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-3">
        {items.map(p => (
          <div key={p.id} className="p-4 bg-white border rounded flex items-center justify-between">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-600">Precio: ${p.price} • Stock: {p.stock}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/admin/producto/${p.id}`} className="px-3 py-2 bg-gray-200 rounded">Editar</Link>
              <button onClick={() => setToDelete(p)} className="px-3 py-2 bg-red-600 text-white rounded">Eliminar</button>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && <p>No hay productos.</p>}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        title="¿Eliminar producto?"
        message={toDelete ? `Vas a eliminar "${toDelete.name}". Esta acción no se puede deshacer.` : ''}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Layout>
  );
}
