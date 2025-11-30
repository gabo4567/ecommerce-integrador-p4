import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";

const AdminAudit = () => {
  const [audits, setAudits] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try { const data = await api.get("audit/"); setAudits(data); setError(null); }
      catch { setError("Acceso restringido a administradores"); }
    };
    run();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Auditoría</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {!error && (
          <div className="space-y-2">
            {audits.map((a) => (
              <div key={a.id} className="border border-gray-200 rounded p-3"><div className="font-medium">{a.action}</div><div className="text-sm text-gray-600">{new Date(a.created_at).toLocaleString()}</div>{a.details && <div className="text-gray-700">{a.details}</div>}</div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminAudit;

