import { useEffect, useState } from 'react';
import { listPendingOrders, cancelOrder } from '../services/ordersService';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await listPendingOrders();
      setOrders(data);
    } catch (e) {
      setError('Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCancel(id) {
    try {
      await cancelOrder(id);
      await load();
    } catch {
      setError('Error al cancelar');
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pedidos Pendientes</h2>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-3">
        {orders.map(o => (
          <div key={o.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="font-medium">Pedido #{o.id}</p>
              <p className="text-sm text-gray-600">Status: {o.status}</p>
            </div>
            <button className="bg-red-600 text-white px-3 py-2 rounded shadow-sm hover:bg-red-700" onClick={() => onCancel(o.id)}>Cancelar</button>
          </div>
        ))}
        {orders.length === 0 && !loading && <p>No hay pedidos pendientes.</p>}
      </div>
    </div>
  );
}
