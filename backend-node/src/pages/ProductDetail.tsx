import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
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
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const refreshCart = useCartStore((s) => s.refreshCount);

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
          <img src={images[0]?.url || "https://via.placeholder.com/600"} alt={product.name} className="w-full rounded-lg" />
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
          <button onClick={addToCart} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">Agregar al carrito</button>
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
    </Layout>
  );
};

export default ProductDetail;
