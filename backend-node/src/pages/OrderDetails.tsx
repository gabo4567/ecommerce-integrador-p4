import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useParams } from "react-router-dom";
import { api } from "../api/client";

const OrderDetails: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [productMap, setProductMap] = useState<Record<number, any>>({});
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const statusText = (s: string) => {
    if (s === 'pending') return 'En espera';
    if (s === 'paid') return 'Pagado';
    if (s === 'void') return 'Anulado';
    return s;
  };
  const shipmentHelp = (s: string) => {
    if (s === 'preparing') return 'Preparando paquete';
    if (s === 'shipped') return 'Despachado al transportista';
    if (s === 'delivered') return 'Entregado';
    if (s === 'cancelled') return 'Envío cancelado';
    return '';
  };

  const computedItemsTotal = () => {
    return items
      .reduce((acc: number, it: any) => acc + Number(it.unit_price || 0) * Number(it.quantity || 0), 0);
  };

  const displayTotal = () => {
    const orderTotal = Number(order?.total || 0);
    if (orderTotal > 0) return orderTotal;
    const itemsTotal = computedItemsTotal();
    if (itemsTotal > 0) return Number(itemsTotal || 0);
    const approved = payments
      .filter((p: any) => String(p.order) === String(order?.id) && p.status === 'approved')
      .reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    if (approved > 0) return approved;
    const allPayments = payments
      .filter((p: any) => String(p.order) === String(order?.id))
      .reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    return allPayments;
  };

  const requestInvoice = async () => {
    if (!order) return;
    setMsg(null);
    try {
      const existing = invoices.filter((p: any) => String(p.order) === String(order.id) && p.status !== 'void');
      if (existing.length > 0) { setMsg('Ya existe una factura para este pedido'); return; }
      const number = `INV-${order.id}-${Date.now()}`;
      const orderTotal = displayTotal();
      const approvedAmount = payments
        .filter((p: any) => String(p.order) === String(order.id) && p.status === 'approved')
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const sumAllPayments = payments
        .filter((p: any) => String(p.order) === String(order.id))
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const paidEnough = approvedAmount >= orderTotal || order.status === 'paid' || sumAllPayments >= orderTotal;
      const lastApproved = payments
        .filter((p: any) => String(p.order) === String(order.id) && p.status === 'approved')
        .sort((a: any, b: any) => (new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()))[0];
      const method = lastApproved?.method || payments[0]?.method || 'unknown';
      await api.post<any>("invoices/", {
        order: order.id,
        number,
        issue_date: new Date().toISOString().slice(0,10),
        total: Number(orderTotal.toFixed(2)),
        payment_method: method,
        status: paidEnough ? 'paid' : 'pending'
      });
      const invs = await api.get<any[]>("invoices/");
      setInvoices(invs.filter((p: any) => String(p.order) === String(order.id)));
    } catch {
      setMsg('No se pudo solicitar la factura');
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setMsg(null);
      try {
        const o = await api.get<any>(`orders/${id}/`);
        setOrder(o);
        const its = await api.get<any[]>(`order-items/?order=${id}`);
        setItems(its);
        const ids = Array.from(new Set(its.map((it: any) => it.product)));
        const details = await Promise.all(ids.map((pid) => api.get<any>(`products/${pid}/`).catch(() => null)));
        const map: Record<number, any> = {};
        details.forEach((d) => { if (d && d.id) map[d.id] = d; });
        setProductMap(map);
        const pays = await api.get<any[]>("payments/");
        setPayments(pays.filter((p: any) => String(p.order) === String(id)));
        const invs = await api.get<any[]>("invoices/");
        setInvoices(invs.filter((p: any) => String(p.order) === String(id)));
        const shps = await api.get<any[]>("shipments/");
        setShipments(shps.filter((s: any) => String(s.order) === String(id)));
        const hs = await api.get<any[]>(`order-status-history/?order=${id}`);
        setHistory(hs);
      } catch {}
    };
    run();
  }, [id]);

  const updateShipmentStatus = async (shipmentId: number, status: string) => {
    setMsg(null);
    try {
      const payload: any = { status };
      const today = new Date().toISOString().slice(0, 10);
      if (status === "shipped") payload.shipped_date = today;
      if (status === "delivered") payload.delivered_date = today;
      await api.put(`shipments/${shipmentId}/`, payload);
      const shps = await api.get<any[]>("shipments/");
      setShipments(shps.filter((s: any) => String(s.order) === String(id)));
    } catch {
      setMsg("No tienes permisos para actualizar envíos o ocurrió un error");
    }
  };

  if (!order) {
    return (
      <Layout>
        <div className="text-center">Cargando...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pedido #{order.id}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Artículos</h2>
            <div className="space-y-3">
              {items.map((it) => {
                const p = productMap[it.product];
                const name = (p?.name || p?.title || p?.label || `Producto ${it.product}`);
                return (
                  <div key={it.id} className="flex justify-between">
                    <div className="text-gray-800">{name}</div>
                    <div className="text-gray-600">Cant: {it.quantity}</div>
                    <div className="font-medium">${Number(it.unit_price).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pagos</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="text-gray-800">Total del pedido</div>
                <div className="font-medium">${Number(displayTotal()).toFixed(2)}</div>
              </div>
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <div className="text-gray-800">{p.method}</div>
                  <div className="text-gray-600">{p.status}</div>
                  <div className="font-medium">${Number(p.amount).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Facturas</h2>
            <div className="space-y-2">
              {invoices.map((f) => (
                <div key={f.id} className="flex justify-between">
                  <div className="text-gray-800">{f.number}</div>
                  <div className="text-gray-600">{f.status}</div>
                  <div className="font-medium">${Number(f.total).toFixed(2)}</div>
                </div>
              ))}
              {invoices.length === 0 && <div className="text-gray-600">Sin facturas</div>}
              <div className="mt-3">
                <button onClick={requestInvoice} disabled={invoices.some((f: any) => f.status !== 'void')} className={`px-4 py-2 rounded ${invoices.some((f: any) => f.status !== 'void') ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white'}`}>Solicitar factura</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Envíos</h2>
            <div className="space-y-3">
              {shipments.map((s) => (
                <div key={s.id} className="border border-gray-200 rounded p-3">
                  <div className="font-medium">Tracking: {s.tracking_number || 'N/A'}</div>
                </div>
              ))}
              {shipments.length === 0 && <div className="text-gray-600">Sin envíos</div>}
              {msg && <div className="text-sm text-red-600 mt-2">{msg}</div>}
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Estado del Pedido</h2>
            <div className="flex items-center gap-6 justify-center py-6">
              {(() => {
                // Estados y sus iconos y nombres en español
                const iconSize = 80;
                const steps = [
                  { key: 'pending', label: 'Procesando pago' },
                  { key: 'paid', label: 'Pago confirmado' },
                  { key: 'preparing', label: 'Preparando envío' },
                  { key: 'shipped', label: 'Envío en camino' },
                  { key: 'delivered', label: 'Entregado' },
                ];
                const cancelStep = { key: 'cancelled', label: 'Pedido cancelado' };
                // Estado actual
                let current = order.status;
                // Si el pedido está pagado, revisar el estado del envío
                if (current === 'paid' && shipments && shipments.length > 0) {
                  const shipmentStatus = shipments[0].status;
                  if (["preparing", "shipped", "delivered", "cancelled"].includes(shipmentStatus)) {
                    current = shipmentStatus;
                  }
                }
                // Si cancelado, todos rojos y mostrar cancelado al final
                if (current === 'cancelled') {
                  return <div className="flex items-center gap-6">{
                    steps.map((step, idx) => (
                      <div key={step.key} className="flex flex-col items-center">
                        <div style={{width:iconSize, height:iconSize}} className="bg-red-500 rounded-full flex items-center justify-center"></div>
                        <span className="text-xs text-red-600 mt-2">{step.label}</span>
                        {idx < steps.length - 1 && <div className="w-8 h-1 bg-red-300 mx-1" />}
                      </div>
                    ))
                  }
                  <div className="flex flex-col items-center">
                    <div style={{width:iconSize, height:iconSize}} className="bg-red-500 rounded-full flex items-center justify-center"></div>
                    <span className="text-xs text-red-600 mt-2">{cancelStep.label}</span>
                  </div>
                  </div>;
                }
                // Si no cancelado, iluminar hasta el estado actual
                const idx = steps.findIndex(s => s.key === current);
                return steps.map((step, i) => (
                  <div key={step.key} className="flex flex-col items-center">
                    <div style={{width:iconSize, height:iconSize}} className={`${i <= idx ? 'bg-green-500' : 'bg-gray-300'} rounded-full flex items-center justify-center`}></div>
                    <span className={`text-xs mt-2 ${i <= idx ? 'text-green-600' : 'text-gray-500'}`}>{step.label}</span>
                    {i < steps.length - 1 && <div className={`w-8 h-1 ${i < idx ? 'bg-green-300' : 'bg-gray-300'} mx-1`} />}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetails;
