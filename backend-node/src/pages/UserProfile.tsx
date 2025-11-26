import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { User, Mail, Phone, MapPin, Calendar, Package, Heart, Settings, Edit3, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";

const UserProfile: React.FC = () => {
    // Estados para paginado y orden
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersPerPage] = useState(5);
    const [ordersOrder, setOrdersOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    joinDate: '',
    bio: ''
  });

  const [tempData, setTempData] = useState(userData);

  const [orders, setOrders] = useState<any[]>([]);
  const access = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    const run = async () => {
      if (!access) return;
      try {
        const os = await api.get<any[]>("orders/");
        setOrders(os);
        const me = await api.get<any>("users/me/");
        setUserData({
          firstName: me.first_name || '',
          lastName: me.last_name || '',
          email: me.email || '',
          phone: '',
          address: '',
          joinDate: '',
          bio: ''
        });
      } catch {}
    };
    run();
  }, [access]);

  // Mock wishlist items
  const wishlistItems = [
    {
      id: 1,
      name: 'MacBook Pro 16" M3 Max',
      price: 2499.99,
      originalPrice: 2899.99,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20laptop%20wishlist%20item%20premium&image_size=square'
    },
    {
      id: 2,
      name: 'iPad Pro 12.9" 6ta Generación',
      price: 1099.99,
      originalPrice: 1299.99,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Premium%20tablet%20wishlist%20item%20modern&image_size=square'
    }
  ];

  const handleEdit = () => {
    setIsEditing(true);
    setTempData(userData);
  };

  const handleSave = () => {
    setUserData(tempData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempData(userData);
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregado':
        return 'bg-green-100 text-green-800';
      case 'En tránsito':
        return 'bg-blue-100 text-blue-800';
      case 'Procesando':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const orderStatusHelp = (s: string) => {
    if (s.toLowerCase() === 'pending') return 'Carrito abierto sin confirmar';
    if (s.toLowerCase() === 'paid') return 'Pedido abonado';
    return '';
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {userData.firstName} {userData.lastName}
                </h1>
                <p className="text-gray-600">Miembro desde {userData.joinDate}</p>
                <p className="text-sm text-gray-500 mt-1">{userData.bio}</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Edit3 className="h-4 w-4" />
                <span>Editar Perfil</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', name: 'Perfil', icon: User },
                { id: 'orders', name: 'Pedidos', icon: Package },
                { id: 'wishlist', name: 'Favoritos', icon: Heart },
                { id: 'settings', name: 'Configuración', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={isEditing ? tempData.firstName : userData.firstName}
                      onChange={(e) => setTempData({ ...tempData, firstName: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={isEditing ? tempData.lastName : userData.lastName}
                      onChange={(e) => setTempData({ ...tempData, lastName: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={isEditing ? tempData.email : userData.email}
                      onChange={(e) => setTempData({ ...tempData, email: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={isEditing ? tempData.phone : userData.phone}
                      onChange={(e) => setTempData({ ...tempData, phone: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={isEditing ? tempData.address : userData.address}
                      onChange={(e) => setTempData({ ...tempData, address: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biografía
                  </label>
                  <textarea
                    value={isEditing ? tempData.bio : userData.bio}
                    onChange={(e) => setTempData({ ...tempData, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isEditing ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Mis Pedidos</h2>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="mr-2 text-sm text-gray-700">Ordenar:</label>
                    <select
                      value={ordersOrder}
                      onChange={e => setOrdersOrder(e.target.value as 'asc' | 'desc')}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="desc">Más nuevo primero</option>
                      <option value="asc">Más antiguo primero</option>
                    </select>
                  </div>
                  <div>
                    <button
                      className="px-3 py-1 border rounded mr-2"
                      disabled={ordersPage === 1}
                      onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                    >Anterior</button>
                    <span className="text-sm">Página {ordersPage}</span>
                    <button
                      className="px-3 py-1 border rounded ml-2"
                      disabled={ordersPage * ordersPerPage >= orders.length}
                      onClick={() => setOrdersPage(p => p + 1)}
                    >Siguiente</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {orders
                    .slice()
                    .sort((a, b) => ordersOrder === 'asc'
                      ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    .slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage)
                    .map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-800">Pedido #{order.id}</h3>
                            <p className="text-sm text-gray-600">
                              <Calendar className="inline h-4 w-4 mr-1" />
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            {orderStatusHelp(order.status) && (
                              <div className="text-xs text-gray-500">{orderStatusHelp(order.status)}</div>
                            )}
                            <p className="text-lg font-semibold text-gray-800 mt-1">
                              ${Number(order.total).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              <Package className="inline h-4 w-4 mr-1" />
                              {(order.items?.length ?? 0)} artículos
                            </div>
                            <div className="flex space-x-2">
                            <Link to={`/pedido/${order.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Ver Detalles
                            </Link>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Estado: {order.status}
                            </button>
                            </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Favoritos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">
                              ${item.price.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                          Agregar al Carrito
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                          <Heart className="h-5 w-5 text-red-500 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Configuración</h2>
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Notificaciones</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Administra tus preferencias de notificación
                    </p>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Notificaciones de pedidos</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Ofertas especiales</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Novedades de productos</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Privacidad</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Controla tu información personal y privacidad
                    </p>
                    <div className="space-y-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Descargar mis datos
                      </button>
                      <br />
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Eliminar cuenta
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
