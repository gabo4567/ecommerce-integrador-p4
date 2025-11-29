import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { adminApi } from "@/api/admin";
import ConfirmDialog from "@/components/ConfirmDialog";

const AdminAudit: React.FC = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [usersMap, setUsersMap] = useState<Record<number, string>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv"|"json">("csv");
  const filtersApplied = useMemo(() => Boolean(action || dateFrom || dateTo), [action, dateFrom, dateTo]);

  async function load() {
    try {
      const params: Record<string,string> = {}
      const data = await adminApi.listAdminAuditAll(params)
      const filtered = filterLocal(data || [])
      setAudits(filtered)
      setError(null)
    } catch {
      setError("Acceso restringido a administradores")
    }
  }

  useEffect(() => { (async ()=>{ try{ const us = await adminApi.listAdminUsersAll(); setUsers(us); const map: Record<number,string> = {}; us.forEach(u=>{ const full = [u.first_name,u.last_name].filter(Boolean).join(' ').trim(); map[u.id] = full || (u.username ?? '') || (u.email ?? `Usuario ${u.id}`) }); setUsersMap(map) } catch{}; await load(); })() }, [])

  useEffect(() => {
    const t = setTimeout(() => { load() }, 300)
    return () => clearTimeout(t)
  }, [action, dateFrom, dateTo])

  function filterLocal(items: any[]): any[] {
    function localStart(s: string): number | null {
      if (!s) return null
      const [y,m,d] = s.split('-').map(Number)
      if (!y || !m || !d) return null
      return new Date(y, m-1, d, 0,0,0,0).getTime()
    }
    function localEnd(s: string): number | null {
      if (!s) return null
      const [y,m,d] = s.split('-').map(Number)
      if (!y || !m || !d) return null
      return new Date(y, m-1, d, 23,59,59,999).getTime()
    }
    return items.filter(a => {
      const ts = new Date(a.created_at).getTime()
      const fromTs = localStart(dateFrom)
      const toTs = localEnd(dateTo)
      const okFrom = fromTs == null || ts >= fromTs
      const okTo = toTs == null || ts <= toTs
      const okAction = !action || String(a.action || '').toLowerCase().includes(action.toLowerCase()) || String(a.details || '').toLowerCase().includes(action.toLowerCase())
      return okFrom && okTo && okAction
    })
  }

  function displayTarget(a: any): string {
    const d = String(a.details || '')
    const m = d.match(/(?:entity|entidad)=usuario\s+id=(\d+)|usuario\s+id=(\d+)/i)
    const id = m ? Number(m[1] || m[2]) : (a.user ?? null)
    if (!id) return d
    const name = usersMap[id]
    if (!name) return d
    return d.replace(/(?:(?:entity|entidad)=usuario\s+id=\d+|usuario\s+id=\d+)/i, `usuario=${name}`)
  }

  async function doExport(fmt: "csv"|"json") {
    const all = await adminApi.listAdminAuditAll()
    const filtered = filterLocal(all)
    if (fmt === "json") {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `audit_${fileSuffix()}.json`; a.click()
      URL.revokeObjectURL(url)
      return
    }
    const header = ["id","action","created_at","details","user"]
    const rows = filtered.map((a:any)=> [a.id, safe(a.action), a.created_at, safe(a.details), a.user ?? ""]) as string[][]
    const csv = [header.join(","), ...rows.map(r => r.map(v => String(v).replace(/"/g,'\"')).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `audit_${fileSuffix()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }
  function fileSuffix() {
    const parts = [] as string[]
    if (action) parts.push(`action-${action}`)
    if (dateFrom) parts.push(`from-${dateFrom}`)
    if (dateTo) parts.push(`to-${dateTo}`)
    const base = parts.join("_") || `all_${Date.now()}`
    return base
  }
  function buildParams(): Record<string,string> { return {} }
  function requestExport(fmt: "csv"|"json") {
    setExportFormat(fmt)
    setConfirm(true)
  }
  function safe(s: any): string { return s == null ? "" : String(s) }

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
            <div className="flex gap-2 mb-2">
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={load}>Aplicar filtros</button>
              <button className="px-3 py-2 bg-gray-200 rounded" onClick={()=>{ setAction(""); setDateFrom(""); setDateTo(""); load(); }}>Limpiar</button>
              <button className="px-3 py-2 bg-gray-100 rounded" disabled={!filtersApplied} onClick={()=>requestExport('csv')}>Exportar CSV</button>
              <button className="px-3 py-2 bg-gray-100 rounded" disabled={!filtersApplied} onClick={()=>requestExport('json')}>Exportar JSON</button>
              {!filtersApplied && <span className="text-sm text-gray-600">Aplica algún filtro para exportar</span>}
            </div>
            {audits.map((a) => (
              <div key={a.id} className="border border-gray-200 rounded p-3">
                <div className="font-medium">{a.action}</div>
                <div className="text-sm text-gray-600">{new Date(a.created_at).toLocaleString()}</div>
                {a.details && <div className="text-gray-700">{displayTarget(a)}</div>}
              </div>
            ))}
            <ConfirmDialog
              open={confirm}
              title="Exportar auditoría"
              message={`Se exportarán los resultados filtrados. Esto puede contener datos sensibles. ¿Continuar?`}
              confirmText={`Exportar ${exportFormat.toUpperCase()}`}
              cancelText="Cancelar"
              onConfirm={async ()=>{ setConfirm(false); await doExport(exportFormat); }}
              onClose={()=>setConfirm(false)}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminAudit;
