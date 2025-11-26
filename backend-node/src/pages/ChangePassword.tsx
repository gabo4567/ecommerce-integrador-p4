import React, { useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post("users/change-password/", { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });
      setMessage("Contraseña actualizada correctamente");
    } catch {
      setMessage("No se pudo cambiar la contraseña");
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Cambiar contraseña</h1>
        <form onSubmit={submit} className="space-y-4 bg-white rounded-lg p-6 shadow">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Contraseña actual" className="w-full px-3 py-2 border border-gray-300 rounded" />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña" className="w-full px-3 py-2 border border-gray-300 rounded" />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar contraseña" className="w-full px-3 py-2 border border-gray-300 rounded" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Actualizar</button>
          {message && <p className="text-center text-sm text-gray-700">{message}</p>}
        </form>
      </div>
    </Layout>
  );
};

export default ChangePassword;

