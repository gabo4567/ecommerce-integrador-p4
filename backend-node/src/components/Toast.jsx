import React, { useEffect } from 'react';

const colors = {
  success: 'bg-green-600',
  info: 'bg-blue-600',
  error: 'bg-red-600',
};

export default function Toast({ open, message, variant = 'info', onClose, duration = 2000 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`text-white px-4 py-3 rounded shadow-lg ${colors[variant]} animate-fade-in`}>{message}</div>
    </div>
  );
}

