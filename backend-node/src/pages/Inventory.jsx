import { useState } from 'react';
import { syncInventory, patchProduct, patchVariant } from '../services/inventoryService';
import CardProduct from '../components/CardProduct';

export default function Inventory() {
  const [productId, setProductId] = useState('5');
  const [variantId, setVariantId] = useState('7');
  const [price, setPrice] = useState('120');
  const [stock, setStock] = useState('15');
  const [msg, setMsg] = useState('');

  async function onSync() {
    try {
      const res = await syncInventory({ products: [{ id: Number(productId), price: Number(price), stock: Number(stock) }], variants: [{ id: Number(variantId), price: Number(price) - 5, stock: Number(stock) - 2, active: true }] });
      setMsg(`Procesados: ${res?.processed ?? 0}`);
    } catch {
      setMsg('Error sincronizando');
    }
  }

  async function onPatchDirect() {
    try {
      await patchProduct(Number(productId), { price: Number(price), stock: Number(stock) });
      await patchVariant(Number(variantId), { price: Number(price) - 5, stock: Number(stock) - 2, active: true });
      setMsg('Actualizado directamente');
    } catch {
      setMsg('Error actualizando');
    }
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Inventario</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CardProduct title={`Producto ${productId}`} price={price} stock={stock} onAction={onSync} actionLabel="Sync via CF" />
        <CardProduct title={`Variante ${variantId}`} price={Number(price) - 5} stock={Number(stock) - 2} onAction={onPatchDirect} actionLabel="Patch directo" />
      </div>
      <div className="flex gap-2 items-center">
        <input value={productId} onChange={e => setProductId(e.target.value)} className="border rounded px-2 py-1" placeholder="Product ID" />
        <input value={variantId} onChange={e => setVariantId(e.target.value)} className="border rounded px-2 py-1" placeholder="Variant ID" />
        <input value={price} onChange={e => setPrice(e.target.value)} className="border rounded px-2 py-1" placeholder="Precio" />
        <input value={stock} onChange={e => setStock(e.target.value)} className="border rounded px-2 py-1" placeholder="Stock" />
      </div>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
