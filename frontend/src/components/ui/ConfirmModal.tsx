import React from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmType?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmType = 'primary',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null

  const confirmColors = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500',
    danger: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f2937] border border-[#374151] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400">{message}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 bg-[#111827]/40 border-t border-[#374151]">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[#374151] rounded-lg text-sm font-semibold text-slate-300 hover:bg-[#374151]/40 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1f2937] transition-colors cursor-pointer ${confirmColors[confirmType]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
