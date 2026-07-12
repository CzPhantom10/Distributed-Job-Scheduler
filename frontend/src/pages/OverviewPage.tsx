import React from 'react'
import { useSystemOverview, useThroughput } from '../hooks/useData'
import StatCard from '../components/ui/StatCard'
import ThroughputChart from '../components/charts/ThroughputChart'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  FolderKanban,
  Layers,
  Cpu,
  RefreshCw,
  Play,
  AlertCircle,
  XOctagon,
  CheckCircle2
} from 'lucide-react'

export default function OverviewPage() {
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useSystemOverview()
  const { data: throughput, isLoading: throughputLoading } = useThroughput()

  const handleRefresh = () => {
    refetchOverview()
  }

  if (overviewLoading || throughputLoading) {
    return <LoadingSpinner size="large" />
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Overview Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time status of your queues and background tasks</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 border border-[#374151] rounded-lg text-sm font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={overview?.total_projects ?? 0}
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <StatCard
          title="Total Queues"
          value={overview?.total_queues ?? 0}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          title="Active Workers"
          value={overview?.active_workers ?? 0}
          icon={<Cpu className="h-4 w-4" />}
          trend={overview?.active_workers && overview.active_workers > 0 ? "Online" : "None"}
          trendType={overview?.active_workers && overview.active_workers > 0 ? "up" : "down"}
        />
        <StatCard
          title="Running Jobs"
          value={overview?.running_jobs ?? 0}
          icon={<Play className="h-4 w-4" />}
          trendType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Queued Jobs"
          value={overview?.queued_jobs ?? 0}
          icon={<RefreshCw className="h-4 w-4" />}
        />
        <StatCard
          title="Failed Jobs"
          value={overview?.failed_jobs ?? 0}
          icon={<AlertCircle className="h-4 w-4" />}
          trendType="neutral"
        />
        <StatCard
          title="Dead Letter Jobs"
          value={overview?.dead_jobs ?? 0}
          icon={<XOctagon className="h-4 w-4" />}
          trendType="neutral"
        />
        <StatCard
          title="Completed Jobs"
          value={overview?.completed_jobs ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trendType="neutral"
        />
      </div>

      {/* Chart Section */}
      {throughput?.points && (
        <div className="mt-8">
          <ThroughputChart data={throughput.points} />
        </div>
      )}
    </div>
  )
}
