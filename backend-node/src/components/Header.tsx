import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search } from 'lucide-react';
import { useAuthStore } from "../store/auth";
import { api } from "../api/client";
import { useCartStore } from "../store/cart";

const Header: React.FC = () => {
  const access = useAuthStore((s) => s.accessToken);
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = useCartStore((s) => s.count);
  const refreshCart = useCartStore((s) => s.refreshCount);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    refreshCart();
  }, [access, location.pathname]);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-blue-600">TiendaOnline</h1>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Inicio
            </Link>
            <Link to="/productos" className="text-gray-700 hover:text-blue-600 font-medium">
              Productos
            </Link>
            <Link to="/seguimiento" className="text-gray-700 hover:text-blue-600 font-medium">
              Seguimiento
            </Link>
            
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {access ? (
                <>
                  <Link to="/perfil" className="text-gray-700 hover:text-blue-600 flex items-center space-x-2">
                    <User className="h-6 w-6" />
                    <span className="hidden sm:inline">{username}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-gray-700 hover:text-blue-600 font-medium">
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                    Iniciar sesión
                  </Link>
                  <Link to="/registro" className="text-gray-700 hover:text-blue-600 font-medium">
                    Registrarme
                  </Link>
                </>
              )}
              <Link to="/carrito" className="relative text-gray-700 hover:text-blue-600">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
