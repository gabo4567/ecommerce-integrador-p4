import React from "react";
import Layout from "./Layout";
import { useAuthStore } from "../store/auth";
import { Link } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const role = useAuthStore((s) => s.role);
  const access = useAuthStore((s) => s.accessToken);
  if (role === "admin") return children;
  return (
    <Layout>
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Acceso restringido</h2>
        <p className="text-gray-600 mb-6">Esta sección es solo para administradores.</p>
        {access ? (
          <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">Volver al inicio</Link>
        ) : (
          <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">Iniciar sesión</Link>
        )}
      </div>
    </Layout>
  );
}

