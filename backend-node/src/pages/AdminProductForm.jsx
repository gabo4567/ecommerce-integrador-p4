import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { adminApi } from "../api/admin";
import { ai } from "../api/ai";
import { getProductImageCandidates } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === undefined || id === "nuevo";
  const [form, setForm] = useState({ name: "", description: "", price: undefined, stock: undefined });
  const [images, setImages] = useState([]);
  const [imgUrl, setImgUrl] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [pendingImgUrl, setPendingImgUrl] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(undefined);
  const [priceInput, setPriceInput] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [imageToDelete, setImageToDelete] = useState(null);

  useEffect(() => {
    async function load() {
      try { const cats = await adminApi.listCategories(); setCategories(cats || []); } catch {}
      if (!isNew && id) {
        const data = await adminApi.getProduct(Number(id));
        setForm(data);
        {
          const cat = (data).category;
          setCategoryId((cat && typeof cat === 'object') ? Number(cat.id) : (typeof cat === 'number' ? Number(cat) : undefined));
        }
        setPriceInput((data).price != null ? (() => { const v = Number((data).price) || 0; const int = Math.floor(v); const dec = Math.round((v - int) * 100); const intFormatted = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); const decStr = String(dec).padStart(2, '0'); return `${intFormatted},${decStr}`; })() : "");
        setStockInput((data).stock != null ? String((data).stock) : "");
        try {
          const all = await adminApi.listImages();
          const mine = (all || []).filter(i => i.product === Number(id));
          setImages(mine);
          if ((mine || []).length === 0) {
            const cands = getProductImageCandidates(data);
            const valid = (cands || []).find(u => typeof u === 'string' && /^https?:\/\//.test(u));
            if (valid) {
              try { const created = await adminApi.createImage({ product: Number(id), url: valid, is_primary: true }); setImages([created]); } catch {}
            }
          }
        } catch {}
      }
    }
    load();
  }, [id]);

  const formatPriceInput = (s) => {
    const raw = String(s || "").replace(/[^\d,]/g, "");
    const parts = raw.split(",");
    const intDigits = (parts[0] || "0").replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "") || "0";
    const intFormatted = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    let dec = (parts[1] || "").replace(/[^\d]/g, "").slice(0, 2);
    dec = (parts.length === 1) ? "00" : dec.padEnd(2, "0");
    return `${intFormatted},${dec}`;
  };

  const sanitizePriceInput = (s) => {
    let v = String(s || "").replace(/[^\d.,]/g, "");
    v = v.replace(/\./g, ",");
    const parts = v.split(",");
    const int = (parts[0] || "").replace(/[^\d]/g, "");
    let dec = parts[1] ? parts[1].replace(/[^\d]/g, "") : "";
    if (dec.length > 2) dec = dec.slice(0, 2);
    return parts.length > 1 ? `${int},${dec}` : int;
  };

  const sanitizeIntInput = (s) => {
    const v = String(s || "").replace(/[^\d]/g, "");
    return v;
  };

  async function onSave(e) {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      const nameOk = String(form.name || '').trim().length > 0;
      const catOk = Boolean(categoryId);
      const priceOk = String(priceInput || '').trim().length > 0;
      if (!nameOk) { setErr('Nombre requerido'); return; }
      if (!catOk) { setErr('Seleccione una categoría'); return; }
      if (!priceOk) { setErr('Precio requerido'); return; }
      const payload = { ...form };
      payload.category_id = categoryId;
      if (priceInput && priceInput.trim().length > 0) {
        const raw = priceInput.trim();
        const cleaned = raw.replace(/[^\d,]/g, "");
        const [intPart = "0", decPart = "00"] = cleaned.split(",");
        const intDigits = intPart.replace(/[^\d]/g, "");
        const decDigits = decPart.replace(/[^\d]/g, "").padEnd(2, "0");
        const numStr = `${intDigits}.${decDigits}`;
        const num = Number(numStr);
        payload.price = isNaN(num) ? undefined : num;
      } else { payload.price = undefined; }
      if (stockInput && stockInput.trim().length > 0) {
        const si = parseInt(stockInput.trim(), 10);
        payload.stock = isNaN(si) ? undefined : si;
      } else { payload.stock = undefined; }
      if (isNew) {
        const created = await adminApi.createProduct(payload);
        try { const mineRaw = localStorage.getItem('myProductIds') || '[]'; const mine = JSON.parse(mineRaw); localStorage.setItem('myProductIds', JSON.stringify(Array.from(new Set([...mine, created.id])))); } catch {}
        try { for (const url of pendingImages) { await adminApi.createImage({ product: created.id, url }); } } catch {}
        try {
          const firstImg = pendingImages[0] || '';
          const specs = await ai.generateSpecs({ name: created.name || '', price: Number(created.price || 0), image_url: firstImg });
          const ordered = [
            ["Marca", String(specs.brand||'')],
            ["Modelo", String(specs.model||'')],
            ["Color", String(specs.color||'')],
            ["Peso", String(specs.weight||'')],
            ["Dimensiones", String(specs.dimensions||'')],
            ["Materiales", String(specs.materials||'')],
            ["Garantía", String(specs.warranty||'')],
            ["Características", Array.isArray(specs.features)? specs.features.join('; '): String(specs.features||'')],
            ["Uso recomendado", String(specs.usage||'')],
            ["Descripción corta", String(specs.short_description||'')],
          ];
          let order = 0;
          for (const [k,v] of ordered) { const val = String(v||'').trim(); if (!val) continue; try { await adminApi.createSpec({ product: created.id, key: k, value: val, unit: "", display_order: order++, searchable: true, active: true }); } catch {} }
        } catch {}
        navigate(`/admin/producto/${created.id}`);
      } else {
        await adminApi.updateProduct(Number(id), payload);
        setMsg("Guardado");
      }
    } catch (e) {
      try { const data = JSON.parse(e?.message); setErr(JSON.stringify(data)); } catch { setErr(e?.message || "Error guardando"); }
    }
  }

  async function onAddImage() {
    if (!imgUrl) return;
    try { const created = await adminApi.createImage({ product: Number(id), url: imgUrl }); setImages(prev => [...prev, created]); setImgUrl(""); } catch (e) { alert(e?.message || "Error creando imagen"); }
  }

  function onAddPendingImage() { const u = String(pendingImgUrl || "").trim(); if (!u) return; setPendingImages(prev => [...prev, u]); setPendingImgUrl(""); }
  function removePendingImage(u) { setPendingImages(prev => prev.filter(x => x !== u)); }

  async function onImageUpdate(im, data) { const upd = await adminApi.updateImage(im.id, data); setImages(prev => prev.map(x => x.id === im.id ? upd : x)); }
  async function onImageDelete(im) { setImageToDelete(im); }
  async function confirmImageDelete() { if (!imageToDelete) return; await adminApi.deleteImage(imageToDelete.id); setImages(prev => prev.filter(x => x.id !== imageToDelete.id)); setImageToDelete(null); }

  return (
    <Layout>
      <form onSubmit={onSave} className="grid gap-4 max-w-2xl">
        <h2 className="text-2xl font-semibold">{isNew ? "Nuevo producto" : `Editar producto #${id}`}</h2>
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {err && <p className="text-sm text-red-600 break-all">{err}</p>}
        <label className="text-sm font-medium">Nombre</label>
        <input className="border rounded px-2 py-1" placeholder="Nombre del producto" value={form.name ?? ""} onChange={e => setForm({ ...form, name: e.target.value })} />
        <label className="text-sm font-medium">Descripción</label>
        <textarea className="border rounded px-2 py-1" placeholder="Descripción breve" value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} />
        <label className="text-sm font-medium" htmlFor="admin-category-select">Categoría</label>
        <select id="admin-category-select" className="border rounded px-2 py-1" value={categoryId ?? ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)} aria-label="Categoría del producto" title="Categoría del producto">
          <option value="">Seleccione una categoría</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1"><label className="text-sm font-medium">Precio</label><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">$</span><input className="border rounded pl-6 pr-2 py-1 w-full" type="text" inputMode="decimal" placeholder="$" value={priceInput} onChange={e => setPriceInput(sanitizePriceInput(e.target.value))} onBlur={e => setPriceInput(formatPriceInput(e.target.value))} /></div></div>
          <div className="grid gap-1"><label className="text-sm font-medium">Stock</label><input className="border rounded px-2 py-1" type="text" inputMode="numeric" placeholder="0" value={stockInput} onChange={e => setStockInput(sanitizeIntInput(e.target.value))} /></div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled={!String(form.name||'').trim() || !categoryId || !String(priceInput||'').trim()}>Guardar</button>
      </form>
      <div className="mt-8"><h3 className="text-xl font-semibold mb-2">Imágenes</h3>
        {isNew ? (
          <div><div className="flex gap-2 mb-3"><input className="border rounded px-2 py-1 flex-1" placeholder="URL de imagen" value={pendingImgUrl} onChange={e => setPendingImgUrl(e.target.value)} /><button className="px-4 py-2 bg-green-600 text-white rounded" onClick={onAddPendingImage}>Agregar</button></div><div className="grid gap-3">{pendingImages.map(u => (<div key={u} className="p-3 border rounded flex items-center justify-between"><div className="flex items-center gap-3"><img src={u} alt="img" className="h-16 w-16 object-cover rounded" referrerPolicy="no-referrer" /><div><p className="text-sm text-gray-600">{u}</p></div></div><div className="flex gap-2"><button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => removePendingImage(u)}>Quitar</button></div></div>))}{pendingImages.length === 0 && <p>No hay imágenes agregadas todavía. Puedes agregarlas antes de guardar.</p>}</div></div>
        ) : (
          <div><div className="flex gap-2 mb-3"><input className="border rounded px-2 py-1 flex-1" placeholder="URL de imagen" value={imgUrl} onChange={e => setImgUrl(e.target.value)} /><button className="px-4 py-2 bg-green-600 text-white rounded" onClick={onAddImage}>Agregar</button></div><div className="grid gap-3">{images.map(im => (<div key={im.id} className="p-3 border rounded flex items-center justify-between"><div className="flex items-center gap-3"><img src={im.url} alt="img" className="h-16 w-16 object-cover rounded" referrerPolicy="no-referrer" /><div><p className="text-sm">ID {im.id}</p><p className="text-sm text-gray-600">{im.url}</p></div></div><div className="flex gap-2"><button className="px-3 py-1 bg-gray-200 rounded" onClick={() => onImageUpdate(im, { is_primary: !(im.is_primary ?? false) })}>{im.is_primary ? "Quitar principal" : "Hacer principal"}</button><button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => onImageDelete(im)}>Eliminar</button></div></div>))}{images.length === 0 && <p>No hay imágenes.</p>}</div></div>
        )}
      </div>
      <ConfirmDialog open={!!imageToDelete} title="¿Eliminar imagen?" message={imageToDelete ? `Se eliminará la imagen ID ${imageToDelete.id}.` : ''} confirmText="Sí, eliminar" cancelText="Cancelar" onConfirm={confirmImageDelete} onClose={() => setImageToDelete(null)} />
    </Layout>
  );
}

