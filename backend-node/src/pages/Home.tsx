import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { isFavorite, toggleFavorite, getRating, setRating, getProductImageSrc, categoryPlaceholders, getProductImageCandidates, getCategoryImageCandidates, advanceImageFallback, norm } from "../lib/utils";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useCartStore } from "../store/cart";

const Home: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const access = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const navigate = useNavigate();
  const refreshCart = useCartStore((s) => s.refreshCount);
  const [homeQuery, setHomeQuery] = useState("");
  const [showHomeResults, setShowHomeResults] = useState(false);
  const tokens = norm(homeQuery).split(/\s+/).filter(Boolean);
  const [favMessageHome, setFavMessageHome] = useState<{ id: number | null, text: string, variant: 'green' | 'red' }>({ id: null, text: '', variant: 'green' });
  const homeResults = allProducts
    .filter((p: any) => {
      if (!tokens.length) return false;
      const hay = `${norm(p.name)} ${norm(p.description || '')} ${norm(p.category?.name || p.category || '')}`;
      return tokens.every(t => hay.includes(t));
    })
    .map((p: any) => {
      const hay = `${norm(p.name)} ${norm(p.description || '')}`;
      const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0) + (norm(p.name).startsWith(tokens[0] || '') ? 1 : 0);
      return { ...p, __score: score };
    })
    .sort((a: any, b: any) => (b.__score || 0) - (a.__score || 0));
  useEffect(() => {
    const run = async () => {
      try {
        const prods = await api.get<any[]>("products/");
        const cats = await api.get<any[]>("categories/");
        setAllProducts(prods);
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

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const buscar = params.get('buscar') || '';
    setHomeQuery(buscar);
    setShowHomeResults(Boolean(buscar));
  }, [location.search]);

  // Notificación de producto agregado al carrito
  const [cartMessage, setCartMessage] = useState<string>("");

  const addToCart = async (p: any) => {
    if (!access) { navigate('/login'); return; }
    try {
      const me = await api.get<any>("users/me/");
      const orders = await api.get<any[]>("orders/");
      let pending = orders.find((o: any) => o.status === "pending" && o.user === me.id);
      if (!pending) pending = await api.post<any>("orders/", {});
      // Buscar si el producto normal (sin variante) ya está en el carrito
      const items = await api.get<any[]>("order-items/?order=" + pending.id);
      const existing = items.find((it: any) => Number(it.product) === Number(p.id) && (!it.variant || it.variant === null));
      if (existing) {
        // Actualizar cantidad
        await api.patch(`order-items/${existing.id}/`, { quantity: existing.quantity + 1 });
      } else {
        // Crear nueva entrada
        await api.post("order-items/", { order: pending.id, product: p.id, quantity: 1, unit_price: p.price });
      }
      await refreshCart();
      setCartMessage("Producto agregado al carrito");
      setTimeout(() => setCartMessage(""), 1500);
    } catch {}
  };

  return (
    <Layout>
      {/* Notificación de producto agregado al carrito */}
      {cartMessage && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {cartMessage}
        </div>
      )}
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
                    src={category.image_url ?? getCategoryImageCandidates(category.name)[0]}
                    data-candidates={JSON.stringify(getCategoryImageCandidates(category.name))}
                    data-idx={0}
                    onError={advanceImageFallback}
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

      {showHomeResults && tokens.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Resultados de la búsqueda</h2>
            <div className="flex gap-2">
              <Link to={`/productos?buscar=${encodeURIComponent(homeQuery)}`} className="text-blue-600 hover:text-blue-800 font-medium">Ver más →</Link>
              <button className="text-gray-600 hover:text-gray-800" onClick={()=>{ setHomeQuery(""); setShowHomeResults(false); }}>Limpiar</button>
            </div>
          </div>
          {homeResults.length === 0 ? (
            <div className="text-gray-600">No se encontraron resultados.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {homeResults.slice(0, 8).map((product: any) => (
                <Link to={`/producto/${product.id}`} key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={getProductImageCandidates(product)[0]}
                      data-candidates={JSON.stringify(getProductImageCandidates(product))}
                      data-idx={0}
                      onError={advanceImageFallback}
                      alt={product.name}
                      className="w-full h-48 object-contain rounded-t-lg"
                    />
                    {role !== 'admin' && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); const wasFav = isFavorite(product.id); toggleFavorite(product.id); setProducts(prev => prev.slice()); setFavMessageHome({ id: product.id, text: wasFav ? 'Quitado de favoritos' : 'Agregado a favoritos', variant: wasFav ? 'red' : 'green' }); setTimeout(() => setFavMessageHome({ id: null, text: '', variant: 'green' }), 2000); }} className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                        <Heart className={`h-5 w-5 ${isFavorite(product.id) ? 'text-red-500' : 'text-gray-400'}`} />
                      </button>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500 mb-1">{product.category?.name || ""}</p>
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => {
                          const current = getRating(product.id);
                          return (
                            <Star
                              key={i}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRating(product.id, i+1); setProducts(prev => prev.slice()); }}
                              className={`h-4 w-4 ${i < current ? 'text-yellow-400' : 'text-gray-300'} cursor-pointer`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-sm text-gray-500 ml-1">(0)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">${product.price}</span>
                      </div>
                      {role !== 'admin' && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                          <ShoppingCart className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    {favMessageHome.id === product.id && (
                      <div className={`mt-2 text-xs ${favMessageHome.variant === 'red' ? 'text-red-600' : 'text-green-600'}`}>{favMessageHome.text}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

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
            <Link to={`/producto/${product.id}`} key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow block">
              <div className="relative">
                <img
                  src={getProductImageCandidates(product)[0]}
                  data-candidates={JSON.stringify(getProductImageCandidates(product))}
                  data-idx={0}
                  onError={advanceImageFallback}
                  alt={product.name}
                  className="w-full h-48 object-contain rounded-t-lg"
                />
                {role !== 'admin' && (
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id); setProducts(prev => prev.slice()); }}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                  >
                    <Heart className={`h-5 w-5 ${isFavorite(product.id) ? 'text-red-500' : 'text-gray-400'}`} />
                  </button>
                )}
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
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setRating(product.id, i+1); setProducts(prev => prev.slice()); }}
                        className={`h-4 w-4 ${i < getRating(product.id) ? 'text-yellow-400' : 'text-gray-300'} cursor-pointer`}
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
                  {role !== 'admin' && (
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                  )}
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
