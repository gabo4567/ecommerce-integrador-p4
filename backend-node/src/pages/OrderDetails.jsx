import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { formatMoney } from "../lib/utils";

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState(null);
  const statusText = (s) => {
    if (s === 'pending') return 'En espera';
    if (s === 'paid') return 'Pagado';
    if (s === 'void') return 'Anulado';
    return s;
  };
  const statusHelp = (s) => {
    if (s === 'pending') return 'Carrito abierto sin confirmar ni pagar';
    if (s === 'paid') return 'Pedido abonado';
    if (s === 'void') return 'Pedido anulado';
    return '';
  };
  const paymentHelp = (s) => {
    if (s === 'pending') return 'Pago registrado, en revisión';
    if (s === 'approved') return 'Pago aprobado';
    if (s === 'rejected') return 'Pago rechazado';
    return '';
  };
  const invoiceHelp = (s) => {
    if (s === 'pending') return 'Factura emitida pendiente de pago';
    if (s === 'paid') return 'Factura saldada';
    if (s === 'void') return 'Factura anulada';
    return '';
  };
  const shipmentHelp = (s) => {
    if (s === 'preparing') return 'Preparando paquete';
    if (s === 'shipped') return 'Despachado al transportista';
    if (s === 'delivered') return 'Entregado';
    if (s === 'cancelled') return 'Envío cancelado';
    return '';
  };

  const computedItemsTotal = () => {
    return items.reduce((acc, it) => acc + Number(it.unit_price || 0) * Number(it.quantity || 0), 0);
  };

  const displayTotal = () => {
    const orderTotal = Number(order?.total || 0);
    if (orderTotal > 0) return orderTotal;
    const itemsTotal = computedItemsTotal();
    if (itemsTotal > 0) return Number(itemsTotal || 0);
    const approved = payments.filter((p) => String(p.order) === String(order?.id) && p.status === 'approved').reduce((acc, p) => acc + Number(p.amount || 0), 0);
    if (approved > 0) return approved;
    const allPayments = payments.filter((p) => String(p.order) === String(order?.id)).reduce((acc, p) => acc + Number(p.amount || 0), 0);
    return allPayments;
  };

  const requestInvoice = async () => {
    if (!order) return;
    setMsg(null);
    try {
      const existing = invoices.filter((p) => String(p.order) === String(order.id) && p.status !== 'void');
      if (existing.length > 0) { setMsg('Ya existe una factura para este pedido'); return; }
      const number = `INV-${order.id}-${Date.now()}`;
      const orderTotal = displayTotal();
      const approvedAmount = payments.filter((p) => String(p.order) === String(order.id) && p.status === 'approved').reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const sumAllPayments = payments.filter((p) => String(p.order) === String(order.id)).reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const paidEnough = approvedAmount >= orderTotal || order.status === 'paid' || sumAllPayments >= orderTotal;
      const lastApproved = payments.filter((p) => String(p.order) === String(order.id) && p.status === 'approved').sort((a, b) => (new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()))[0];
      const method = lastApproved?.method || payments[0]?.method || 'unknown';
      await api.post("invoices/", { order: order.id, number, issue_date: new Date().toISOString().slice(0,10), total: Number(orderTotal.toFixed(2)), payment_method: method, status: paidEnough ? 'paid' : 'pending' });
      const invs = await api.get("invoices/");
      setInvoices(invs.filter((p) => String(p.order) === String(order.id)));
    } catch {
      setMsg('No se pudo solicitar la factura');
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setMsg(null);
      try {
        const o = await api.get(`orders/${id}/`);
        setOrder(o);
        const its = await api.get(`order-items/?order=${id}`);
        setItems(its);
        const ids = Array.from(new Set(its.map((it) => it.product)));
        const details = await Promise.all(ids.map((pid) => api.get(`products/${pid}/`).catch(() => null)));
        const map = {};
        details.forEach((d) => { if (d && d.id) map[d.id] = d; });
        setProductMap(map);
        const pays = await api.get("payments/");
        setPayments(pays.filter((p) => String(p.order) === String(id)));
        const invs = await api.get("invoices/");
        setInvoices(invs.filter((p) => String(p.order) === String(id)));
        const shps = await api.get("shipments/");
        setShipments(shps.filter((s) => String(s.order) === String(id)));
        const hs = await api.get(`order-status-history/?order=${id}`);
        setHistory(hs);
      } catch {}
    };
    run();
  }, [id]);

  const updateShipmentStatus = async (shipmentId, status) => {
    setMsg(null);
    try {
      const payload = { status };
      const today = new Date().toISOString().slice(0, 10);
      if (status === "shipped") payload.shipped_date = today;
      if (status === "delivered") payload.delivered_date = today;
      await api.put(`shipments/${shipmentId}/`, payload);
      const shps = await api.get("shipments/");
      setShipments(shps.filter((s) => String(s.order) === String(id)));
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
          <p className="text-gray-600">Estado: {statusText(order.status)}</p>
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
                    <div className="font-medium">${formatMoney(Number(it.unit_price))}</div>
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
                <div className="font-medium">${formatMoney(Number(displayTotal()))}</div>
              </div>
              {statusHelp(order.status) && (<div className="text-xs text-gray-500">{statusHelp(order.status)}</div>)}
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <div className="text-gray-800">{p.method}</div>
                  <div className="text_gray-600">{p.status}</div>
                  <div className="font-medium">${formatMoney(Number(p.amount))}</div>
                </div>
              ))}
              {payments.map((p) => (<div key={`ph-${p.id}`} className="text-xs text-gray-500">{paymentHelp(p.status)}</div>))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Facturas</h2>
            <div className="space-y-2">
              {invoices.map((f) => (
                <div key={f.id} className="flex justify_between">
                  <div className="text-gray-800">{f.number}</div>
                  <div className="text-gray-600">{f.status}</div>
                  <div className="font-medium">${formatMoney(Number(f.total))}</div>
                </div>
              ))}
              {invoices.map((f) => (<div key={`ih-${f.id}`} className="text-xs text-gray-500">{invoiceHelp(f.status)}</div>))}
              {invoices.length === 0 && <div className="text-gray-600">Sin facturas</div>}
              <div className="mt-3">
                <button onClick={requestInvoice} disabled={invoices.some((f) => f.status !== 'void')} className={`px-4 py-2 rounded ${invoices.some((f) => f.status !== 'void') ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white'}`}>Solicitar factura</button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Envíos</h2>
            <div className="space-y-3">
              {shipments.map((s) => (
                <div key={s.id} className="border border-gray-200 rounded p-3">
                  <div className="font-medium">Tracking: {s.tracking_number || 'N/A'}</div>
                  <div className="text-gray-600">Estado: {s.status}</div>
                  {shipmentHelp(s.status) && <div className="text-xs text-gray-500">{shipmentHelp(s.status)}</div>}
                  <div className="text-gray-600">Carrier: {s.carrier}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => updateShipmentStatus(s.id, 'shipped')} className="px-3 py-1 bg-blue-600 text-white rounded">Marcar enviado</button>
                    <button onClick={() => updateShipmentStatus(s.id, 'delivered')} className="px-3 py-1 bg-green-600 text_white rounded">Marcar entregado</button>
                  </div>
                </div>
              ))}
              {shipments.length === 0 && <div className="text-gray-600">Sin envíos</div>}
              {msg && <div className="text-sm text-red-600 mt-2">{msg}</div>}
            </div>
          </div>
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Historial del Pedido</h2>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex justify_between">
                  <div className="text-gray-800">{h.old_status} → {h.new_status}</div>
                  <div className="text-gray-600">{new Date(h.changed_at).toLocaleString()}</div>
                </div>
              ))}
              {history.length === 0 && <div className="text-gray-600">Sin historial</div>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetails;

