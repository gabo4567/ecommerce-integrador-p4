import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Toast from "../components/Toast";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { getRating, setRating, isFavorite, toggleFavorite, getProductImageCandidates, advanceImageFallback } from "../lib/utils";
import { useAuthStore } from "../store/auth";
import { useCartStore } from "../store/cart";

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [specs, setSpecs] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const access = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const refreshCart = useCartStore((s) => s.refreshCount);
  const [canRate, setCanRate] = useState(false);
  const [fav, setFav] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVar, setToastVar] = useState<'success' | 'info' | 'error'>("info");

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        const p = await api.get<any>(`products/${id}/`);
        setProduct(p);
        const imgs = await api.get<any[]>(`images/?product=${id}`);
        setImages(imgs);
        const sp = await api.get<any[]>(`specs/?product=${id}`);
        setSpecs(sp);
        const vs = await api.get<any[]>("variants/");
        setVariants(vs.filter((v: any) => String(v.product) === String(id)));
        if (access) {
          try {
            const me = await api.get<any>("users/me/");
            const orders = await api.get<any[]>("orders/");
            const myOrders = orders.filter(o => o.user === me.id && (o.status === 'paid' || o.status === 'delivered'));
            const items = await api.get<any[]>("order-items/");
            setCanRate(items.some(it => String(it.product) === String(id) && myOrders.some(o => o.id === it.order)));
          } catch {}
        }
        setFav(isFavorite(Number(id)));
      } catch {}
    };
    run();
  }, [id]);

  const addToCart = async () => {
    if (!product) return;
    if (!access) { navigate('/login'); return; }
    try {
      const me = await api.get<any>("users/me/");
      const orders = await api.get<any[]>("orders/");
      let pending = orders.find((o: any) => o.status === "pending" && o.user === me.id);
      if (!pending) pending = await api.post<any>("orders/", {});
      const variant = variants.find((v) => v.id === selectedVariantId);
      const unitPrice = variant ? Number(variant.price) : Number(product.price);
      await api.post("order-items/", { order: pending.id, product: product.id, quantity: 1, unit_price: unitPrice });
      setMessage("Producto agregado al carrito");
      await refreshCart();
      navigate('/carrito');
    } catch {}
  };

  if (!product) return (
    <Layout>
      <div className="text-center">Cargando...</div>
    </Layout>
  );

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="relative">
            <img src={getProductImageCandidates({ ...product, images })[0]} data-candidates={JSON.stringify(getProductImageCandidates({ ...product, images }))} data-idx={0} onError={advanceImageFallback} alt={product.name} className="w-full rounded-lg" />
            {role !== 'admin' && (
              <button onClick={() => { const next = !fav; toggleFavorite(product.id); setFav(next); setToastMsg(next ? 'Agregado a favoritos' : 'Quitado de favoritos'); setToastVar(next ? 'success' : 'info'); setToastOpen(true); }} className="absolute top-2 right-2 bg-white rounded px-3 py-2 shadow" aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
                <span className={fav ? 'text-red-500' : 'text-gray-500'}>❤</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {images.slice(1, 6).map((img) => (
              <img key={img.id} src={img.url} className="w-16 h-16 object-cover rounded" />
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">${selectedVariantId ? Number(variants.find(v => v.id === selectedVariantId)?.price || product.price) : Number(product.price)}</p>
          <div className="mt-2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <button key={i} onClick={() => { if (canRate) setRating(product.id, i+1); }} className="text-xl" title={canRate ? 'Calificar' : 'Califica después de comprar y recibir'}>
                <span className={i < getRating(product.id) ? 'text-yellow-400' : 'text-gray-300'}>{'★'}</span>
              </button>
            ))}
          </div>
          {variants.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Variante</label>
              <select value={selectedVariantId ?? ''} onChange={(e) => setSelectedVariantId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="">Seleccionar</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.color || 'Color'} / {v.storage || 'Opciones'} — ${Number(v.price)}</option>
                ))}
              </select>
            </div>
          )}
          {role !== 'admin' && (
            <button onClick={addToCart} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">Agregar al carrito</button>
          )}
          {message && (
            <p className="mt-3 text-sm text-gray-700">{message}</p>
          )}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Especificaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specs.map((s) => (
                <div key={s.id} className="border border-gray-200 rounded p-3">
                  <div className="font-medium text-gray-800">{s.key}</div>
                  <div className="text-gray-600">{s.value} {s.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Toast open={toastOpen} message={toastMsg} variant={toastVar} onClose={() => setToastOpen(false)} duration={1800} />
    </Layout>
  );
};

export default ProductDetail;
