import React, { useState } from "react";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const PasswordResetConfirm = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) { setMessage("Las contraseñas no coinciden"); return; }
    try { await api.post("users/password-reset/confirm/", { email, code, new_password: newPassword, confirm_password: confirmPassword }); setMessage("Contraseña restablecida correctamente"); setTimeout(() => navigate('/login'), 1800); }
    catch { setMessage("No se pudo confirmar el código"); }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto"><h1 className="text-3xl font-bold text-gray-800 mb-6">Confirmar recuperación</h1><form onSubmit={submit} className="space-y-4 bg-white rounded-lg p-6 shadow"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-3 py-2 border border-gray-300 rounded" /><input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código" className="w-full px-3 py-2 border border-gray-300 rounded" /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña" className="w-full px-3 py-2 border border-gray-300 rounded" /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar contraseña" className="w-full px-3 py-2 border border-gray-300 rounded" /><button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Restablecer contraseña</button>{message && <p className="text-center text-sm text-gray-700">{message}</p>}</form></div>
    </Layout>
  );
};

export default PasswordResetConfirm;

