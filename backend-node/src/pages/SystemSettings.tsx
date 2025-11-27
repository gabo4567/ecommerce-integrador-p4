import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";

type Setting = { id: number; key: string; value: string; description?: string };
type Discount = { id: number; name: string; percentage: string; start_date: string; end_date: string; active: boolean };
type Audit = { id: number; user: number | null; action: string; created_at: string; details: string };

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    try {
      setLoading(true); setError(null);
      const [s, d] = await Promise.all([
        api.get<Setting[]>("settings/"),
        api.get<Discount[]>("discounts/"),
      ]);
      setSettings(s || []);
      setDiscounts(d || []);
      try { const a = await api.get<Audit[]>("audit/"); setAudits(a || []); } catch {}
    } catch (e: any) {
      setError(e?.message || "Error cargando ajustes");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, []);

  const getVal = (key: string) => settings.find(s => s.key === key)?.value ?? "";
  async function saveSetting(key: string, value: string) {
    try {
      await api.patch<Setting>(`settings/${encodeURIComponent(key)}/`, { value });
      await loadAll();
    } catch (e: any) { alert(e?.message || "Error guardando configuración"); }
  }

  async function createDiscount(d: Partial<Discount>) {
    try { await api.post<Discount>("discounts/", d); await loadAll(); } catch (e: any) { alert(e?.message || "Error creando descuento"); }
  }
  async function updateDiscount(id: number, d: Partial<Discount>) {
    try { await api.patch<Discount>(`discounts/${id}/`, d); await loadAll(); } catch (e: any) { alert(e?.message || "Error actualizando descuento"); }
  }
  async function deleteDiscount(id: number) {
    if (!confirm("¿Eliminar descuento?")) return;
    try { await api.del<void>(`discounts/${id}/`); await loadAll(); } catch (e: any) { alert(e?.message || "Error eliminando descuento"); }
  }

  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({ name: "", percentage: "10", start_date: "", end_date: "", active: true });

  const cloudInventoryLogs = useMemo(() => audits.filter(a => a.details?.includes("cloud_inventory") || a.action?.includes("cloud_inventory")), [audits]);
  const cloudPromoLogs = useMemo(() => audits.filter(a => a.details?.includes("cloud_promo") || a.action?.includes("cloud_promo")), [audits]);

  async function triggerInventorySync() {
    try { const r = await api.post<any>("admin/cloud/inventory-sync/", {}); alert(`Sync status: ${r?.status ?? 'ok'}`); await loadAll(); } catch (e: any) { alert(e?.message || "Error en sincronización"); }
  }
  async function triggerPromoApply() {
    try { const r = await api.post<any>("admin/cloud/promo-apply/", {}); alert(`Promo status: ${r?.status ?? 'ok'}`); await loadAll(); } catch (e: any) { alert(e?.message || "Error en promo"); }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto grid gap-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">Configuración general</h2>
          {loading && <p>Cargando...</p>}
          {error && <p className="text-red-600">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Modo mantenimiento</p>
              <select defaultValue={getVal("maintenance_mode") || "off"} onChange={e => saveSetting("maintenance_mode", e.target.value)} className="border px-2 py-2 rounded w-full">
                <option value="off">off</option>
                <option value="on">on</option>
              </select>
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Mensaje mantenimiento</p>
              <input defaultValue={getVal("maintenance_message")} onBlur={e => saveSetting("maintenance_message", e.target.value)} className="border px-2 py-2 rounded w-full" />
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Banner promoción</p>
              <input defaultValue={getVal("promo_banner_message")} onBlur={e => saveSetting("promo_banner_message", e.target.value)} className="border px-2 py-2 rounded w-full" />
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Límite intentos login</p>
              <input type="number" defaultValue={getVal("login_attempts_limit") || "5"} onBlur={e => saveSetting("login_attempts_limit", e.target.value)} className="border px-2 py-2 rounded w-full" />
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Expiración sesión (min)</p>
              <input type="number" defaultValue={getVal("session_expiration_minutes") || "60"} onBlur={e => saveSetting("session_expiration_minutes", e.target.value)} className="border px-2 py-2 rounded w-full" />
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Registro de usuarios habilitado</p>
              <select defaultValue={getVal("enable_user_registration") || "on"} onChange={e => saveSetting("enable_user_registration", e.target.value)} className="border px-2 py-2 rounded w-full">
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">Descuentos globales</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Crear descuento</h3>
              <div className="grid gap-2">
                <input placeholder="Nombre" value={newDiscount.name as string} onChange={e=>setNewDiscount({...newDiscount, name: e.target.value})} className="border px-2 py-2 rounded" />
                <input placeholder="Porcentaje" type="number" value={newDiscount.percentage as string} onChange={e=>setNewDiscount({...newDiscount, percentage: e.target.value})} className="border px-2 py-2 rounded" />
                <input placeholder="Inicio" type="date" value={newDiscount.start_date as string} onChange={e=>setNewDiscount({...newDiscount, start_date: e.target.value})} className="border px-2 py-2 rounded" />
                <input placeholder="Fin" type="date" value={newDiscount.end_date as string} onChange={e=>setNewDiscount({...newDiscount, end_date: e.target.value})} className="border px-2 py-2 rounded" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!newDiscount.active} onChange={e=>setNewDiscount({...newDiscount, active: e.target.checked})} /> Activo</label>
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={()=>createDiscount(newDiscount)}>Crear</button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Descuentos existentes</h3>
              <div className="grid gap-2">
                {discounts.map(d => (
                  <div key={d.id} className="border rounded p-3">
                    <div className="font-medium">{d.name} • {d.percentage}%</div>
                    <div className="text-sm text-gray-600">{d.start_date} → {d.end_date} • {d.active ? 'activo' : 'inactivo'}</div>
                    <div className="flex gap-2 mt-2">
                      <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>updateDiscount(d.id, { active: !d.active })}>{d.active ? 'Desactivar' : 'Activar'}</button>
                      <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={()=>deleteDiscount(d.id)}>Eliminar</button>
                    </div>
                  </div>
                ))}
                {discounts.length === 0 && <div className="text-gray-600">Sin descuentos</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">Inventario / sincronización</h2>
          <div className="flex gap-3 mb-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={triggerInventorySync}>Sincronizar inventario</button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={triggerPromoApply}>Aplicar promociones (Cloud)</button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <h3 className="font-semibold mb-2">Logs inventario</h3>
              <ul className="space-y-1 max-h-48 overflow-auto">
                {cloudInventoryLogs.map(a => (<li key={a.id} className="text-sm text-gray-700">[{new Date(a.created_at).toLocaleString()}] {a.details}</li>))}
                {cloudInventoryLogs.length === 0 && <li className="text-gray-600">Sin registros</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Logs promociones</h3>
              <ul className="space-y-1 max-h-48 overflow-auto">
                {cloudPromoLogs.map(a => (<li key={a.id} className="text-sm text-gray-700">[{new Date(a.created_at).toLocaleString()}] {a.details}</li>))}
                {cloudPromoLogs.length === 0 && <li className="text-gray-600">Sin registros</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">Configuración de envíos</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Transportistas disponibles (coma-separados)</p>
              <input defaultValue={getVal("shipping_carriers")} onBlur={e => saveSetting("shipping_carriers", e.target.value)} className="border px-2 py-2 rounded w-full" />
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">ETA estándar (días)</p>
              <input type="number" defaultValue={getVal("shipping_eta_standard_days") || "5"} onBlur={e => saveSetting("shipping_eta_standard_days", e.target.value)} className="border px-2 py-2 rounded w-full" />
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">ETA express (días)</p>
              <input type="number" defaultValue={getVal("shipping_eta_express_days") || "2"} onBlur={e => saveSetting("shipping_eta_express_days", e.target.value)} className="border px-2 py-2 rounded w-full" />
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Costo base por región (JSON)</p>
              <textarea defaultValue={getVal("shipping_costs_base") || "{}"} onBlur={e => saveSetting("shipping_costs_base", e.target.value)} className="border px-2 py-2 rounded w-full" rows={3} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">Auditoría</h2>
          <div className="grid gap-2">
            <ul className="space-y-1 max-h-64 overflow-auto">
              {audits.map(a => (
                <li key={a.id} className="text-sm text-gray-800">
                  [{new Date(a.created_at).toLocaleString()}] {a.action} — {a.details}
                </li>
              ))}
              {audits.length === 0 && <li className="text-gray-600">Sin auditorías</li>}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold mb-4">Opciones de IA</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Recomendaciones automáticas</p>
              <select defaultValue={getVal("ai_recommendations_enabled") || "off"} onChange={e => saveSetting("ai_recommendations_enabled", e.target.value)} className="border px-2 py-2 rounded w-full">
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </div>
            <div className="border rounded p-4">
              <p className="font-medium mb-2">Descripciones automáticas</p>
              <select defaultValue={getVal("ai_descriptions_enabled") || "off"} onChange={e => saveSetting("ai_descriptions_enabled", e.target.value)} className="border px-2 py-2 rounded w-full">
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SystemSettings;

