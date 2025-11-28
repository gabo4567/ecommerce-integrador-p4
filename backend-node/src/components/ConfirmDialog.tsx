import React from 'react'

type Props = {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({ open, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onClose }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>{cancelText}</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

