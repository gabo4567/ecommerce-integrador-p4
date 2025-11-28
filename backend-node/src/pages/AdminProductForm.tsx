import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { adminApi, Product, Image, Category } from "@/api/admin";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === undefined || id === "nuevo";
  const [form, setForm] = useState<Partial<Product>>({ name: "", description: "", price: undefined, stock: undefined });
  const [images, setImages] = useState<Image[]>([]);
  const [imgUrl, setImgUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [priceInput, setPriceInput] = useState<string>("");
  const [stockInput, setStockInput] = useState<string>("");
  const [imageToDelete, setImageToDelete] = useState<Image | null>(null);

  useEffect(() => {
    async function load() {
      // cargar categorías para selector
      try {
        const cats = await adminApi.listCategories();
        setCategories(cats || []);
      } catch {}
      if (!isNew && id) {
        const data = await adminApi.getProduct(Number(id));
        setForm(data);
        setCategoryId((data as any).category ?? undefined);
        setPriceInput((data as any).price != null ? String((data as any).price) : "");
        setStockInput((data as any).stock != null ? String((data as any).stock) : "");
        try {
          const all = await adminApi.listImages();
          setImages((all || []).filter(i => i.product === Number(id)));
        } catch {}
      }
    }
    load();
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      const payload: any = { ...form };
      if (categoryId) payload.category_id = categoryId;
      if (priceInput && priceInput.trim().length > 0) {
        const normalized = priceInput.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
        const num = normalized.includes(".") ? parseFloat(normalized) : parseInt(normalized, 10);
        payload.price = isNaN(num) ? undefined : num;
      } else {
        payload.price = undefined;
      }
      if (stockInput && stockInput.trim().length > 0) {
        const si = parseInt(stockInput.trim(), 10);
        payload.stock = isNaN(si) ? undefined : si;
      } else {
        payload.stock = undefined;
      }
      if (isNew) {
        const created = await adminApi.createProduct(payload);
        try {
          const mineRaw = localStorage.getItem('myProductIds') || '[]'
          const mine = JSON.parse(mineRaw) as number[]
          localStorage.setItem('myProductIds', JSON.stringify(Array.from(new Set([...mine, created.id]))))
        } catch {}
        navigate(`/admin/producto/${created.id}`);
      } else {
        await adminApi.updateProduct(Number(id), payload);
        setMsg("Guardado");
      }
    } catch (e: any) {
      try {
        const data = JSON.parse(e?.message);
        setErr(JSON.stringify(data));
      } catch {
        setErr(e?.message || "Error guardando");
      }
    }
  }

  async function onAddImage() {
    if (!imgUrl) return;
    try {
      const created = await adminApi.createImage({ product: Number(id), url: imgUrl });
      setImages(prev => [...prev, created]);
      setImgUrl("");
    } catch (e: any) { alert(e?.message || "Error creando imagen"); }
  }

  async function onImageUpdate(im: Image, data: Partial<Image>) {
    const upd = await adminApi.updateImage(im.id, data);
    setImages(prev => prev.map(x => x.id === im.id ? upd : x));
  }

  async function onImageDelete(im: Image) {
    setImageToDelete(im);
  }
  async function confirmImageDelete() {
    if (!imageToDelete) return;
    await adminApi.deleteImage(imageToDelete.id);
    setImages(prev => prev.filter(x => x.id !== imageToDelete!.id));
    setImageToDelete(null);
  }

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
        <label className="text-sm font-medium">Categoría</label>
        <select className="border rounded px-2 py-1" value={categoryId ?? ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">Seleccione una categoría</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Precio</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">$</span>
              <input className="border rounded pl-6 pr-2 py-1 w-full" type="text" inputMode="decimal" placeholder="$" value={priceInput} onChange={e => setPriceInput(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Stock</label>
            <input className="border rounded px-2 py-1" type="number" min={0} step={1} placeholder="0" value={stockInput} onChange={e => setStockInput(e.target.value)} />
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Guardar</button>
      </form>

      {!isNew && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Imágenes</h3>
          <div className="flex gap-2 mb-3">
            <input className="border rounded px-2 py-1 flex-1" placeholder="URL de imagen" value={imgUrl} onChange={e => setImgUrl(e.target.value)} />
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={onAddImage}>Agregar</button>
          </div>
          <div className="grid gap-3">
            {images.map(im => (
              <div key={im.id} className="p-3 border rounded flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={im.url} alt="img" className="h-16 w-16 object-cover rounded" />
                  <div>
                    <p className="text-sm">ID {im.id}</p>
                    <p className="text-sm text-gray-600">{im.url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => onImageUpdate(im, { is_primary: !(im.is_primary ?? false) })}>{im.is_primary ? "Quitar principal" : "Hacer principal"}</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => onImageDelete(im)}>Eliminar</button>
                </div>
              </div>
            ))}
            {images.length === 0 && <p>No hay imágenes.</p>}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!imageToDelete}
        title="¿Eliminar imagen?"
        message={imageToDelete ? `Se eliminará la imagen ID ${imageToDelete.id}.` : ''}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={confirmImageDelete}
        onClose={() => setImageToDelete(null)}
      />
    </Layout>
  );
}
