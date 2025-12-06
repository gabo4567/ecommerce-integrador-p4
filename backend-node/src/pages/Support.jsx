import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { statusLabel } from "../lib/utils";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useLocation } from "react-router-dom";
import { functionsApi } from "../api/functions";

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [lastMsg, setLastMsg] = useState({});
  const access = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      if (!access) return;
      try {
        const t = await api.get("support-tickets/");
        setTickets(t);
        const os = await api.get("orders/");
        setOrders(os);
        const entries = await Promise.all(t.map(async (tk) => {
          try { const ms = await api.get(`support-tickets/${tk.id}/messages/`); return [tk.id, ms[ms.length-1]]; } catch { return [tk.id, null]; }
        }));
        setLastMsg(Object.fromEntries(entries));
      } catch {}
    };
    run();
  }, [access]);

  useEffect(() => {
    const s = location.state || {};
    if (typeof s.subject === 'string') setSubject(s.subject);
    if (typeof s.message === 'string') setMessage(s.message);
    if (typeof s.orderId === 'number') setOrderId(s.orderId);
  }, [location.state]);

  const createTicket = async (e) => {
    e.preventDefault();
    if (!subject || !message) return;
    try { const payload = { subject, message }; if (orderId) payload.order = orderId; const t = await api.post("support-tickets/", payload); setTickets([t, ...tickets]); setSubject(""); setMessage(""); setOrderId(null); try { await functionsApi.post("supportTicketNotifier", { ticketId: t.id, type: "new_ticket" }); } catch {} } catch {}
  };

  const loadMessages = async (ticket) => { setActiveTicket(ticket); try { const ms = await api.get(`support-tickets/${ticket.id}/messages/`); setMessages(ms); } catch {} };
  const sendReply = async (e) => { e.preventDefault(); if (!activeTicket) return; try { const m = await api.post(`support-tickets/${activeTicket.id}/messages/`, { message: reply }); setMessages([...messages, m]); setReply(""); try { await functionsApi.post("supportTicketNotifier", { ticketId: activeTicket.id, type: "new_message" }); } catch {} } catch {} };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1"><form onSubmit={createTicket} className="bg-white rounded-lg p-6 shadow space-y-3"><h2 className="text-xl font-semibold">Nuevo ticket</h2><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" className="w-full px-3 py-2 border border-gray-300 rounded" /><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensaje" className="w-full px-3 py-2 border border-gray-300 rounded" rows={4} /><select value={orderId ?? ''} onChange={(e)=>setOrderId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded"><option value="">Pedido asociado (opcional)</option>{orders.map((o)=> (<option key={o.id} value={o.id}>#{o.id} • {statusLabel(o.status)} • ${o.total}</option>))}</select><button className="w-full bg-blue-600 text-white py-2 rounded">Enviar</button></form><div className="mt-6 bg-white rounded-lg p-6 shadow"><h2 className="text-xl font-semibold mb-4">Mis tickets</h2><ul className="space-y-2">{tickets.map((t) => (<li key={t.id} className="border border-gray-200 rounded p-3 cursor-pointer" onClick={() => loadMessages(t)}><div className="font-medium">{t.subject}</div><div className="text-sm text-gray-600">{t.status} • {new Date(t.created_at).toLocaleString()}</div><div className="text-xs text-gray-500 truncate">Última respuesta: {lastMsg[t.id]?.message ?? '—'}</div></li>))}</ul></div></div>
        <div className="lg:col-span-2">{activeTicket ? (<div className="bg-white rounded-lg p-6 shadow"><h2 className="text-xl font-semibold mb-4">Ticket #{activeTicket.id}</h2><div className="space-y-3 mb-6">{messages.map((m) => (<div key={m.id} className="border border-gray-200 rounded p-3"><div className="text-sm text-gray-600">{new Date(m.created_at).toLocaleString()}</div><div>{m.message}</div></div>))}</div><form onSubmit={sendReply} className="flex gap-2"><input value={reply} onChange={(e) => setReply(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded" placeholder="Escribe un mensaje" /><button className="bg-blue-600 text-white px-4 py-2 rounded">Enviar</button></form></div>) : (<div className="text-gray-600">Selecciona un ticket para ver mensajes</div>)}</div>
      </div>
    </Layout>
  );
};

export default Support;

