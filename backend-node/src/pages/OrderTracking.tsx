import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Package, Truck, CheckCircle, Clock, MapPin, Calendar, Search, ArrowRight } from 'lucide-react';
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";

const OrderTracking: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderFound, setOrderFound] = useState(false);
  const [shipment, setShipment] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const access = useAuthStore((s) => s.accessToken);

  const orderData = shipment ? {
    orderNumber: String(shipment.order),
    trackingNumber: shipment.tracking_number,
    status: shipment.status,
    estimatedDelivery: shipment.delivered_date || '',
    currentLocation: '',
    carrier: shipment.carrier,
    shippingMethod: shipment.address,
    totalAmount: 0,
    items: [],
    trackingHistory: history.map((h: any) => ({
      date: new Date(h.changed_at).toLocaleString(),
      status: h.new_status,
      location: '',
      description: h.reason || '',
      completed: true,
    })),
  } : null;

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (!access) return;
    if (trackingNumber.trim()) {
      try {
        const shipments = await api.get<any[]>("shipments/");
        const s = shipments.find((x: any) => (x.tracking_number || "").toLowerCase() === trackingNumber.toLowerCase());
        if (!s) { setOrderFound(false); setShipment(null); setHistory([]); return; }
        setShipment(s);
        setOrderFound(true);
        const hs = await api.get<any[]>(`order-status-history/?order=${s.order}`);
        setHistory(hs);
      } catch {
        setOrderFound(false);
        setShipment(null);
        setHistory([]);
      }
    } else {
      setOrderFound(false);
      setShipment(null);
      setHistory([]);
    }
  };

  const getStatusIcon = (completed: boolean) => {
    if (completed) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    return <Clock className="h-6 w-6 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregado':
        return 'bg-green-100 text-green-800';
      case 'En tránsito':
      case 'En distribución local':
        return 'bg-blue-100 text-blue-800';
      case 'Pedido confirmado':
      case 'Pedido procesado':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
      case 'Pendiente':
        return 'bg-gray-100 text-gray-800';
      case 'paid':
      case 'Pagado':
        return 'bg-green-100 text-green-800';
      case 'preparing':
      case 'Preparando':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
      case 'Enviado':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
      case 'Entregado':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Seguimiento de Pedido</h1>
        
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleTrackOrder} className="space-y-4">
            <div>
              <label htmlFor="tracking" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Seguimiento
              </label>
              <div className="flex space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ingresa tu número de seguimiento (ej: TRK123456789)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>Buscar</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {searched && orderFound && orderData && (
          <div className="space-y-8">
            {/* Order Status Overview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Pedido #{orderData.orderNumber}
                  </h2>
                  <p className="text-gray-600">
                    Número de seguimiento: {orderData.trackingNumber}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full font-medium ${getStatusColor(orderData.status)}`}>
                  {(() => {
                    switch (orderData.status) {
                      case 'pending': return 'Pendiente';
                      case 'paid': return 'Pagado';
                      case 'preparing': return 'Preparando';
                      case 'shipped': return 'Enviado';
                      case 'delivered': return 'Entregado';
                      case 'cancelled': return 'Cancelado';
                      default: return orderData.status;
                    }
                  })()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Transportista</h3>
                  <p className="text-gray-600">{orderData.carrier}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Truck className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Método de Envío</h3>
                  <p className="text-gray-600">{orderData.shippingMethod}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Entrega Estimada</h3>
                  <p className="text-gray-600">{orderData.estimatedDelivery}</p>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Historial de Seguimiento
              </h2>
              
              <div className="relative">
                {orderData.trackingHistory.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 mb-8 last:mb-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.completed)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-1">
                        <h3 className="font-semibold text-gray-800">{
                          (() => {
                            switch (step.status) {
                              case 'pending': return 'Pendiente';
                              case 'paid': return 'Pagado';
                              case 'preparing': return 'Preparando';
                              case 'shipped': return 'Enviado';
                              case 'delivered': return 'Entregado';
                              case 'cancelled': return 'Cancelado';
                              default: return step.status;
                            }
                          })()
                        }</h3>
                        <span className="text-sm text-gray-500">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          {step.date}
                        </span>
                      </div>
                      {step.description && (
                        <p className="text-gray-600 mb-1">{step.description}</p>
                      )}
                      {/* Ubicación eliminada */}
                    </div>
                    {index < orderData.trackingHistory.length - 1 && (
                      <div className="absolute left-3 mt-12 w-px h-16 bg-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700">
                Contactar Soporte
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50">
                Imprimir Detalles
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50">
                Compartir Seguimiento
              </button>
            </div>
          </div>
        )}

        {searched && !orderFound && trackingNumber && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No se encontró el pedido
            </h2>
            <p className="text-gray-600 mb-4">
              Verifica que el número de seguimiento sea correcto e inténtalo de nuevo.
            </p>
            <p className="text-sm text-gray-500">
              El número de seguimiento debe tener el formato: TRK seguido de 9 dígitos.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderTracking;
