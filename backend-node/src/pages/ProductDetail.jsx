import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Toast from "../components/Toast";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ai } from "../api/ai";
import { getRating, setRating, isFavorite, toggleFavorite, getProductImageCandidates, advanceImageFallback, formatMoney, addGuestCartItem, displayProductName, getGuestItemQty } from "../lib/utils";
import { useAuthStore } from "../store/auth";
import { useCartStore } from "../store/cart";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const access = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const refreshCart = useCartStore((s) => s.refreshCount);
  const [canRate, setCanRate] = useState(false);
  const [fav, setFav] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVar, setToastVar] = useState("info");
  const [existingQty, setExistingQty] = useState(0);
  const [aiDesc, setAiDesc] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        const p = await api.get(`products/${id}/`);
        setProduct(p);
        setImages(p?.images || []);
        const imgs = await api.get(`images/?product=${id}`);
        setImages(imgs);
        const sp = await api.get(`specs/?product=${id}`);
        setSpecs(sp);
        const vs = await api.get("variants/");
        setVariants(vs.filter((v) => String(v.product) === String(id)));
        if (access) {
          try {
            const me = await api.get("users/me/");
            const orders = await api.get("orders/");
            const myOrders = orders.filter(o => o.user === me.id && (o.status === 'paid' || o.status === 'delivered'));
            const items = await api.get("order-items/");
            setCanRate(items.some(it => String(it.product) === String(id) && myOrders.some(o => o.id === it.order)));
            const pending = orders.find(o => o.status === 'pending' && o.user === me.id);
            if (pending) {
              const cartItems = await api.get(`order-items/?order=${pending.id}`);
              const eq = cartItems.filter(it => Number(it.product) === Number(id)).reduce((s, it) => s + Number(it.quantity || 0), 0);
              setExistingQty(eq);
            }
          } catch {}
        }
        setFav(access ? isFavorite(Number(id)) : false);
      } catch {}
    };
    run();
  }, [id]);

  const addToCart = async () => {
    if (!product) return;
    try {
      const variant = variants.find((v) => v.id === selectedVariantId);
      const unitPrice = variant ? Number(variant.price) : Number(product.price);
      const stock = variant ? Number(variant.stock ?? 0) : Number(product.stock ?? 0);
      if (access) {
        const me = await api.get("users/me/");
        const orders = await api.get("orders/");
        let pending = orders.find((o) => o.status === "pending" && o.user === me.id);
        if (!pending) pending = await api.post("orders/", {});
        const items = await api.get(`order-items/?order=${pending.id}`);
        const existingQty = items.filter(it => Number(it.product) === Number(product.id)).reduce((sum, it) => sum + Number(it.quantity || 0), 0);
        if (stock > 0 && existingQty >= stock) { setMessage('Stock insuficiente'); return; }
        await api.post("order-items/", { order: pending.id, product: product.id, quantity: 1, unit_price: unitPrice });
      } else {
        const currentQty = getGuestItemQty(product.id);
        if (stock > 0 && currentQty >= stock) { setMessage('Stock insuficiente'); return; }
        addGuestCartItem(product.id, unitPrice, 1);
      }
      setMessage("Producto agregado al carrito");
      await refreshCart();
      navigate('/carrito');
    } catch {}
  };

  const generateAi = async () => {
    if (!product) return;
    setAiError("");
    setAiLoading(true);
    try {
      const specsText = (specs || []).map(s => `${s.key}: ${s.value}${s.unit ? ' ' + s.unit : ''}`).join(', ');
      const payload = { name: product.name || '', price: Number(product.price || 0), specs: specsText };
      const res = await ai.generateDescription(payload);
      setAiDesc(String(res?.description || ''));
    } catch (e) {
      setAiError("No se pudo generar la descripción");
    } finally { setAiLoading(false); }
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
            <img src={getProductImageCandidates({ ...product, images: (images && images.length ? images : (product?.images || [])) })[0]} data-candidates={JSON.stringify(getProductImageCandidates({ ...product, images: (images && images.length ? images : (product?.images || [])) }))} data-idx={0} onError={advanceImageFallback} alt={product.name} className="w-full rounded-lg" referrerPolicy="no-referrer" />
            {role !== 'admin' && (
              <button onClick={() => { if (!access) { navigate('/login'); return; } const next = !fav; toggleFavorite(product.id); setFav(next); setToastMsg(next ? 'Agregado a favoritos' : 'Quitado de favoritos'); setToastVar(next ? 'success' : 'info'); setToastOpen(true); }} className="absolute top-2 right-2 bg-white rounded px-3 py-2 shadow" aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
                <span className={fav ? 'text-red-500' : 'text-gray-500'}>❤</span>
              </button>
            )}
          </div>
          
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{displayProductName(product)}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">${formatMoney(selectedVariantId ? Number(variants.find(v => v.id === selectedVariantId)?.price || product.price) : Number(product.price))}</p>
          <div className="mb-4">
            <button onClick={generateAi} disabled={aiLoading} className={`px-4 py-2 rounded ${aiLoading ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`} aria-label="Generar descripción con IA" title="Generar descripción con IA">{aiLoading ? 'Generando…' : 'Generar descripción con IA'}</button>
            {aiError && (<div className="mt-2 text-sm text-red-600">{aiError}</div>)}
          </div>
          {aiDesc && (
            <div className="mb-6 p-4 bg-white border rounded">
              <h2 className="text-xl font-semibold mb-2">Descripción generada (IA)</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{aiDesc}</p>
            </div>
          )}
          <div className="mt-2 flex items-center gap-1">{[...Array(5)].map((_, i) => (<button key={i} onClick={() => { if (canRate) setRating(product.id, i+1); }} className="text-xl" title={canRate ? 'Calificar' : 'Califica después de comprar y recibir'}><span className={i < getRating(product.id) ? 'text-yellow-400' : 'text-gray-300'}>{'★'}</span></button>))}</div>
          {variants.length > 0 && (
            <div className="mb-4"><label htmlFor="variant-select" className="block text-sm font-medium text-gray-700 mb-2">Variante</label><select id="variant-select" value={selectedVariantId ?? ''} onChange={(e) => setSelectedVariantId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded" aria-label="Seleccionar variante" title="Seleccionar variante"><option value="">Seleccionar</option>{variants.map((v) => (<option key={v.id} value={v.id}>{v.color || 'Color'} / {v.storage || 'Opciones'} — ${formatMoney(Number(v.price))}</option>))}</select></div>
          )}
          {role !== 'admin' && ((() => { const variant = variants.find((v) => v.id === selectedVariantId); const stock = variant ? Number(variant.stock ?? 0) : Number(product.stock ?? 0); const disabled = stock <= 0 || (access ? existingQty >= stock : getGuestItemQty(product.id) >= stock); return (<button onClick={disabled ? undefined : addToCart} disabled={disabled} className={`${disabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'} px-6 py-3 rounded-lg font-semibold`}>Agregar al carrito</button>); })())}
          {message && (<p className="mt-3 text-sm text-gray-700">{message}</p>)}
          <div className="mt-8"><h2 className="text-xl font-semibold mb-4">Especificaciones</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{specs.map((s) => (<div key={s.id} className="border border-gray-200 rounded p-3"><div className="font-medium text-gray-800">{s.key}</div><div className="text-gray-600">{s.value} {s.unit}</div></div>))}</div></div>
        </div>
      </div>
      <Toast open={toastOpen} message={toastMsg} variant={toastVar} onClose={() => setToastOpen(false)} duration={1800} />
    </Layout>
  );
};

export default ProductDetail;

