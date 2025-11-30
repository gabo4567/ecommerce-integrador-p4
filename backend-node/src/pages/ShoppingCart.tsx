import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useCartStore } from "../store/cart";
import { useNavigate } from "react-router-dom";

const ShoppingCart: React.FC = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [appliedDiscounts, setAppliedDiscounts] = useState<any[]>([]);

  // Nueva función para desaplicar descuento
  const removeDiscount = async (discountId: number) => {
    if (!orderId) return;
    try {
      await api.del(`order-discounts/${discountId}/`);
      await fetchAppliedDiscounts();
    } catch (e) {
      setPromoMessage("No se pudo eliminar el descuento");
    }
  };

  // Obtiene los descuentos aplicados con nombre
  const fetchAppliedDiscounts = async () => {
    if (!orderId) return;
    try {
      const ods = await api.get<any[]>(`order-discounts/?order=${orderId}`);
      if (ods.length === 0) { setAppliedDiscounts([]); return; }
      const discounts = await api.get<any[]>("discounts/");
      const mapped = ods.map((od: any) => {
        const d = discounts.find((x: any) => x.id === od.discount);
        return {
          ...od,
          discountName: d ? d.name : `ID ${od.discount}`,
          discountPercentage: d ? Number(d.percentage) : 0
        };
      });
      setAppliedDiscounts(mapped);
    } catch {}
  };
  const access = useAuthStore((s) => s.accessToken);
  const refreshCart = useCartStore((s) => s.refreshCount);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      if (!access) return;
      try {
        const orders = await api.get<any[]>("orders/");
        let pending = orders.find((o: any) => o.status === "pending");
        if (!pending) pending = await api.post<any>("orders/", {});
        setOrderId(pending.id);
        const items = await api.get<any[]>(`order-items/?order=${pending.id}`);
        const products = await api.get<any[]>("products/");
        const mapped = items.map((it: any) => {
          const p = products.find((x: any) => x.id === it.product) || {};
          return {
            id: it.id,
            productId: it.product,
            name: p.name || `Producto ${it.product}`,
            price: Number(it.unit_price),
            quantity: it.quantity,
            image: (p.images && p.images[0]?.url) || "/favicon.svg",
          };
        });
        setCartItems(mapped);
        await fetchAppliedDiscounts();
      } catch {}
    };
    run();
  }, [access, orderId]);

  const updateQuantity = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(items => items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    try {
      const item = cartItems.find(i => i.id === id);
      if (item) await api.put(`order-items/${id}/`, { order: orderId, product: item.productId, quantity: newQuantity, unit_price: item.price });
      await refreshCart();
    } catch {}
  };

  const removeItem = async (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
    try { await api.del(`order-items/${id}/`); await refreshCart(); } catch {}
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = appliedDiscounts
    .map((od: any) => ((subtotal * (od.discountPercentage || 0)) / 100))
    .reduce((a, b) => a + b, 0);
  const shipping = subtotal > 100 ? 0 : 15.99;
  const tax = (subtotal - discountAmount) * 0.21;
  const total = subtotal - discountAmount + shipping + tax;

  const applyDiscount = async () => {
    setPromoMessage(null);
    if (!orderId) { setPromoMessage("No hay pedido activo"); return; }
    if (!promoCode.trim()) { setPromoMessage("Ingresa un código válido"); return; }
    try {
      const discounts = await api.get<any[]>("discounts/");
      const d = discounts.find((x: any) => String(x.name).toLowerCase() === promoCode.trim().toLowerCase() && x.active);
      if (!d) { setPromoMessage("Código no válido"); return; }
      await api.post("order-discounts/", { order: orderId, discount: d.id });
      await fetchAppliedDiscounts();
    } catch (e) {
      setPromoMessage("Descuento ya aplicado");
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Carrito de Compras</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-500 mb-8">¡Agrega algunos productos para comenzar!</p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Continuar Comprando
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Productos ({cartItems.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {item.name}
                          </h3>
                          <div className="text-sm text-gray-600 mb-2">
                            {item.color && <span>Color: {item.color}</span>}
                            {item.storage && <span className="ml-2">Almacenamiento: {item.storage}</span>}
                            {item.size && <span className="ml-2">Tamaño: {item.size}</span>}
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">Cantidad:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-2 hover:bg-gray-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 border-l border-r border-gray-300 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-2 hover:bg-gray-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-lg font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  ← Continuar Comprando
                </button>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Resumen del Pedido
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscounts.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuentos</span>
                      <span className="font-medium text-green-700">
                        -$
                        {appliedDiscounts
                          .map((od: any) => {
                            // Si tienes el porcentaje en od.discount.percentage, úsalo. Si no, ajusta según tu estructura.
                            const percentage = od.discount && od.discount.percentage
                              ? Number(od.discount.percentage)
                              : (od.discountPercentage || 0);
                            return ((subtotal * percentage) / 100);
                          })
                          .reduce((a, b) => a + b, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impuesto (21%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <button onClick={() => { if (!access) { navigate('/login'); return; } navigate('/checkout'); }} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2">
                  <span>Proceder al Pago</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    {shipping === 0 ? '¡Has calificado para envío gratis!' : `Agrega $${(100 - subtotal).toFixed(2)} más para envío gratis`}
                  </p>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-green-600">✓</span>
                    <span className="font-medium text-green-800">Compra Segura</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Tu información está protegida con encriptación SSL de 256-bit
                  </p>
                </div>
              </div>
              
              {/* Promo Code */}
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h3 className="font-semibold text-gray-800 mb-4">Código de Descuento</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Ingresa tu código"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={applyDiscount} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                    Aplicar
                  </button>
                </div>
                {promoMessage && (
                  <p className="mt-2 text-sm text-gray-700">{promoMessage}</p>
                )}
                {appliedDiscounts.length > 0 && (
                  <div className="mt-3 text-sm text-gray-700">
                    <div className="font-medium">Descuentos aplicados:</div>
                    <ul className="list-disc list-inside">
                      {appliedDiscounts.map((od: any) => (
                        <li key={od.id} className="flex items-center justify-between">
                          <span>Descuento: {od.discountName}</span>
                          <button
                            className="ml-2 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200 bg-red-50"
                            onClick={() => removeDiscount(od.id)}
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShoppingCart;
