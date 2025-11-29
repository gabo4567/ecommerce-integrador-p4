import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { adminApi, Shipment } from "@/api/admin";
import ConfirmDialog from "@/components/ConfirmDialog";

const statuses = ["preparing", "shipped", "delivered", "cancelled"];
function shipmentStatusText(s: string): string {
  switch (s) {
    case "preparing": return "preparando";
    case "shipped": return "enviado";
    case "delivered": return "entregado";
    case "cancelled": return "cancelado";
    default: return s;
  }
}
function badgeClass(s: string) {
  switch (s) {
    case "preparing": return "bg-yellow-100 text-yellow-800";
    case "shipped": return "bg-blue-100 text-blue-800";
    case "delivered": return "bg-emerald-100 text-emerald-800";
    case "cancelled": return "bg-red-100 text-red-800";
    default: return "bg-gray-200 text-gray-700";
  }
}

export default function AdminShipments() {
  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fStatus, setFStatus] = useState<string>("");
  const [fCarrier, setFCarrier] = useState<string>("");

  async function load() {
    try { setLoading(true); setError(null); const data = await adminApi.listShipments(); setItems(data || []); }
    catch (e: any) { setError(e?.message || "Error cargando envíos"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const [pendingChange, setPendingChange] = useState<{ item: Shipment, status: string } | null>(null);
  async function confirmStatusChange() {
    if (!pendingChange) return;
    try {
      const upd = await adminApi.updateShipment(pendingChange.item.id, { status: pendingChange.status });
      setItems(prev => prev.map(x => x.id === pendingChange.item.id ? upd : x));
      setPendingChange(null);
    } catch (e: any) { alert(e?.message || "Error actualizando estado"); }
  }

  const filtered = items.filter(s => {
    if (fStatus && s.status !== fStatus) return false;
    if (fCarrier && !String(s.carrier || '').toLowerCase().includes(fCarrier.toLowerCase())) return false;
    return true;
  });

  return (
    <Layout>
      <h2 className="text-2xl font-semibold mb-4">Envíos</h2>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="border rounded px-2 py-2 normal-case" style={{ textTransform: 'none' }}>
          <option value="">Estado: todos</option>
          {statuses.map(st => <option key={st} value={st} className="normal-case" style={{ textTransform: 'none' }}>{shipmentStatusText(st)}</option>)}
        </select>
        <input value={fCarrier} onChange={e=>setFCarrier(e.target.value)} className="border rounded px-2 py-2 md:col-span-2" placeholder="Transportador" />
      </div>
      <div className="grid gap-3">
        {filtered.map(s => (
          <div key={s.id} className="p-4 bg-white border rounded">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">Envío {s.id} • Pedido {s.order}</p>
                <p className="text-sm text-gray-600">{s.carrier || '—'} • {s.tracking_number || 'sin seguimiento'}</p>
                <p className="text-sm">{s.address || '—'}</p>
                <div className="mt-2">
                  <Link to={`/admin/orden/${s.order}`} className="text-blue-600 hover:text-blue-800 text-sm">Ver pedido</Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-0.5 rounded text-xs ${badgeClass(s.status)}`}>{shipmentStatusText(s.status)}</div>
                <span className="text-sm">Estado:</span>
                <select className="border rounded px-2 py-1 normal-case" style={{ textTransform: 'none' }} value={s.status} onChange={e => setPendingChange({ item: s, status: e.target.value })}>
                  {statuses.map(st => <option key={st} value={st} className="normal-case" style={{ textTransform: 'none' }}>{shipmentStatusText(st)}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p>No hay envíos.</p>}
      </div>
      <ConfirmDialog
        open={!!pendingChange}
        title="¿Cambiar estado del envío?"
        message={pendingChange ? `Se cambiará el estado a "${shipmentStatusText(pendingChange.status)}".` : ''}
        confirmText="Sí, cambiar"
        cancelText="Cancelar"
        onConfirm={confirmStatusChange}
        onClose={() => setPendingChange(null)}
      />
    </Layout>
  );
}
