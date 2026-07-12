import React from 'react'
import type { JobStatus } from '../../types/job'

interface StatusBadgeProps {
  status: JobStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<JobStatus, { bg: string; text: string; dot: string }> = {
    queued: {
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-400',
      dot: 'bg-blue-400'
    },
    scheduled: {
      bg: 'bg-purple-500/10 border-purple-500/20',
      text: 'text-purple-400',
      dot: 'bg-purple-400'
    },
    claimed: {
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-400',
      dot: 'bg-amber-400'
    },
    running: {
      bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      text: 'text-indigo-400',
      dot: 'bg-indigo-400 animate-ping'
    },
    completed: {
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400'
    },
    failed: {
      bg: 'bg-rose-500/10 border-rose-500/20',
      text: 'text-rose-400',
      dot: 'bg-rose-400'
    },
    dead: {
      bg: 'bg-slate-700/20 border-slate-700/30',
      text: 'text-slate-400',
      dot: 'bg-slate-400'
    }
  }

  const current = styles[status] || styles.queued

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg} ${current.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
