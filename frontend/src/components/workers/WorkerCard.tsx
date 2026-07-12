import React from 'react'
import type { WorkerStats } from '../../types/worker'
import { Cpu, Server, ShieldCheck, ShieldAlert } from 'lucide-react'

interface WorkerCardProps {
  worker: WorkerStats
}

export default function WorkerCard({ worker }: WorkerCardProps) {
  const isOnline = worker.status !== 'offline'
  const utilization = Math.round((worker.active_jobs / worker.max_concurrency) * 100)

  return (
    <div className="bg-[#1f2937]/30 border border-[#374151] rounded-xl overflow-hidden p-6 transition-all duration-300 hover:border-indigo-500/20">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className="p-3 bg-[#111827]/80 rounded-lg text-indigo-400 border border-[#374151]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">{worker.worker_name}</h3>
            <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
              <Server className="h-3 w-3" /> {worker.hostname} (PID: {worker.pid})
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isOnline
              ? worker.status === 'busy'
                ? 'bg-indigo-500/10 text-indigo-400'
                : 'bg-emerald-500/10 text-emerald-400'
              : 'bg-slate-800 text-slate-500'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOnline
                ? worker.status === 'busy'
                  ? 'bg-indigo-400 animate-pulse'
                  : 'bg-emerald-400'
                : 'bg-slate-600'
            }`}
          />
          {worker.status.toUpperCase()}
        </span>
      </div>

      {/* Utilization progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
          <span>Concurrency Utilization</span>
          <span>{worker.active_jobs} / {worker.max_concurrency} ({utilization}%)</span>
        </div>
        <div className="w-full bg-[#111827] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#374151]/40 text-center">
        <div className="bg-[#111827]/20 p-2 rounded-lg border border-[#374151]/20">
          <div className="text-xxs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" /> Completed
          </div>
          <div className="text-sm font-bold text-white font-mono">{worker.completed_jobs}</div>
        </div>
        <div className="bg-[#111827]/20 p-2 rounded-lg border border-[#374151]/20">
          <div className="text-xxs font-semibold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
            <ShieldAlert className="h-3 w-3 text-rose-500" /> Failed
          </div>
          <div className="text-sm font-bold text-white font-mono">{worker.failed_jobs}</div>
        </div>
      </div>

      {worker.last_heartbeat_at && (
        <p className="text-right text-xxs text-slate-500 mt-4">
          Last Heartbeat: {new Date(worker.last_heartbeat_at).toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
