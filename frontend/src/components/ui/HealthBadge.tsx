import React from 'react'
import type { HealthStatus } from '../../types/queue'

interface HealthBadgeProps {
  status: HealthStatus
}

export default function HealthBadge({ status }: HealthBadgeProps) {
  const styles: Record<HealthStatus, { bg: string; text: string; label: string }> = {
    healthy: {
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-400',
      label: 'Healthy'
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-400',
      label: 'Warning'
    },
    critical: {
      bg: 'bg-rose-500/10 border-rose-500/20',
      text: 'text-rose-400',
      label: 'Critical'
    }
  }

  const current = styles[status] || styles.healthy

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${current.bg} ${current.text}`}>
      {current.label}
    </span>
  )
}
