import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Star, ShoppingCart, Heart, Filter, ChevronDown } from 'lucide-react';
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cart";

const ProductSearch: React.FC = () => {
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const brands = ['Apple', 'Samsung', 'Sony', 'Nintendo', 'Microsoft', 'Google'];
  const access = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const refreshCart = useCartStore((s) => s.refreshCount);
  useEffect(() => {
    const run = async () => {
      try {
        const prods = await api.get<any[]>("products/");
        const cats = await api.get<any[]>("categories/");
        setProducts(prods);
        setCategories(cats.map((c: any) => c.name));
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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Buscar Productos</h1>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Buscar productos, marcas, categorías..."
            className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="absolute right-3 top-2.5 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Buscar
          </button>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Mostrando <span className="font-semibold">{products.length}</span> resultados
          </p>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Relevancia</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
                <option value="rating">Mejor Valorados</option>
                <option value="newest">Más Recientes</option>
              </select>
              <ChevronDown className="absolute right-2 top-3 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 bg-white rounded-lg shadow-md p-6 h-fit">
            <h3 className="font-semibold text-gray-800 mb-4">Filtros</h3>
            
            {/* Categories */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Categorías</h4>
              {categories.map((category) => (
                <label key={category} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{category}</span>
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Precio</h4>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="2000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Brands */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Marcas</h4>
              {brands.map((brand) => (
                <label key={brand} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{brand}</span>
                </label>
              ))}
            </div>

            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Aplicar Filtros
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                  src={(product.images && product.images[0]?.url) || "https://via.placeholder.com/400"}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                  <Heart className="h-5 w-5 text-gray-400 hover:text-red-500" />
                </button>
                  {false && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg">
                      <span className="text-white font-semibold">Agotado</span>
                    </div>
                  )}
                  
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">{product.category?.name || ""}</p>
                    <p className="text-sm font-medium text-gray-600"></p>
                  </div>
                  
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center mb-3">
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
                      <span className="text-sm text-gray-500 line-through ml-2">
                        
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className={`p-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700`}
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Anterior
              </button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">
                1
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductSearch;
