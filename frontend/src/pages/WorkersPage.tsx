import React from 'react'
import { useActiveWorkers } from '../hooks/useData'
import WorkerCard from '../components/workers/WorkerCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

export default function WorkersPage() {
  const { data: workers, isLoading, refetch } = useActiveWorkers()

  if (isLoading) return <LoadingSpinner size="large" />

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Worker Node Status</h1>
          <p className="text-sm text-slate-400 mt-1">Live updates on processing node utilization and throughput</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 border border-[#374151] rounded-lg text-sm font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 transition-colors cursor-pointer"
        >
          Refresh Nodes
        </button>
      </div>

      {/* Workers Grid */}
      {workers && workers.length === 0 ? (
        <EmptyState
          title="No active workers online"
          message="Ensure your worker microservices are running and sending heartbeats."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers?.map((w) => (
            <WorkerCard key={w.worker_id} worker={w} />
          ))}
        </div>
      )}
    </div>
  )
}
