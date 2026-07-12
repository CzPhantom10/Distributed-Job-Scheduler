import React from 'react'
import { Link } from 'react-router-dom'
import type { Queue, QueueStats, QueueHealth } from '../../types/queue'
import HealthBadge from '../ui/HealthBadge'
import { Play, Pause, Trash2, Settings, ArrowRight } from 'lucide-react'

interface QueueCardProps {
  queue: Queue
  health?: QueueHealth
  onPause: (id: string) => void
  onResume: (id: string) => void
  onDelete: (id: string) => void
}

export default function QueueCard({ queue, health, onPause, onResume, onDelete }: QueueCardProps) {
  const stats = health?.stats

  return (
    <div className="bg-[#1f2937]/30 border border-[#374151] rounded-xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30">
      <div className="p-6 border-b border-[#374151]/50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-lg tracking-tight mb-1">{queue.name}</h3>
          <span className="text-xs text-slate-500 font-mono">ID: {queue.id.slice(0, 8)}...</span>
        </div>
        <div className="flex items-center gap-2">
          {health && <HealthBadge status={health.status} />}
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${
              queue.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {queue.status}
          </span>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-5 gap-2 px-6 py-4 bg-[#111827]/30 text-center border-b border-[#374151]/30">
          <div>
            <div className="text-xs text-slate-500">Queued</div>
            <div className="text-sm font-bold text-white font-mono">{stats.queued}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Running</div>
            <div className="text-sm font-bold text-indigo-400 font-mono">{stats.running}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Completed</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">{stats.completed}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Failed</div>
            <div className="text-sm font-bold text-rose-400 font-mono">{stats.failed}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Dead</div>
            <div className="text-sm font-bold text-slate-400 font-mono">{stats.dead}</div>
          </div>
        </div>
      )}

      <div className="p-4 bg-[#111827]/40 flex items-center justify-between">
        <div className="flex gap-2">
          {queue.status === 'active' ? (
            <button
              onClick={() => onPause(queue.id)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Pause queue"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => onResume(queue.id)}
              className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg transition-colors cursor-pointer"
              title="Resume queue"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(queue.id)}
            className="p-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
            title="Delete queue"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <Link
          to={`/queues/${queue.id}`}
          className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Explore Queue <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
