import React from 'react'

export default function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizes = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  }
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`animate-spin rounded-full border-indigo-500/20 border-t-indigo-500 ${sizes[size]}`}></div>
    </div>
  )
}
