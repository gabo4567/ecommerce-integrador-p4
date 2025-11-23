import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold text-[#FFD700]">E-Commerce</span>
        <span className="text-gray-400">Premium</span>
      </div>
      <nav className="flex gap-3">
        <Link to="/" className="nav-btn">Dashboard</Link>
        <Link to="/orders" className="nav-btn">Orders</Link>
        <Link to="/promotions" className="nav-btn">Promotions</Link>
        <Link to="/inventory" className="nav-btn">Inventory</Link>
      </nav>
    </header>
  )
}
