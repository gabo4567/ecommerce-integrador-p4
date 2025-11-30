import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { adminApi } from "../api/admin";
import ConfirmDialog from "../components/ConfirmDialog";

const statuses = [ { value: "preparing", label: "Preparando" }, { value: "shipped", label: "Enviado" }, { value: "delivered", label: "Entregado" }, { value: "cancelled", label: "Cancelado" } ];

export default function AdminShipments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try { setLoading(true); setError(null); const data = await adminApi.listShipments(); setItems(data || []); }
    catch (e) { setError(e?.message || "Error cargando envíos"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const [pendingChange, setPendingChange] = useState(null);
  async function confirmStatusChange() {
    if (!pendingChange) return;
    try { const upd = await adminApi.updateShipment(pendingChange.item.id, { status: pendingChange.status }); setItems(prev => prev.map(x => x.id === pendingChange.item.id ? upd : x)); setPendingChange(null); }
    catch (e) { alert(e?.message || "Error actualizando estado"); }
  }

  return (
    <Layout>
      <h2 className="text-2xl font-semibold mb-4">Envíos (Admin)</h2>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-3">
        {items.map(s => (
          <div key={s.id} className="p-4 bg-white border rounded">
            <div className="flex items_center justify_between"><div><p className="font-medium">Shipment #{s.id} • Pedido #{s.order}</p><p className="text-sm text-gray-600">{s.carrier} • {s.tracking_number ?? 'sin tracking'}</p><p className="text-sm">{s.address}</p></div><div className="flex items_center gap-2"><span className="text-sm">Estado:</span><select className="border rounded px-2 py-1" value={s.status} onChange={e => setPendingChange({ item: s, status: e.target.value })}>{statuses.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}</select></div></div>
          </div>
        ))}
        {items.length === 0 && !loading && <p>No hay envíos.</p>}
      </div>
      <ConfirmDialog open={!!pendingChange} title="¿Cambiar estado del envío?" message={pendingChange ? `Se cambiará el estado a "${(statuses.find(x=>x.value===pendingChange.status)?.label) || pendingChange.status}".` : ''} confirmText="Sí, cambiar" cancelText="Cancelar" onConfirm={confirmStatusChange} onClose={() => setPendingChange(null)} />
    </Layout>
  );
}

