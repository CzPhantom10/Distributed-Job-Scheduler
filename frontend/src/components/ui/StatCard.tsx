import React from 'react'
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  trend?: string
  trendType?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  loading?: boolean
}

export default function StatCard({ title, value, trend, trendType = 'neutral', icon, loading = false }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-[#1f2937]/50 border border-[#374151] rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-[#374151] rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-[#374151] rounded w-2/3"></div>
      </div>
    )
  }

  return (
    <div className="bg-[#1f2937]/30 backdrop-blur-md border border-[#374151] rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:border-[#4f46e5]/40 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400 font-medium">{title}</span>
        <div className="p-2 bg-[#111827]/80 rounded-lg text-indigo-400 border border-[#374151]">
          {icon || <Activity className="h-4 w-4" />}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {trend && (
          <span
            className={`text-xs font-semibold flex items-center gap-0.5 ${
              trendType === 'up'
                ? 'text-emerald-500'
                : trendType === 'down'
                ? 'text-rose-500'
                : 'text-slate-400'
            }`}
          >
            {trendType === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {trendType === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
