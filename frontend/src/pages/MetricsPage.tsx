import React from 'react'
import { useMetricsSummary, useThroughput } from '../hooks/useData'
import StatCard from '../components/ui/StatCard'
import ThroughputChart from '../components/charts/ThroughputChart'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Percent, Activity, ShieldAlert, Cpu } from 'lucide-react'

export default function MetricsPage() {
  const { data: summary, isLoading: summaryLoading } = useMetricsSummary()
  const { data: throughput, isLoading: throughputLoading } = useThroughput()

  if (summaryLoading || throughputLoading) {
    return <LoadingSpinner size="large" />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Performance Metrics</h1>
        <p className="text-sm text-slate-400 mt-1">Analytics on scheduler throughput, success rates, and capacity utilization</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Jobs per Minute"
          value={summary?.jobs_per_minute ?? 0}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Success Rate"
          value={`${((summary?.success_rate ?? 0) * 100).toFixed(1)}%`}
          icon={<Percent className="h-4 w-4" />}
          trendType={summary?.success_rate && summary.success_rate > 0.95 ? 'up' : 'down'}
        />
        <StatCard
          title="Average Execution Time"
          value={summary?.avg_execution_ms ? `${(summary.avg_execution_ms / 1000).toFixed(2)}s` : 'N/A'}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Worker Utilization"
          value={`${((summary?.worker_utilization ?? 0) * 100).toFixed(0)}%`}
          icon={<Cpu className="h-4 w-4" />}
        />
      </div>

      {/* Throughput chart */}
      {throughput?.points && (
        <div className="mt-8">
          <ThroughputChart data={throughput.points} />
        </div>
      )}
    </div>
  )
}
