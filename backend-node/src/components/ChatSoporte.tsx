import React, { useState, useEffect } from "react";
import { api } from "../api/client";

interface ChatSoporteProps {
  orderId?: number;
  onClose: () => void;
}

const ChatSoporte: React.FC<ChatSoporteProps> = ({ orderId, onClose }) => {
  const [ticket, setTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrCreateTicket = async () => {
      setLoading(true);
      try {
        let t = null;
        if (orderId) {
          const tickets = await api.get<any[]>("support-tickets/?order=" + orderId);
          t = tickets.length ? tickets[0] : null;
        }
        if (!t) {
          t = await api.post<any>("support-tickets/", {
            subject: "Consulta sobre pedido " + orderId,
            order: orderId,
            message: "Inicio de chat de soporte."
          });
        }
        setTicket(t);
        const ms = await api.get<any[]>(`support-tickets/${t.id}/messages/`);
        setMessages(ms);
      } catch {}
      setLoading(false);
    };
    fetchOrCreateTicket();
  }, [orderId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ticket) return;
    try {
      const m = await api.post<any>(`support-tickets/${ticket.id}/messages/`, { message: input });
      setMessages([...messages, m]);
      setInput("");
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500">✕</button>
        <h2 className="text-xl font-semibold mb-4">Chat con Soporte</h2>
        <div className="h-64 overflow-y-auto border rounded mb-4 p-2 bg-gray-50">
          {loading ? <div>Cargando...</div> : messages.map((m: any) => {
            // Suponemos que el mensaje del usuario tiene m.user igual al ticket.user
            const isUser = ticket && m.user === ticket.user;
            return (
              <div key={m.id} className={`mb-2 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div>
                  <div className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</div>
                  <div className={`p-2 rounded max-w-xs ${isUser ? 'bg-blue-100 text-gray-800' : 'bg-green-100 text-green-900 font-semibold'}`}>{m.message}</div>
                  <div className="text-xs text-right text-gray-400">{isUser ? 'Tú' : 'Soporte'}</div>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 px-3 py-2 border rounded" placeholder="Escribe tu mensaje..." />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Enviar</button>
        </form>
      </div>
    </div>
  );
};

export default ChatSoporte;
