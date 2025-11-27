import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useCartStore } from "../store/cart";

const Home: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const access = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const refreshCart = useCartStore((s) => s.refreshCount);
  useEffect(() => {
    const run = async () => {
      try {
        const prods = await api.get<any[]>("products/");
        const cats = await api.get<any[]>("categories/");
        setProducts(prods.slice(0, 4));
        const validUrl = (u: any) => typeof u === 'string' && /^https?:\/\//.test(u);
        setCategories(cats.map((c: any) => ({
          name: c.name,
          image_url: validUrl(c.image_url) ? c.image_url : null,
          count: prods.filter((p: any) => p.category === c.id || p.category?.id === c.id).length
        })));
      } catch {}
    };
    run();
  }, []);

  const addToCart = async (p: any) => {
    if (!access) { navigate('/login'); return; }
    try {
      const me = await api.get<any>("users/me/");
      const orders = await api.get<any[]>("orders/");
      let pending = orders.find((o: any) => o.status === "pending" && o.user === me.id);
      if (!pending) pending = await api.post<any>("orders/", {});
      await api.post("order-items/", { order: pending.id, product: p.id, quantity: 1, unit_price: p.price });
      await refreshCart();
    } catch {}
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Bienvenido a TiendaOnline
          </h1>
          <p className="text-xl mb-8">
            Descubre los mejores productos con los mejores precios
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/productos" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
              Ver Ofertas
            </Link>
            <Link to="/categorias" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center">
              Explorar Categorías
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Categorías Populares
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Link
                to={`/productos?categoria=${encodeURIComponent(category.name)}`}
                key={index}
                className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer block"
              >
                <div className="mb-2 flex justify-center">
                  <img
                    src={category.image_url ?? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23f3f4f6'/><circle cx='50' cy='50' r='30' fill='%23e5e7eb'/></svg>"}
                    alt={category.name}
                    className="w-16 h-16 object-contain rounded-full border"
                  />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count} productos</p>
              </Link>
            ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Productos Destacados
          </h2>
          <Link to="/productos" className="text-blue-600 hover:text-blue-800 font-medium">
            Ver todos →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link to={`/producto/${product.id}`} key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={(product.images && product.images[0]?.url) || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20'>Sin imagen</text></svg>"}
                  alt={product.name}
                  className="w-full h-48 object-contain rounded-t-lg"
                />
                <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                  <Heart className="h-5 w-5 text-gray-400 hover:text-red-500" />
                </button>
                
              </div>
              
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-1">{product.category?.name || ""}</p>
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 text-gray-300`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-1">(0)</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">
                      ${product.price}
                    </span>
                    <span className="text-sm text-gray-500 line-through ml-2"></span>
                  </div>
                  <button onClick={() => addToCart(product)} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white rounded-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          ¿Por qué comprar con nosotros?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">Envío Gratis</h3>
            <p className="text-gray-600">En compras superiores a $50</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Pago Seguro</h3>
            <p className="text-gray-600">Transacciones 100% seguras</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">↩️</div>
            <h3 className="text-xl font-semibold mb-2">Devoluciones</h3>
            <p className="text-gray-600">30 días para devoluciones</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
