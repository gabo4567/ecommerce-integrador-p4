import React, { useEffect } from 'react'

type Props = {
  open: boolean
  message: string
  variant?: 'success' | 'info' | 'error'
  onClose: () => void
  duration?: number
}

const colors: Record<string, string> = {
  success: 'bg-green-600',
  info: 'bg-blue-600',
  error: 'bg-red-600',
}

export default function Toast({ open, message, variant = 'info', onClose, duration = 2000 }: Props) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [open, duration, onClose])

  if (!open) return null
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`text-white px-4 py-3 rounded shadow-lg ${colors[variant]} animate-fade-in`}>{message}</div>
    </div>
  )
}

