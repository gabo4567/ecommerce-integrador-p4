import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { adminApi } from "../api/admin";
import { formatMoney, norm } from "../lib/utils";
import { ai } from "../api/ai";
import { api } from "../api/client";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [genLoadingId, setGenLoadingId] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const cap = (s) => String(s||"").slice(0, 255);
  const capShort = (s) => {
    const str = String(s||"").trim();
    if (str.length <= 255) return str;
    const slice = str.slice(0, 255);
    const punctIdx = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
    if (punctIdx >= 180) return slice.slice(0, punctIdx + 1).trim();
    const spaceIdx = slice.lastIndexOf(' ');
    return (spaceIdx > 0 ? slice.slice(0, spaceIdx) : slice).trim() + '…';
  };

  async function load() {
    try { setLoading(true); setError(null); const data = await adminApi.listProducts(); setItems(data || []); }
    catch (e) { setError(e?.message || "Error cargando productos"); }
    finally { setLoading(false); }
  }

  const [toDelete, setToDelete] = useState(null);
  async function confirmDelete() {
    if (!toDelete) return;
    try { await adminApi.deleteProduct(toDelete.id); setToDelete(null); await load(); } catch (e) { alert(e?.message || "Error eliminando"); }
  }

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <div className="flex items-center justify_between mb-4">
        <h2 className="text-2xl font-semibold">Productos (Admin)</h2>
        <div className="flex items_center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos..."
            aria-label="Buscar productos"
            className="border rounded px-3 py-2 w-64"
          />
          <Link to="/admin/producto/nuevo" className="px-4 py-2 bg-blue-600 text_white rounded">Nuevo producto</Link>
          <button onClick={async()=>{
            try {
              setBulkLoading(true); setInfoMsg("");
              for (const p of items) {
                const img = (p.images && p.images[0]?.url) || "";
                const payload = { name: p.name || '', price: Number(p.price || 0), image_url: img };
                const specs = await ai.generateSpecs(payload);
                const list = await api.get(`specs/?product=${p.id}&include_inactive=1`) || [];
                const byKey = {}; for (const s of list) byKey[String(s.key).toLowerCase()] = s;
                const ordered = [
                  ["Marca", cap(specs.brand)],
                  ["Modelo", cap(specs.model)],
                  ["Color", cap(specs.color)],
                  ["Peso", cap(specs.weight)],
                  ["Dimensiones", cap(specs.dimensions)],
                  ["Materiales", cap(specs.materials)],
                  ["Garantía", cap(specs.warranty)],
                  ["Características", cap(Array.isArray(specs.features)? specs.features.join('; '): String(specs.features||''))],
                  ["Uso recomendado", cap(specs.usage)],
                  ["Descripción corta", capShort(specs.short_description)],
                ];
                let order = 0;
                for (const [k,v] of ordered) {
                  const val = String(v||'').trim(); if (!val) continue;
                  const existing = byKey[String(k).toLowerCase()];
                  try {
                    if (existing) {
                      await api.patch(`specs/${existing.id}/`, { product: p.id, key: k, value: val, unit: existing.unit || "", display_order: order++, searchable: true, active: true });
                    } else {
                      await api.post("specs/", { product: p.id, key: k, value: val, unit: "", display_order: order++, searchable: true });
                    }
                  } catch {}
                }
              }
              setInfoMsg("Especificaciones generadas para todos los productos");
            } finally { setBulkLoading(false); }
          }} disabled={bulkLoading} className={`px-3 py-2 rounded ${bulkLoading? 'bg-gray-300 text-gray-600 cursor-not-allowed':'bg-purple-600 text-white hover:bg-purple-700'}`}>{bulkLoading? 'Generando…':'Generar todos (IA)'}</button>
        </div>
      </div>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-3">
        {infoMsg && (<div className="mb-2 text-sm text-green-700">{infoMsg}</div>)}
        {items
          .filter(p => {
            const q = norm(query);
            if (!q) return true;
            const hay = `${norm(p.name)} ${norm(p.description || '')}`;
            return q.split(/\s+/).filter(Boolean).every(t => hay.includes(t));
          })
          .map(p => (
          <div key={p.id} className="p-4 bg-white border rounded flex items-center justify-between">
            <div><p className="font-medium">{p.name}</p><p className="text-sm text-gray-600">Precio: ${formatMoney(p.price)} • Stock: {p.stock}</p></div>
            <div className="flex gap-2">
              <Link to={`/admin/producto/${p.id}`} className="px-3 py-2 bg-gray-200 rounded">Editar</Link>
              <button onClick={() => setToDelete(p)} className="px-3 py-2 bg-red-600 text-white rounded">Eliminar</button>
              <button onClick={async ()=>{
                try {
                  setGenLoadingId(p.id);
                  const img = (p.images && p.images[0]?.url) || "";
                  const payload = { name: p.name || '', price: Number(p.price || 0), image_url: img };
                  const specs = await ai.generateSpecs(payload);
                  const list = await api.get(`specs/?product=${p.id}&include_inactive=1`) || [];
                  const byKey = {}; for (const s of list) byKey[String(s.key).toLowerCase()] = s;
                  const ordered = [
                    ["Marca", cap(specs.brand)],
                    ["Modelo", cap(specs.model)],
                    ["Color", cap(specs.color)],
                    ["Peso", cap(specs.weight)],
                    ["Dimensiones", cap(specs.dimensions)],
                    ["Materiales", cap(specs.materials)],
                    ["Garantía", cap(specs.warranty)],
                    ["Características", cap(Array.isArray(specs.features)? specs.features.join('; '): String(specs.features||''))],
                    ["Uso recomendado", cap(specs.usage)],
                    ["Descripción corta", capShort(specs.short_description)],
                  ];
                  let order = 0;
                  for (const [k,v] of ordered) {
                    const val = String(v||'').trim(); if (!val) continue;
                    const existing = byKey[String(k).toLowerCase()];
                    try {
                      if (existing) {
                        await api.patch(`specs/${existing.id}/`, { product: p.id, key: k, value: val, unit: existing.unit || "", display_order: order++, searchable: true, active: true });
                      } else {
                        await api.post("specs/", { product: p.id, key: k, value: val, unit: "", display_order: order++, searchable: true });
                      }
                    } catch {}
                  }
                } finally { setGenLoadingId(null); }
              }} className={`px-3 py-2 rounded ${genLoadingId===p.id? 'bg-gray-300 text-gray-600 cursor-not-allowed':'bg-purple-600 text-white hover:bg-purple-700'}`}>{genLoadingId===p.id? 'Generando…':'Generar specs (IA)'}</button>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && <p>No hay productos.</p>}
      </div>
      <ConfirmDialog open={!!toDelete} title="¿Eliminar producto?" message={toDelete ? `Vas a eliminar \"${toDelete.name}\". Esta acción no se puede deshacer.` : ''} confirmText="Sí, eliminar" cancelText="Cancelar" onConfirm={confirmDelete} onClose={() => setToDelete(null)} />
    </Layout>
  );
}

