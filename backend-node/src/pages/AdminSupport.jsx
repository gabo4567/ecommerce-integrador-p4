import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fUser, setFUser] = useState("");
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo, setFDateTo] = useState("");
  const [fPriority, setFPriority] = useState("");

  async function loadTickets() {
    try { setLoading(true); setError(null); const data = await api.get("support-tickets/"); setTickets(data || []); }
    catch (e) { setError(e?.message || "Error cargando tickets"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadTickets(); }, []);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (fStatus && t.status !== fStatus) return false;
      if (fPriority && t.priority !== fPriority) return false;
      if (fUser && String(t.user) !== fUser) return false;
      if (fDateFrom && new Date(t.created_at) < new Date(fDateFrom)) return false;
      if (fDateTo && new Date(t.created_at) > new Date(fDateTo)) return false;
      return true;
    });
  }, [tickets, fStatus, fPriority, fUser, fDateFrom, fDateTo]);

  async function openTicket(t) {
    setActive(t);
    try { const ms = await api.get(`support-tickets/${t.id}/messages/`); setMessages(ms || []); } catch {}
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!active || !reply.trim()) return;
    try { const m = await api.post(`support-tickets/${active.id}/messages/`, { message: reply }); setMessages([...messages, m]); setReply(""); } catch {}
  }

  async function changeStatus(st) {
    if (!active) return;
    try { const updated = await api.patch(`support-tickets/${active.id}/`, { status: st }); setActive(updated); setTickets(prev => prev.map(x => x.id === updated.id ? updated : x)); } catch {}
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-8">
        <div className="xl:col-span-3 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Tickets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="w-full border px-2 py-2 rounded"><option value="">Estado: todos</option><option value="open">Abierto</option><option value="in_progress">En progreso</option><option value="closed">Cerrado</option></select>
            <select value={fPriority} onChange={e=>setFPriority(e.target.value)} className="w-full border px-2 py-2 rounded"><option value="">Prioridad: todas</option><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option></select>
            <input value={fUser} onChange={e=>setFUser(e.target.value)} placeholder="Usuario ID" className="w-full border px-2 py-2 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha Inicio</label>
              <input type="date" value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)} className="border px-2 py-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha Fin</label>
              <input type="date" value={fDateTo} onChange={e=>setFDateTo(e.target.value)} className="border px-2 py-2 rounded w-full" />
            </div>
          </div>
          {loading && <p>Cargando...</p>}
          {error && <p className="text-red-600">{error}</p>}
          <ul className="space-y-2 max-h-[60vh] overflow-auto">
            {filtered.map(t => (
              <li key={t.id} className="border rounded p-3 cursor-pointer" onClick={()=>openTicket(t)}>
                <div className="font-medium">#{t.id} • {t.subject}</div>
                <div className="text-sm text-gray-600">Estado: {t.status} • Prioridad: {t.priority}</div>
                <div className="text-xs text-gray-500">Usuario: {t.user} • {new Date(t.created_at).toLocaleString()}</div>
              </li>
            ))}
            {filtered.length === 0 && !loading && <li className="text-gray-600">Sin tickets</li>}
          </ul>
        </div>
        <div className="xl:col-span-3 bg-white p-6 rounded shadow">
          {active ? (
            <div className="grid gap-4">
              <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Ticket #{active.id}</h2><div className="flex gap-2"><select value={active.status} onChange={e=>changeStatus(e.target.value)} className="border px-2 py-2 rounded"><option value="open">Abierto</option><option value="in_progress">En progreso</option><option value="closed">Cerrado</option></select></div></div>
              <div className="text-sm text-gray-600">Usuario: {active.user} • Pedido: {active.order ?? '-'} • Producto: {active.product ?? '-'}</div>
              <div className="space-y-2 max-h-[50vh] overflow-auto">{messages.map(m => (<div key={m.id} className="border rounded p-3"><div className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()} • Usuario {m.user}</div><div>{m.message}</div></div>))}{messages.length === 0 && <div className="text-gray-600">Sin mensajes</div>}</div>
              <form onSubmit={sendMessage} className="flex gap-2"><input value={reply} onChange={e=>setReply(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="Escribir respuesta" /><button className="px-4 py-2 bg-blue-600 text-white rounded">Enviar</button></form>
            </div>
          ) : (<div className="text-gray-600">Selecciona un ticket para ver el chat</div>)}
        </div>
      </div>
    </Layout>
  );
}

