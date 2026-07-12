import React from 'react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  text: string
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export default function Toast({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  const colors = {
    success: 'bg-[#111827] border-emerald-500/30 text-emerald-400',
    error: 'bg-[#111827] border-rose-500/30 text-rose-400',
    info: 'bg-[#111827] border-indigo-500/30 text-indigo-400'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between p-4 border rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${colors[toast.type]}`}
        >
          <span className="text-sm font-semibold">{toast.text}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-4 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
