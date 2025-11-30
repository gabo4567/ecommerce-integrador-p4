import { useEffect, useState } from 'react';
import { listDiscounts, applyPromo, removePromo } from '../services/promoService';
import { cfEnabled } from '../services/http';

export default function Promotions() {
  const [discounts, setDiscounts] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [lastAppliedId, setLastAppliedId] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await listDiscounts();
        setDiscounts(data);
      } catch {
        setMsg('Error cargando descuentos');
      }
    })();
  }, []);

  async function onApply(did) {
    try {
      setMsg('');
      if (!cfEnabled) { setMsg('Funciones de Cloud no disponibles en producción Spark'); return; }
      const res = await applyPromo(Number(orderId), did);
      setLastAppliedId(res?.orderDiscount?.id || null);
      setMsg('Descuento aplicado');
    } catch {
      setMsg('Error aplicando');
    }
  }

  async function onRemove() {
    try {
      if (!lastAppliedId) return;
      if (!cfEnabled) { setMsg('Funciones de Cloud no disponibles en producción Spark'); return; }
      await removePromo(lastAppliedId);
      setMsg('Descuento eliminado');
      setLastAppliedId(null);
    } catch {
      setMsg('Error eliminando');
    }
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Promociones</h2>
      <div className="flex items-center gap-2">
        <input value={orderId} onChange={e => setOrderId(e.target.value)} className="border rounded px-2 py-1" placeholder="Order ID" />
        <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => setMsg('')}>Limpiar</button>
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {discounts.map(d => (
          <div key={d.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <p className="font-medium">{d.name}</p>
            <p className="text-sm text-gray-600">% {d.percentage}</p>
            <div className="mt-2 flex gap-2">
              <button className="bg-blue-600 text-white px-3 py-1 rounded shadow-sm hover:bg-blue-700" onClick={() => onApply(d.id)}>Aplicar</button>
            </div>
          </div>
        ))}
      </div>
      <div>
        <button disabled={!lastAppliedId} className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50" onClick={onRemove}>Eliminar último aplicado</button>
      </div>
    </div>
  );
}
