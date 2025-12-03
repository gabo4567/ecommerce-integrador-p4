import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from "react-router-dom";
import Layout from '../components/Layout';
import { Star, ShoppingCart, Heart, Filter } from 'lucide-react';
import { isFavorite, toggleFavorite, getRating, setRating, getProductImageCandidates, advanceImageFallback, norm, formatMoney, addGuestCartItem, displayProductName, getGuestItemQty } from "../lib/utils";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useCartStore } from "../store/cart";

const ProductSearch = () => {
  const location = useLocation();
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [catIndex, setCatIndex] = useState({});
  const [favMessage, setFavMessage] = useState({ id: null, text: '', variant: 'green' });
  const [cartMessage, setCartMessage] = useState({ id: null, text: '', variant: 'green' });
  const access = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const navigate = useNavigate();
  const refreshCart = useCartStore((s) => s.refreshCount);
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [query, setQuery] = useState("");

  let baseProducts = selectedCategories.length === 0 ? products : products.filter((p) => selectedCategories.includes(p.category?.name || p.category));
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  // Precio disponible según categoría seleccionada
  const availablePrices = baseProducts.map(p => Number(p.price)).filter(n => !isNaN(n));
  const availableMin = availablePrices.length ? Math.min(...availablePrices) : 0;
  const availableMax = availablePrices.length ? Math.max(...availablePrices) : 0;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const onMinChange = (v) => {
    const val = clamp(Math.round(Number(v) || 0), availableMin, priceRange[1]);
    setPriceRange([val, priceRange[1]]);
  };
  const onMaxChange = (v) => {
    const val = clamp(Math.round(Number(v) || 0), priceRange[0], availableMax);
    setPriceRange([priceRange[0], val]);
  };

  let filteredProducts = baseProducts.filter((p) => {
    if (!tokens.length) return true;
    const hay = `${norm(p.name)} ${norm(p.description || '')} ${norm(p.category?.name || p.category || '')}`;
    return tokens.every(t => hay.includes(t));
  }).map((p) => {
    const hay = `${norm(p.name)} ${norm(p.description || '')} ${norm(p.category?.name || p.category || '')}`;
    const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0) + (norm(p.name).startsWith(tokens[0] || '') ? 1 : 0);
    return { ...p, __score: score };
  });

  if (priceRange[1] > 0) {
    filteredProducts = filteredProducts.filter((p) => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]);
  }
  filteredProducts = filteredProducts.slice().sort((a, b) => (b.__score || 0) - (a.__score || 0));

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const prods = await api.get("products/");
        const cats = await api.get("categories/");
        setProducts(prods);
        const catNames = cats.map((c) => c.name);
        setCategories(catNames);
        const init = {};
        catNames.forEach(n => init[n] = 0);
        setCatIndex(init);
        const prices = prods.map(p => Number(p.price)).filter(n => !isNaN(n));
        const min = prices.length ? Math.min(...prices) : 0;
        const max = prices.length ? Math.max(...prices) : 0;
        setPriceRange([min, max]);
      } catch {}
      finally { setLoading(false); }
    };
    run();
  }, []);

  useEffect(() => {
    const loadPurchases = async () => {
      if (!access) return;
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
  }, [access]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoria = params.get("categoria");
    const buscar = params.get("buscar");
    setSelectedCategories(categoria ? [categoria] : []);
    if (buscar) setQuery(buscar);
  }, [location.search]);

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
        if (stock > 0 && existingQty >= stock) { setCartMessage({ id: p.id, text: 'Stock insuficiente', variant: 'red' }); setTimeout(() => setCartMessage({ id: null, text: '', variant: 'green' }), 1800); return; }
        await api.post("order-items/", { order: pending.id, product: p.id, quantity: 1, unit_price: p.price });
      } else {
        const currentQty = getGuestItemQty(p.id);
        const stock = Number(p.stock ?? 999999);
        if (currentQty >= stock) { setCartMessage({ id: p.id, text: 'Stock insuficiente', variant: 'red' }); setTimeout(() => setCartMessage({ id: null, text: '', variant: 'green' }), 1800); return; }
        addGuestCartItem(p.id, Number(p.price) || 0, 1);
      }
      await refreshCart();
      setCartMessage({ id: p.id, text: 'Producto agregado al carrito', variant: 'green' }); setTimeout(() => setCartMessage({ id: null, text: '', variant: 'green' }), 1800);
    } catch { setCartMessage({ id: p.id, text: 'Stock insuficiente', variant: 'red' }); setTimeout(() => setCartMessage({ id: null, text: '', variant: 'green' }), 1800); }
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  useEffect(() => {
    const prices = availablePrices;
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    setPriceRange(([curMin, curMax]) => [
      Math.max(min, Math.min(curMin, max)),
      Math.min(max, Math.max(curMax, min))
    ]);
  }, [selectedCategories, products]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Buscar Productos</h1>
        <div className="relative mb-6">
          <input type="text" placeholder="Buscar productos..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" onClick={() => setQuery(query)}>Buscar</button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">Mostrando <span className="font-semibold">{filteredProducts.length}</span> resultados</p>
          <div className="flex items-center">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Filter className="h-4 w-4" /><span>Filtros</span></button>
          </div>
        </div>
      </div>
      <div className="flex gap-8">
        {showFilters && (
          <div className="w-64 bg-white rounded-lg shadow-md p-6 h-fit">
            <h3 className="font-semibold text-gray-800 mb-4">Filtros</h3>
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Categorías</h4>
              {categories.map((category) => (
                <label key={category} className="flex items-center mb-2"><input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="ml-2 text-sm text-gray-600">{category}</span></label>
              ))}
            </div>
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Precio</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>${formatMoney(priceRange[0])}</span>
                  <input className="w-24 border rounded px-2 py-1" inputMode="numeric" value={priceRange[0]} onChange={(e) => onMinChange(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Mínimo</label>
                  <input type="range" min={availableMin} max={availableMax} step={1} value={priceRange[0]} onChange={(e) => onMinChange(e.target.value)} className="w-full" />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>${formatMoney(priceRange[1])}</span>
                  <input className="w-24 border rounded px-2 py-1" inputMode="numeric" value={priceRange[1]} onChange={(e) => onMaxChange(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Máximo</label>
                  <input type="range" min={availableMin} max={availableMax} step={1} value={priceRange[1]} onChange={(e) => onMaxChange(e.target.value)} className="w-full" />
                </div>
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Aplicar Filtros</button>
          </div>
        )}
        <div className="flex-1 space-y-10">
          {loading && (<div className="text-center py-12 text-gray-600">Cargando productos…</div>)}
          {(selectedCategories.length ? selectedCategories : categories).map((catName) => {
            const list = filteredProducts.filter(p => (p.category?.name || p.category) === catName);
            if (!list.length) return null;
            const index = catIndex[catName] || 0;
            const start = index * 5;
            const slice = list.slice(start, start + 5);
            const maxIndex = Math.max(0, Math.ceil(list.length / 5) - 1);
            return (
              <div key={catName}>
                <div className="flex items-center justify-between mb-3"><h2 className="text-xl font-semibold">{catName}</h2><div className="flex gap-2"><button disabled={index === 0} onClick={() => setCatIndex(prev => ({ ...prev, [catName]: Math.max(0, index - 1) }))} className={`px-3 py-1 rounded ${index===0?'bg-gray-100 text-gray-400':'bg-gray-200 hover:bg-gray-300'}`}>←</button><button disabled={index === maxIndex} onClick={() => setCatIndex(prev => ({ ...prev, [catName]: Math.min(maxIndex, index + 1) }))} className={`px-3 py-1 rounded ${index===maxIndex?'bg-gray-100 text-gray-400':'bg-gray-200 hover:bg-gray-300'}`}>→</button></div></div>
                <div className="grid grid-cols-5 gap-6">
                  {slice.map((product) => (
                    <Link to={`/producto/${product.id}`} key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img src={getProductImageCandidates(product)[0]} data-candidates={JSON.stringify(getProductImageCandidates(product))} data-idx={0} onError={advanceImageFallback} alt={product.name} className="w-full h-48 object-contain rounded-t-lg bg-white" referrerPolicy="no-referrer" />
                        {role !== 'admin' && (
                          <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50" onClick={e => { e.preventDefault(); e.stopPropagation(); if (!access) { navigate('/login'); return; } const wasFav = isFavorite(product.id); toggleFavorite(product.id); setFavMessage({ id: product.id, text: wasFav ? 'Quitado de favoritos' : 'Agregado a favoritos', variant: wasFav ? 'red' : 'green' }); setTimeout(() => setFavMessage({ id: null, text: '', variant: 'green' }), 1500); }} aria-label={isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'} title={isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}><Heart className={`h-5 w-5 ${(access && isFavorite(product.id)) ? 'text-red-500' : 'text-gray-400'}`} /></button>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{displayProductName(product)}</h3>
                        <div className="flex items-center mb-3"><div className="flex items-center">{[...Array(5)].map((_, i) => (<Star key={i} onClick={e => { e.preventDefault(); e.stopPropagation(); if (purchasedIds.includes(product.id)) setRating(product.id, i+1); }} className={`h-4 w-4 ${i < getRating(product.id) ? 'text-yellow-400' : 'text-gray-300'} ${purchasedIds.includes(product.id) ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} aria-label={purchasedIds.includes(product.id) ? 'Calificar' : 'Califica después de comprar y recibir'} />))}</div><span className="text-sm text-gray-500 ml-1">({getRating(product.id)})</span></div>
                        <div className="flex items-center justify_between"><span className="text-lg font-bold text-gray-900">${formatMoney(product.price)}</span>{role !== 'admin' && (<button onClick={e => { e.preventDefault(); e.stopPropagation(); const disabled = (Number(product.stock ?? 0) <= 0 || (!access && getGuestItemQty(product.id) >= Number(product.stock ?? 0))); if (disabled) return; addToCart(product); }} className={`ml-auto p-2 rounded-lg transition-colors ${(Number(product.stock ?? 0) <= 0 || (!access && getGuestItemQty(product.id) >= Number(product.stock ?? 0))) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`} disabled={Number(product.stock ?? 0) <= 0 || (!access && getGuestItemQty(product.id) >= Number(product.stock ?? 0))} aria-label="Agregar al carrito" title="Agregar al carrito"><ShoppingCart className="h-5 w-5" /></button>)}
                        </div>
                        {favMessage.id === product.id && (<div className={`mt-2 text-xs ${favMessage.variant === 'red' ? 'text-red-600' : 'text-green-600'}`}>{favMessage.text}</div>)}
                        {cartMessage.id === product.id && (<div className={`mt-2 text-xs ${cartMessage.variant === 'red' ? 'text-red-600' : 'text-green-600'}`}>{cartMessage.text}</div>)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default ProductSearch;
