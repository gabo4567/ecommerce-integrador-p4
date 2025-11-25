import React, { useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";

const PasswordResetRequest: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post("users/password-reset/request/", { email });
      setMessage("Si el email existe, se envió un código.");
    } catch {
      setMessage("Intenta nuevamente más tarde.");
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Recuperar contraseña</h1>
        <form onSubmit={submit} className="space-y-4 bg-white rounded-lg p-6 shadow">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-3 py-2 border border-gray-300 rounded" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Enviar código</button>
          {message && <p className="text-center text-sm text-gray-700">{message}</p>}
        </form>
      </div>
    </Layout>
  );
};

export default PasswordResetRequest;

