import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { User, Mail, Phone, MapPin, Calendar, Package, Heart, Settings, Edit3, Save, X } from 'lucide-react'
import { getFavorites, toggleFavorite, getProductImageCandidates, advanceImageFallback, statusLabel, norm, formatMoney, addGuestCartItem, displayProductName } from "../lib/utils"
import { Link, useNavigate } from 'react-router-dom'
import { api } from "../api/client"
import { useCartStore } from "../store/cart"
import { useAuthStore } from "../store/auth"
import ConfirmDialog from '../components/ConfirmDialog'

export default function UserProfile() {
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPerPage] = useState(5)
  const [ordersOrder, setOrdersOrder] = useState('desc')
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', joinDate: '', bio: '' })
  const [tempData, setTempData] = useState(userData)
  const [orders, setOrders] = useState([])
  const access = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const refreshCart = useCartStore((s) => s.refreshCount)
  const [favorites, setFavorites] = useState([])
  const [confirmUnfav, setConfirmUnfav] = useState({ open: false, product: null })
  const [confirmDownload, setConfirmDownload] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteAccountMsg, setDeleteAccountMsg] = useState(null)
  const [favCartMessage, setFavCartMessage] = useState({ id: null, text: '' })

  useEffect(() => {
    const run = async () => {
      if (!access) return
      try {
        const [ordersRes, meRes] = await Promise.all([ api.get("orders/"), api.get("users/me/") ])
        setOrders(Array.isArray(ordersRes) ? ordersRes : [])
        if (meRes) {
          setUserData({
            firstName: meRes.first_name || '',
            lastName: meRes.last_name || '',
            email: meRes.email || '',
            phone: meRes.phone || '',
            address: meRes.address || '',
            joinDate: meRes.date_joined ? new Date(meRes.date_joined).toLocaleDateString() : '',
            bio: ''
          })
        }
      } catch {}
    }
    run()
  }, [access])

  useEffect(() => {
    const loadFavorites = async () => {
      const favIds = getFavorites()
      if (!favIds.length) { setFavorites([]); return }
      try {
        const prods = await api.get("products/")
        setFavorites((prods || []).filter(p => favIds.includes(p.id)))
      } catch {}
    }
    loadFavorites()
  }, [])

  const handleEdit = () => { setActiveTab('profile'); setIsEditing(true); setTempData(userData) }
  const handleSave = async () => {
    try {
      const payload = { first_name: tempData.firstName, last_name: tempData.lastName, email: tempData.email, phone: tempData.phone, address: tempData.address }
      const me = await api.put("users/me/", payload)
      setUserData({ firstName: me.first_name || '', lastName: me.last_name || '', email: me.email || '', phone: me.phone || '', address: me.address || '', joinDate: me.date_joined ? new Date(me.date_joined).toLocaleDateString() : userData.joinDate, bio: tempData.bio })
      setIsEditing(false)
    } catch {}
  }
  const handleCancel = () => { setTempData(userData); setIsEditing(false) }

  const getStatusColor = (status) => { switch (norm(status)) { case 'delivered': return 'bg-green-100 text-green-800'; case 'shipped': return 'bg-blue-100 text-blue-800'; case 'preparing': return 'bg-yellow-100 text-yellow-800'; case 'cancelled': return 'bg-red-100 text-red-800'; case 'paid': return 'bg-green-100 text-green-800'; case 'pending': return 'bg-yellow-100 text-yellow-800'; default: return 'bg-gray-100 text-gray-800'; } }
  const orderStatusHelp = (s) => { if (s.toLowerCase() === 'pending') return 'Carrito abierto sin confirmar'; if (s.toLowerCase() === 'paid') return 'Pedido abonado'; return '' }

  const downloadMyData = async () => {
    if (!access) return
    try {
      const me = await api.get("users/me/")
      const blob = new Blob([JSON.stringify(me, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mis-datos-${(me.username || 'usuario')}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const addFavoriteToCart = async (p) => {
    try {
      if (access) {
        const me = await api.get("users/me/")
        const orders = await api.get("orders/")
        let pending = (orders || []).find((o) => o.status === "pending" && o.user === me.id)
        if (!pending) pending = await api.post("orders/", {})
        const items = await api.get(`order-items/?order=${pending.id}`)
        const existingQty = (items || []).filter(it => Number(it.product) === Number(p.id)).reduce((sum, it) => sum + Number(it.quantity || 0), 0)
        const stock = Number(p.stock ?? 0)
        if (stock > 0 && existingQty >= stock) { setFavCartMessage({ id: p.id, text: 'Stock insuficiente' }); setTimeout(() => setFavCartMessage({ id: null, text: '' }), 1800); return }
        await api.post("order-items/", { order: pending.id, product: p.id, quantity: 1, unit_price: p.price })
      } else {
        addGuestCartItem(p.id, Number(p.price) || 0, 1)
      }
      await refreshCart()
      setFavCartMessage({ id: p.id, text: 'Producto agregado al carrito' })
      setTimeout(() => setFavCartMessage({ id: null, text: '' }), 1800)
    } catch {}
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{userData.firstName} {userData.lastName}</h1>
                <p className="text-gray-600">Miembro desde {userData.joinDate}</p>
                <p className="text-sm text-gray-500 mt-1">{userData.bio}</p>
              </div>
            </div>
            {!isEditing ? (
              <button onClick={handleEdit} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Edit3 className="h-4 w-4" />
                <span>Editar Perfil</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button onClick={handleSave} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  <Save className="h-4 w-4" />
                  <span>Guardar</span>
                </button>
                <button onClick={handleCancel} className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[{ id: 'profile', name: 'Perfil', icon: User }, { id: 'orders', name: 'Pedidos', icon: Package }, ...(role === 'admin' ? [] : [{ id: 'wishlist', name: 'Favoritos', icon: Heart }]), { id: 'settings', name: 'Configuración', icon: Settings }].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input type="text" value={isEditing ? tempData.firstName : userData.firstName} onChange={(e) => setTempData({ ...tempData, firstName: e.target.value })} disabled={!isEditing} className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                    <input type="text" value={isEditing ? tempData.lastName : userData.lastName} onChange={(e) => setTempData({ ...tempData, lastName: e.target.value })} disabled={!isEditing} className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input type="email" value={isEditing ? tempData.email : userData.email} onChange={(e) => setTempData({ ...tempData, email: e.target.value })} disabled={!isEditing} className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input type="tel" value={isEditing ? tempData.phone : userData.phone} onChange={(e) => setTempData({ ...tempData, phone: e.target.value })} disabled={!isEditing} className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input type="text" value={isEditing ? tempData.address : userData.address} onChange={(e) => setTempData({ ...tempData, address: e.target.value })} disabled={!isEditing} className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Biografía</label>
                  <textarea value={isEditing ? tempData.bio : userData.bio} onChange={(e) => setTempData({ ...tempData, bio: e.target.value })} disabled={!isEditing} rows={3} className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-gray-50' : ''}`} />
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Mis Pedidos</h2>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="mr-2 text-sm text-gray-700">Ordenar:</label>
                    <select value={ordersOrder} onChange={e => setOrdersOrder(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                      <option value="desc">Más nuevo primero</option>
                      <option value="asc">Más antiguo primero</option>
                    </select>
                  </div>
                  <div>
                    <button className="px-3 py-1 border rounded mr-2" disabled={ordersPage === 1} onClick={() => setOrdersPage(p => Math.max(1, p - 1))}>Anterior</button>
                    <span className="text-sm">Página {ordersPage}</span>
                    <button className="px-3 py-1 border rounded ml-2" disabled={ordersPage * ordersPerPage >= orders.length} onClick={() => setOrdersPage(p => p + 1)}>Siguiente</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {orders.slice().sort((a, b) => ordersOrder === 'asc' ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage).map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800">Pedido #{order.id}</h3>
                          <p className="text-sm text-gray-600"><Calendar className="inline h-4 w-4 mr-1" />{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>{statusLabel(order.status)}</span>
                          {orderStatusHelp(order.status) && (<div className="text-xs text-gray-500">{orderStatusHelp(order.status)}</div>)}
                          <p className="text-lg font-semibold text-gray-800 mt-1">${formatMoney(Number(order.total))}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600"><Package className="inline h-4 w-4 mr-1" />{(order.items?.length ?? 0)} artículos</div>
                        <div className="flex space-x-2">
                          <Link to={`/pedido/${order.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver Detalles</Link>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Estado: {statusLabel(order.status)}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && role !== 'admin' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Favoritos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favorites.map((item) => (
                    <Link to={`/producto/${item.id}`} key={item.id} className="border border-gray-200 rounded-lg p-4 block hover:shadow">
                      <div className="flex items-center space-x-4">
                        <img src={getProductImageCandidates(item)[0]} data-candidates={JSON.stringify(getProductImageCandidates(item))} data-idx={0} onError={advanceImageFallback} alt={displayProductName(item)} className="w-20 h-20 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{displayProductName(item)}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">${formatMoney(Number(item.price))}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); addFavoriteToCart(item);}}>Agregar al Carrito</button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setConfirmUnfav({ open: true, product: item }); }}>
                          <Heart className="h-5 w-5 text-red-500 fill-current" />
                          <span className="ml-2 text-sm">Quitar</span>
                        </button>
                      </div>
                      {favCartMessage.id === item.id && (<div className="mt-2 text-xs text-green-600">{favCartMessage.text}</div>)}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Configuración</h2>
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Notificaciones</h3>
                    <p className="text-sm text-gray-600 mb-4">Administra tus preferencias de notificación</p>
                    <div className="space-y-3">
                      <label className="flex items-center"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked /><span className="ml-2 text-sm text-gray-700">Notificaciones de pedidos</span></label>
                      <label className="flex items-center"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked /><span className="ml-2 text-sm text-gray-700">Ofertas especiales</span></label>
                      <label className="flex items-center"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="ml-2 text-sm text-gray-700">Novedades de productos</span></label>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Privacidad</h3>
                    <p className="text-sm text-gray-600 mb-4">Controla tu información personal y privacidad</p>
                    <div className="space-y-2">
                      <button onClick={() => setConfirmDownload(true)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Descargar mis datos</button>
                      <br />
                      <button onClick={() => { setDeleteAccountMsg(null); setConfirmDelete(true); }} className="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar cuenta</button>
                      {deleteAccountMsg && (<div className="text-sm text-gray-700 mt-2">{deleteAccountMsg}</div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ConfirmDialog open={confirmUnfav.open} title="Quitar de favoritos" message={`¿Estás seguro de desmarcar ${confirmUnfav.product ? displayProductName(confirmUnfav.product) : 'este producto'} de tus favoritos?`} confirmText="Sí, quitar" cancelText="Cancelar" onConfirm={() => { const p = confirmUnfav.product; if (p) { toggleFavorite(p.id); setFavorites(prev => prev.filter(f => f.id !== p.id)); } setConfirmUnfav({ open: false, product: null }) }} onClose={() => setConfirmUnfav({ open: false, product: null })} />
        <ConfirmDialog open={confirmDownload} title="Descargar datos" message="¿Deseas descargar tus datos personales?" confirmText="Descargar" cancelText="Cancelar" confirmClassName="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onConfirm={async () => { await downloadMyData(); setConfirmDownload(false) }} onClose={() => setConfirmDownload(false)} />
        <ConfirmDialog open={confirmDelete} title="Eliminar cuenta" message="¿Estás seguro de que deseas eliminar tu cuenta?" confirmText="Eliminar" cancelText="Cancelar" onConfirm={async () => { try { await api.del("users/me/delete/"); } catch {} logout(); setConfirmDelete(false); navigate('/') }} onClose={() => setConfirmDelete(false)} />
      </div>
    </Layout>
  )
}

