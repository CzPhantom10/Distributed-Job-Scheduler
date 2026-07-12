import React from 'react'

interface EmptyStateProps {
  title?: string
  message: string
  action?: React.ReactNode
}

export default function EmptyState({ title = 'No results found', message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-[#1f2937]/10 border border-[#374151]/40 border-dashed rounded-xl my-6">
      <h4 className="text-sm font-semibold text-slate-300 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4">{message}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
