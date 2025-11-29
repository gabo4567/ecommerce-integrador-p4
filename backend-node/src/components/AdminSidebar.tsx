import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import React from 'react'

export default function AdminSidebar() {
  const role = useAuthStore(s => s.role)
  const loc = useLocation()

  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return localStorage.getItem('adminSidebarCollapsed') === '1' } catch { return false }
  })
  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('adminSidebarCollapsed', next ? '1' : '0') } catch {}
  }

  const itemClass = (path: string) => `block px-3 py-2 rounded ${loc.pathname.startsWith(path) ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`

  if (role !== 'admin') return null

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        title="Abrir panel"
        className="fixed left-3 top-20 z-40 px-3 py-2 bg-white border border-gray-200 rounded shadow hover:bg-gray-50"
      >
        ☰ Panel
      </button>
    )
  }

  return (
    <aside className="block w-64 bg-white text-gray-800 border-r border-gray-200 sticky top-0 h-screen">
      <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Panel Administrador</h2>
        <button onClick={toggle} className="px-2 py-1 text-sm bg-gray-100 border border-gray-200 rounded hover:bg-gray-200">Contraer</button>
      </div>
      <nav className="px-4 py-4 grid gap-2">
        <Link to="/admin/ordenes" className={itemClass('/admin/ordenes')}>Órdenes</Link>
        <Link to="/admin/productos" className={itemClass('/admin/productos')}>Productos</Link>
        <Link to="/admin/envios" className={itemClass('/admin/envios')}>Envíos</Link>
        <Link to="/admin/usuarios" className={itemClass('/admin/usuarios')}>Usuarios</Link>
        <Link to="/admin/auditoria" className={itemClass('/admin/auditoria')}>Auditoría</Link>
        <Link to="/ajustes" className={itemClass('/ajustes')}>Ajustes del sistema</Link>
        <Link to="/admin/soporte" className={itemClass('/admin/soporte')}>Soporte</Link>
      </nav>
    </aside>
  )
}
