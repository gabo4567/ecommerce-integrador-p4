import React, { useState } from "react";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const PasswordResetRequest = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null); setConfirmMessage(null); setLoading(true); setShowConfirm(false);
    try { await api.post("users/password-reset/request/", { email }); setMessage("Si el email existe, se envió un código."); setShowConfirm(true); }
    catch { setMessage("Intenta nuevamente más tarde."); }
    finally { setLoading(false); }
  };

  const navigate = useNavigate();
  const submitConfirm = async (e) => {
    e.preventDefault();
    setConfirmMessage(null);
    if (!code || !newPassword || !confirmPassword) { setConfirmMessage("Completa todos los campos."); return; }
    if (newPassword !== confirmPassword) { setConfirmMessage("Las contraseñas no coinciden."); return; }
    setConfirmLoading(true);
    try { await api.post("users/password-reset/confirm/", { email, code, new_password: newPassword, confirm_password: confirmPassword }); setConfirmMessage("Contraseña restablecida correctamente."); setTimeout(() => navigate('/login'), 1800); }
    catch (err) { setConfirmMessage(err?.message || "No se pudo confirmar el código."); }
    finally { setConfirmLoading(false); }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Recuperar contraseña</h1>
        <form onSubmit={submit} className="space-y-4 bg-white rounded-lg p-6 shadow"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-3 py-2 border border-gray-300 rounded" /><button type="submit" disabled={loading || !email} className={`w-full py-2 rounded ${loading ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{loading ? 'Enviando…' : 'Enviar código'}</button>{message && <p className="text-center text-sm text-gray-700">{message}{loading ? ' Cargando…' : ''}</p>}</form>
        {showConfirm && (<form onSubmit={submitConfirm} className="space-y-4 bg-white rounded-lg p-6 shadow mt-6"><p className="text-sm text-gray-600">Ingresa el código enviado a <span className="font-medium">{email}</span> y tu nueva contraseña.</p><input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código" className="w-full px-3 py-2 border border-gray-300 rounded" /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña" className="w-full px-3 py-2 border border-gray-300 rounded" /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar contraseña" className="w-full px-3 py-2 border border-gray-300 rounded" /><button type="submit" disabled={confirmLoading} className={`w-full py-2 rounded ${confirmLoading ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>{confirmLoading ? 'Confirmando…' : 'Restablecer contraseña'}</button>{confirmMessage && <p className="text-center text-sm text-gray-700">{confirmMessage}</p>}</form>)}
      </div>
    </Layout>
  );
};

export default PasswordResetRequest;

