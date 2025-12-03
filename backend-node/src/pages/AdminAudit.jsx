import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";

const AdminAudit = () => {
  const [audits, setAudits] = useState([]);
  const [error, setError] = useState(null);
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const data = await api.get("audit/");
        setAudits(Array.isArray(data) ? data : []);
        setError(null);
      } catch {
        setError("Acceso restringido a administradores");
      }
    };
    run();
  }, []);

  const filtered = audits.filter((a) => {
    const okAction = !action || String(a.action || '').toLowerCase().includes(action.toLowerCase()) || String(a.details || '').toLowerCase().includes(action.toLowerCase());
    const ts = new Date(a.created_at).getTime();
    const okFrom = !dateFrom || ts >= new Date(dateFrom).getTime();
    const okTo = !dateTo || ts <= new Date(dateTo).getTime();
    return okAction && okFrom && okTo;
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Auditoría</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {!error && (
          <div className="space-y-2">
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <input className="border rounded px-2 py-2" value={action} onChange={e=>setAction(e.target.value)} placeholder="Acción" />
              <input type="date" className="border rounded px-2 py-2" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
              <input type="date" className="border rounded px-2 py-2" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
            </div>
            {filtered.map((a) => (
              <div key={a.id} className="border border-gray-200 rounded p-3">
                <div className="font-medium">{a.action}</div>
                <div className="text-sm text-gray-600">{new Date(a.created_at).toLocaleString()}</div>
                {a.details && <div className="text-gray-700">{a.details}</div>}
              </div>
            ))}
            {filtered.length === 0 && <div className="text-gray-600">Sin resultados</div>}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminAudit;

