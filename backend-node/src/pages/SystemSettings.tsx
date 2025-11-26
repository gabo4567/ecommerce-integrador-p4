import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await api.get<any[]>("settings/");
        setSettings(data);
      } catch {}
    };
    run();
  }, []);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">Ajustes del sistema</h1>
        <div className="space-y-2">
          {settings.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded p-3">
              <div className="font-medium">{s.key}</div>
              <div className="text-gray-600">{s.value}</div>
              {s.description && <div className="text-sm text-gray-500">{s.description}</div>}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SystemSettings;

