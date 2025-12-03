import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { isFavorite, toggleFavorite, getRating, setRating, getProductImageSrc, categoryPlaceholders, getProductImageCandidates, getCategoryImageCandidates, advanceImageFallback, norm, formatMoney, addGuestCartItem, displayProductName, getGuestItemQty } from "../lib/utils";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useCartStore } from "../store/cart";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const access = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const navigate = useNavigate();
  const refreshCart = useCartStore((s) => s.refreshCount);
  const [homeQuery, setHomeQuery] = useState("");
  const [showHomeResults, setShowHomeResults] = useState(false);
  const tokens = norm(homeQuery).split(/\s+/).filter(Boolean);
  const [favMessageHome, setFavMessageHome] = useState({ id: null, text: '', variant: 'green' });
  const [cartMessageHome, setCartMessageHome] = useState({ id: null, text: '', variant: 'green' });
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [showCatsLoading, setShowCatsLoading] = useState(false);
  const [catsReady, setCatsReady] = useState(false);
  const [catsVisible, setCatsVisible] = useState(false);
  const [navCatsLoading, setNavCatsLoading] = useState(false);
  const [showNavCatsLoading, setShowNavCatsLoading] = useState(false);
  const homeResults = allProducts
    .filter((p) => {
      if (!tokens.length) return false;
      const hay = `${norm(p.name)} ${norm(p.description || '')} ${norm(p.category?.name || p.category || '')}`;
      return tokens.every(t => hay.includes(t));
    })
    .map((p) => {
      const hay = `${norm(p.name)} ${norm(p.description || '')}`;
      const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0) + (norm(p.name).startsWith(tokens[0] || '') ? 1 : 0);
      return { ...p, __score: score };
    })
    .sort((a, b) => (b.__score || 0) - (a.__score || 0));
  useEffect(() => {
    const run = async () => {
      try {
        setCatsLoading(true);
        const prods = await api.get("products/");
        const cats = await api.get("categories/");
        setAllProducts(prods);
        setProducts(prods.slice(0, 4));
        const validUrl = (u) => typeof u === 'string' && /^https?:\/\//.test(u);
        setCategories(cats.map((c) => ({ name: c.name, image_url: validUrl(c.image_url) ? c.image_url : null, count: prods.filter((p) => p.category === c.id || p.category?.id === c.id).length })));
        setCatsReady(true);
      } catch {}
      finally { setCatsLoading(false); }
    };
    run();
  }, []);

  useEffect(() => {
    let t;
    if (catsLoading && !catsReady) { t = setTimeout(() => setShowCatsLoading(true), 150); }
    else { setShowCatsLoading(false); }
    return () => { if (t) clearTimeout(t); };
  }, [catsLoading, catsReady]);

  useEffect(() => {
    let t;
    if (catsReady) { t = setTimeout(() => setCatsVisible(true), 50); }
    else { setCatsVisible(false); }
    return () => { if (t) clearTimeout(t); };
  }, [catsReady]);

  useEffect(() => {
    let t;
    if (navCatsLoading) { t = setTimeout(() => setShowNavCatsLoading(true), 100); }
    else { setShowNavCatsLoading(false); }
    return () => { if (t) clearTimeout(t); };
  }, [navCatsLoading]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const buscar = params.get('buscar') || '';
    setHomeQuery(buscar);
    setShowHomeResults(Boolean(buscar));
  }, [location.search]);

  useEffect(() => {
    const loadPurchases = async () => {
      if (!access || role === 'admin') { setPurchasedIds([]); return; }
      try {
        const me = await api.get("users/me/");
        const orders = await api.get("orders/");
        const myOrders = orders.filter(o => o.user === me.id && (o.status === 'paid' || o.status === 'delivered'));
        const items = await api.get("order-items/");
        const ids = items.filter(it => myOrders.some(o => o.id === it.order)).map(it => Number(it.product));
        setPurchasedIds(Array.from(new Set(ids)));
      } catch {}
    };
    loadPurchases();
  }, [access, role]);

  const addToCart = async (p) => {
    try {
      if (access) {
        const me = await api.get("users/me/");
        const orders = await api.get("orders/");
        let pending = orders.find((o) => o.status === "pending" && o.user === me.id);
        if (!pending) pending = await api.post("orders/", {});
        const items = await api.get(`order-items/?order=${pending.id}`);
        const existingQty = items.filter(it => Number(it.product) === Number(p.id)).reduce((sum, it) => sum + Number(it.quantity || 0), 0);
        const stock = Number(p.stock ?? 0);
        if (stock > 0 && existingQty >= stock) { setCartMessageHome({ id: p.id, text: 'Stock insuficiente', variant: 'red' }); setTimeout(() => setCartMessageHome({ id: null, text: '', variant: 'green' }), 1800); return; }
        await api.post("order-items/", { order: pending.id, product: p.id, quantity: 1, unit_price: p.price });
      } else {
        const currentQty = getGuestItemQty(p.id);
        const stock = Number(p.stock ?? 999999);
        if (currentQty >= stock) { setCartMessageHome({ id: p.id, text: 'Stock insuficiente', variant: 'red' }); setTimeout(() => setCartMessageHome({ id: null, text: '', variant: 'green' }), 1800); return; }
        addGuestCartItem(p.id, Number(p.price) || 0, 1);
      }
      await refreshCart();
      setCartMessageHome({ id: p.id, text: 'Producto agregado al carrito', variant: 'green' });
      setTimeout(() => setCartMessageHome({ id: null, text: '', variant: 'green' }), 1800);
    } catch {
      setCartMessageHome({ id: p.id, text: 'Stock insuficiente', variant: 'red' });
      setTimeout(() => setCartMessageHome({ id: null, text: '', variant: 'green' }), 1800);
    }
  };

  return (
    <Layout>
      <section className="relative rounded-2xl overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white flex flex-col items-center justify-center min-h-[300px] md:min-h-[360px] py-10 md:py-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-3 md:mb-4">Bienvenido a Tienda Online</h1>
          <p className="text-xl">Compra fácil, segura y al mejor precio</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/productos" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">Ver Ofertas</Link>
            <button onClick={() => { setNavCatsLoading(true); navigate('/categorias'); }} className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center">{showNavCatsLoading ? 'Cargando...' : 'Explorar Categorías'}</button>
          </div>
          {showNavCatsLoading && (<p className="mt-2 text-sm text-white">Cargando...</p>)}
        </div>
      </section>
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Categorías Populares</h2>
        {(!catsReady && showCatsLoading) ? (
          <div className="text-center text-gray-700">Cargando...</div>
        ) : (
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-opacity duration-150 ${catsVisible ? 'opacity-100' : 'opacity-0'}`}>
            {categories.map((category, index) => (
              <Link to={`/productos?categoria=${encodeURIComponent(category.name)}`} key={index} className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer block">
                <div className="mb-2 flex justify-center">
                  <img src={category.image_url ?? getCategoryImageCandidates(category.name)[0]} data-candidates={JSON.stringify(getCategoryImageCandidates(category.name))} data-idx={0} onError={advanceImageFallback} alt={category.name} className="w-16 h-16 object-contain rounded-full border" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count} productos</p>
              </Link>
            ))}
          </div>
        )}
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
              {homeResults.slice(0, 8).map((product) => (
                <Link to={`/producto/${product.id}`} key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img src={getProductImageCandidates(product)[0]} data-candidates={JSON.stringify(getProductImageCandidates(product))} data-idx={0} onError={advanceImageFallback} alt={product.name} className="w-full h-48 object-contain rounded-t-lg" />
                    {role !== 'admin' && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!access) { navigate('/login'); return; } const wasFav = isFavorite(product.id); toggleFavorite(product.id); setProducts(prev => prev.slice()); setFavMessageHome({ id: product.id, text: wasFav ? 'Quitado de favoritos' : 'Agregado a favoritos', variant: wasFav ? 'red' : 'green' }); setTimeout(() => setFavMessageHome({ id: null, text: '', variant: 'green' }), 2000); }} className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"><Heart className={`h-5 w-5 ${(access && isFavorite(product.id)) ? 'text-red-500' : 'text-gray-400'}`} /></button>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500 mb-1">{product.category?.name || ""}</p>
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => {
                          const current = getRating(product.id);
                          const allowed = Boolean(access) && role !== 'admin' && purchasedIds.includes(product.id);
                          return (<Star key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (allowed) { setRating(product.id, i+1); setProducts(prev => prev.slice()); } }} className={`h-4 w-4 ${i < current ? 'text-yellow-400' : 'text-gray-300'} ${allowed ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} aria-label={allowed ? 'Calificar' : 'Califica después de comprar y recibir'} />);
                        })}
                      </div>
                      <span className="text-sm text-gray-500 ml-1">({getRating(product.id)})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><span className="text-lg font-bold text-gray-900">${formatMoney(product.price)}</span></div>
                      {role !== 'admin' && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); const disabled = (Number(product.stock ?? 0) <= 0 || (!access && getGuestItemQty(product.id) >= Number(product.stock ?? 0))); if (disabled) return; addToCart(product); }} className={`p-2 rounded-lg transition-colors ${(Number(product.stock ?? 0) <= 0 || (!access && getGuestItemQty(product.id) >= Number(product.stock ?? 0))) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`} disabled={Number(product.stock ?? 0) <= 0 || (!access && getGuestItemQty(product.id) >= Number(product.stock ?? 0))} aria-label="Agregar al carrito" title="Agregar al carrito"><ShoppingCart className="h-5 w-5" /></button>
                      )}
                    </div>
                    {favMessageHome.id === product.id && (<div className={`mt-2 text-xs ${favMessageHome.variant === 'red' ? 'text-red-600' : 'text-green-600'}`}>{favMessageHome.text}</div>)}
                    {cartMessageHome.id === product.id && (<div className="mt-2 text-xs text-green-600">{cartMessageHome.text}</div>)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
      <section className="mb-12">
        <div className="flex items-center mb-8"><h2 className="text-3xl font-bold text-gray-800">Productos Destacados</h2><Link to="/productos" className="ml-auto text-blue-600 hover:text-blue-800 font-medium">Ver todos →</Link></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link to={`/producto/${product.id}`} key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="relative">
                <img src={getProductImageCandidates(product)[0]} data-candidates={JSON.stringify(getProductImageCandidates(product))} data-idx={0} onError={advanceImageFallback} alt={product.name} className="w-full h-48 object-contain rounded-t-lg" referrerPolicy="no-referrer" />
                {role !== 'admin' && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!access) { navigate('/login'); return; } const wasFav = isFavorite(product.id); toggleFavorite(product.id); setProducts(prev => prev.slice()); setFavMessageHome({ id: product.id, text: wasFav ? 'Quitado de favoritos' : 'Agregado a favoritos', variant: wasFav ? 'red' : 'green' }); setTimeout(() => setFavMessageHome({ id: null, text: '', variant: 'green' }), 1800); }} className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50" aria-label={isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'} title={isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}><Heart className={`h-5 w-5 ${(access && isFavorite(product.id)) ? 'text-red-500' : 'text-gray-400'}`} /></button>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-1">{product.category?.name || ""}</p>
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{displayProductName(product)}</h3>
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => {
                      const current = getRating(product.id);
                      const allowed = Boolean(access) && role !== 'admin' && purchasedIds.includes(product.id);
                      return (<Star key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (allowed) { setRating(product.id, i+1); setProducts(prev => prev.slice()); } }} className={`h-4 w-4 ${i < current ? 'text-yellow-400' : 'text-gray-300'} ${allowed ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} aria-label={allowed ? 'Calificar' : 'Califica después de comprar y recibir'} />);
                    })}
                  </div>
                  <span className="text-sm text-gray-500 ml-1">({getRating(product.id)})</span>
                </div>
                <div className="flex items-center justify-between"><div><span className="text-lg font-bold text-gray-900">${formatMoney(product.price)}</span><span className="text-sm text-gray-500 line-through ml-2"></span></div>{role !== 'admin' && (<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }} className="ml-auto bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"><ShoppingCart className="h-5 w-5" /></button>)}</div>
                {cartMessageHome.id === product.id && (<div className={`mt-3 text-sm font-medium ${cartMessageHome.variant === 'red' ? 'text-red-700 bg-red-50 border border-red-200' : 'text-green-700 bg-green-50 border border-green-200'} rounded px-3 py-2`}>{cartMessageHome.text}</div>)}
              </div>
              {favMessageHome.id === product.id && (<div className={`mt-3 text-sm font-medium ${favMessageHome.variant === 'red' ? 'text-red-700 bg-red-50 border border-red-200' : 'text-green-700 bg-green-50 border border-green-200'} rounded px-3 py-2`}>{favMessageHome.text}</div>)}
            </Link>
          ))}
        </div>
      </section>
      <section className="bg-white rounded-lg p-8"><h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">¿Por qué comprar con nosotros?</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="text-center"><div className="text-4xl mb-4">🚚</div><h3 className="text-xl font-semibold mb-2">Envío Gratis</h3><p className="text-gray-600">En compras superiores a $30.000</p></div><div className="text-center"><div className="text-4xl mb-4">🔒</div><h3 className="text-xl font-semibold mb-2">Pago Seguro</h3><p className="text-gray-600">Transacciones 100% seguras</p></div><div className="text-center"><div className="text-4xl mb-4">↩️</div><h3 className="text-xl font-semibold mb-2">Devoluciones</h3><p className="text-gray-600">30 días para devoluciones</p></div></div></section>
    </Layout>
  );
};

export default Home;

