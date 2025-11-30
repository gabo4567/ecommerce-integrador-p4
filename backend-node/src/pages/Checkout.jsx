import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { CreditCard, Truck, MapPin, User, Mail, Phone } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatMoney, FREE_SHIPPING_THRESHOLD } from "../lib/utils";
import { useAuthStore } from "../store/auth";
import { useCartStore } from "../store/cart";

const Checkout = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [addressLine, setAddressLine] = useState('');
  const [addressApt, setAddressApt] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressProvince, setAddressProvince] = useState('');
  const [addressPostal, setAddressPostal] = useState('');

  const steps = [
    { id: 1, name: 'Información', completed: activeStep > 1 },
    { id: 2, name: 'Envío', completed: activeStep > 2 },
    { id: 3, name: 'Pago', completed: activeStep > 3 },
    { id: 4, name: 'Confirmación', completed: activeStep > 4 }
  ];

  const [orderItems, setOrderItems] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [message, setMessage] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState(null);
  const [invoiceMessage, setInvoiceMessage] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState(null);
  const [confirmDisabled, setConfirmDisabled] = useState(false);
  const navigate = useNavigate();
  const refreshCart = useCartStore((s) => s.refreshCount);
  const access = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    const run = async () => {
      if (!access) return;
      try {
        const me = await api.get("users/me/");
        const orders = await api.get("orders/");
        const pending = orders.find((o) => o.status === "pending" && o.user === me.id);
        if (!pending) return;
        setOrderId(pending.id);
        const items = await api.get(`order-items/?order=${pending.id}`);
        const products = await api.get("products/");
        const mapped = items.map((it) => {
          const p = products.find((x) => x.id === it.product) || {};
          return {
            id: it.id,
            name: p.name || `Producto ${it.product}`,
            price: Number(it.unit_price),
            quantity: it.quantity,
            image: (p.images && p.images[0]?.url) || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23f3f4f6'/><circle cx='50' cy='50' r='30' fill='%23e5e7eb'/></svg>",
          };
        });
        setOrderItems(mapped);
      } catch {}
    };
    run();
  }, [access]);

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const placeOrder = async () => {
    setMessage(null);
    if (!orderId) return;
    try {
      await api.post("payments/", { order: orderId, payment_date: new Date().toISOString().slice(0,10), amount: Number(total.toFixed(2)), method: paymentMethod, status: "pending", transaction_id: "" });
      setMessage("Pago registrado correctamente");
    } catch {
      setMessage("No se pudo registrar el pago");
    }
  };

  const generateInvoice = async () => {
    setInvoiceNumber(null);
    setInvoiceMessage(null);
    if (!orderId) return;
    try {
      const number = `INV-${orderId}-${Date.now()}`;
      const inv = await api.post("invoices/", { order: orderId, number, issue_date: new Date().toISOString().slice(0,10), total: Number(total.toFixed(2)), payment_method: paymentMethod, status: "pending" });
      setInvoiceNumber(inv.number);
      setInvoiceMessage("Factura generada");
    } catch {
      setInvoiceMessage("No se pudo generar la factura");
    }
  };

  const createShipment = async () => {
    if (!orderId) return;
    const fullAddress = [addressLine, addressApt, addressCity, addressProvince, addressPostal].filter(Boolean).join(', ');
    const tracking = `TRK${Date.now()}`;
    try {
      try { await api.put(`orders/${orderId}/`, { status: 'paid' }); } catch {}
      const shipment = await api.post("shipments/", { order: orderId, address: fullAddress || 'Sin dirección', carrier: 'Feraytek Logistics', tracking_number: tracking, status: 'preparing' });
      setTrackingNumber(shipment.tracking_number);
      setConfirmDisabled(true);
      setMessage(`¡Gracias por tu compra! Tu número de seguimiento es ${shipment.tracking_number}`);
      setActiveStep(4);
      await refreshCart();
    } catch {
      setConfirmDisabled(true);
      try { await api.put(`orders/${orderId}/`, { status: 'paid' }); } catch {}
      try {
        const ticket = await api.post("support-tickets/", {
          subject: `Solicitud de envío para pedido ${orderId}`,
          message: `Compra confirmada. Generar envío. Dirección: ${fullAddress || 'Sin dirección'}, carrier: Feraytek Logistics, tracking sugerido: ${tracking}.`,
        });
        setMessage(`Compra confirmada. Ticket #${ticket.id} creado para generar el tracking.`);
      } catch {
        setMessage("Compra confirmada. No se pudo crear el ticket de soporte para el envío.");
      }
      setActiveStep(4);
      await refreshCart();
    }
  };

  if (!access) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Necesitas iniciar sesión</h1>
          <p className="text-gray-600">Inicia sesión para continuar con el pago.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Finalizar Compra</h1>
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${activeStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{step.completed ? '✓' : step.id}</div>
                  <span className={`ml-2 font-medium ${activeStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>{step.name}</span>
                </div>
                {index < steps.length - 1 && (<div className={`w-24 h-1 mx-4 ${activeStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />)}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeStep === 1 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center"><User className="h-5 w-5 mr-2" />Información de Contacto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Juan" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Pérez" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input type="email" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="tu@email.com" />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input type="tel" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 234 567 8900" />
                  </div>
                </div>
                <button onClick={() => setActiveStep(2)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Continuar con el Envío</button>
              </div>
            )}
            {activeStep === 2 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center"><Truck className="h-5 w-5 mr-2" />Dirección de Envío</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                    <input type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Calle Principal 123" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apartamento/Oficina (Opcional)</label>
                    <input type="text" value={addressApt} onChange={(e) => setAddressApt(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Apto 4B" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                    <input type="text" value={addressCity} onChange={(e) => setAddressCity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ciudad" />
                  </div>
                  <div>
                    <label className="block text_sm font-medium text-gray-700 mb-2">Estado/Provincia</label>
                    <input type="text" value={addressProvince} onChange={(e) => setAddressProvince(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Estado" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                    <input type="text" value={addressPostal} onChange={(e) => setAddressPostal(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="12345" />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="flex items-center"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="ml-2 text-sm text-gray-600">Guardar esta dirección para futuros pedidos</span></label>
                </div>
                <div className="flex space-x-4">
                  <button onClick={() => setActiveStep(1)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50">Volver</button>
                  <button onClick={() => setActiveStep(3)} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Continuar con el Pago</button>
                </div>
              </div>
            )}
            {activeStep === 3 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center"><CreditCard className="h-5 w-5 mr-2" />Método de Pago</h2>
                <div className="space-y-4 mb-6">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"><input type="radio" name="payment" value="credit-card" checked={paymentMethod === 'credit-card'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-blue-600 focus:ring-blue-500" /><span className="ml-3 font-medium">Tarjeta de Crédito</span></label>
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"><input type="radio" name="payment" value="paypal" checked={paymentMethod === 'paypal'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-blue-600 focus:ring-blue-500" /><span className="ml-3 font-medium">PayPal</span></label>
                </div>
                <div className="flex space-x-4">
                  <button onClick={() => setActiveStep(2)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50">Volver</button>
                  <button onClick={generateInvoice} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Generar Factura</button>
                </div>
                {(invoiceMessage || invoiceNumber) && (
                  <div className="mt-4 text-center">
                    {invoiceMessage && <p className="text-sm text-gray-700">{invoiceMessage}</p>}
                    {invoiceNumber && <div className="text-sm font_medium text-gray-800">N° Factura: {invoiceNumber}</div>}
                  </div>
                )}
                <div className="mt-4">
                  <button disabled={confirmDisabled} onClick={createShipment} className={`w-full py-3 rounded-lg font-semibold ${confirmDisabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>Confirmar compra y generar Tracking</button>
                </div>
              </div>
            )}
            {activeStep === 4 && (
              <div className="bg_white rounded-lg shadow-md p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Confirmación</h2>
                <p className="text-gray-700">{message || 'Compra confirmada'}</p>
                {trackingNumber && (
                  <div className="mt-4 p-4 border border-green-300 bg-green-50 rounded-lg">
                    <div className="text-green-700 font-semibold">Gracias por tu compra</div>
                    <div className="mt-1 text-2xl font-bold text-green-800">Tracking: {trackingNumber}</div>
                  </div>
                )}
                <div className="mt-6"><button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">Volver al inicio</button></div>
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Resumen del Pedido</h2>
              <div className="space-y-4 mb-6">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</h4>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">${formatMoney(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify_between"><span className="text-gray-600">Subtotal</span><span>${formatMoney(subtotal)}</span></div>
                <div className="flex justify_between"><span className="text-gray-600">Envío</span><span>${formatMoney(shipping)}</span></div>
                <div className="flex justify_between"><span className="text-gray-600">Impuesto</span><span>${formatMoney(tax)}</span></div>
                <hr className="border-gray-200" />
                <div className="flex justify_between text-lg font-semibold"><span>Total</span><span>${formatMoney(total)}</span></div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg"><div className="flex items-center space-x-2 mb-2"><span className="text-green-600">✓</span><span className="font-medium text-green-800">Compra Segura</span></div><p className="text-sm text-green-700">Tu información está protegida con encriptación SSL de 256-bit</p></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

