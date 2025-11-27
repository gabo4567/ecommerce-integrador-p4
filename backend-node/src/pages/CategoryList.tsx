import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api/client";

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await api.get<any[]>("categories/");
        setCategories(cats);
      } catch {}
    };
    fetchCategories();
  }, []);

  return (
    <Layout>
      <section className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-8">Categorías</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <img
                  src={(typeof cat.image_url === 'string' && /^https?:\/\//.test(cat.image_url)) ? cat.image_url : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23f3f4f6'/><circle cx='50' cy='50' r='30' fill='%23e5e7eb'/></svg>"}
                  alt={cat.name}
                  className="w-20 h-20 object-contain rounded-full border"
                />
              </div>
              <h2 className="text-2xl font-semibold mb-2">{cat.name}</h2>
              <p className="text-gray-600 mb-4">{cat.description}</p>
              <Link to={`/productos?categoria=${encodeURIComponent(cat.name)}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Ver productos
              </Link>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default CategoryList;
