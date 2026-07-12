import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { queuesService } from '../services/queues'
import { jobsService } from '../services/jobs'
import type { Queue, QueueHealth } from '../types/queue'
import type { Job, JobStatus } from '../types/job'
import JobTable from '../components/jobs/JobTable'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Paginator from '../components/ui/Paginator'
import ConfirmModal from '../components/ui/ConfirmModal'
import { ChevronRight, Play, Pause, RefreshCw, Send, Plus } from 'lucide-react'

export default function QueueDetailPage() {
  const { queueId } = useParams<{ queueId: string }>()
  const [queue, setQueue] = useState<Queue | null>(null)
  const [health, setHealth] = useState<QueueHealth | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters / Pagination state
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('')
  const [offset, setOffset] = useState(0)
  const limit = 15

  // Enqueue Job Modal
  const [showEnqueueModal, setShowEnqueueModal] = useState(false)
  const [jobName, setJobName] = useState('')
  const [jobPayload, setJobPayload] = useState('{\n  "duration_seconds": 2\n}')
  const [jobKind, setJobKind] = useState<'immediate' | 'delayed' | 'cron'>('immediate')
  const [runAt, setRunAt] = useState('')
  const [cronExpr, setCronExpr] = useState('')

  // Action states
  const [showPauseModal, setShowPauseModal] = useState(false)

  const fetchQueueData = () => {
    if (!queueId) return
    setLoading(true)
    Promise.all([
      queuesService.get(queueId),
      queuesService.health(queueId),
      jobsService.list(queueId, {
        offset,
        limit,
        status: statusFilter || undefined,
        sort_by: 'created_at',
        sort_order: 'desc'
      })
    ])
      .then(([qRes, healthRes, jobsRes]) => {
        setQueue(qRes)
        setHealth(healthRes)
        setJobs(jobsRes.items)
        setTotalJobs(jobsRes.total)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchQueueData()
  }, [queueId, offset, statusFilter])

  const handlePauseResume = async () => {
    if (!queue) return
    try {
      if (queue.status === 'active') {
        await queuesService.pause(queue.id)
      } else {
        await queuesService.resume(queue.id)
      }
      setShowPauseModal(false)
      fetchQueueData()
    } catch (err) {
      alert('Failed to change queue status')
    }
  }

  const handleEnqueue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!queue || !jobName) return
    let parsedPayload = {}
    try {
      parsedPayload = JSON.parse(jobPayload)
    } catch (err) {
      alert('Invalid JSON payload')
      return
    }

    try {
      await jobsService.enqueue(queue.id, {
        name: jobName,
        payload: parsedPayload,
        kind: jobKind,
        run_at: jobKind === 'delayed' && runAt ? new Date(runAt).toISOString() : undefined,
        cron_expression: jobKind === 'cron' && cronExpr ? cronExpr : undefined
      })
      setShowEnqueueModal(false)
      setJobName('')
      setJobPayload('{\n  "duration_seconds": 2\n}')
      setJobKind('immediate')
      setRunAt('')
      setCronExpr('')
      setOffset(0)
      fetchQueueData()
    } catch (err) {
      alert('Failed to enqueue job')
    }
  }

  if (loading) return <LoadingSpinner size="large" />

  return (
    <div className="space-y-8">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/projects/${queue?.project_id}/queues`} className="hover:text-white transition-colors">Workspace</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-200">{queue?.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Queue Details</h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowPauseModal(true)}
            className={`flex items-center gap-2 px-4 py-2 border border-[#374151] rounded-lg text-sm font-semibold text-slate-300 transition-colors cursor-pointer ${
              queue?.status === 'active' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            {queue?.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {queue?.status === 'active' ? 'Pause Queue' : 'Resume Queue'}
          </button>
          <button
            onClick={() => setShowEnqueueModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-lg text-white transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Enqueue Job
          </button>
        </div>
      </div>

      {/* Queue Details Panel */}
      {queue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1f2937]/20 border border-[#374151] rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Concurrency Limit</span>
                <span className="font-bold text-white font-mono">{queue.concurrency_limit}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Priority level</span>
                <span className="font-bold text-white font-mono">{queue.priority}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Retry Strategy</span>
                <span className="font-bold text-indigo-400 capitalize font-mono">{queue.retry_strategy}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Retry Delay</span>
                <span className="font-bold text-white font-mono">{queue.retry_delay_seconds}s</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1f2937]/20 border border-[#374151] rounded-xl p-6 md:col-span-2 flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Queue Health</h3>
            {health && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-slate-500 font-medium">Health Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      health.status === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : health.status === 'warning'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {health.status}
                  </span>
                </div>
                {health.reasons.length > 0 ? (
                  <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                    {health.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-500">Queue is running optimally. No warnings found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs Table Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#374151]/50 pb-4">
          <h3 className="text-lg font-bold text-white">Job Explorer</h3>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any)
              setOffset(0)
            }}
            className="bg-[#1f2937]/50 border border-[#374151] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="queued">Queued</option>
            <option value="scheduled">Scheduled</option>
            <option value="claimed">Claimed</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="dead">Dead</option>
          </select>
        </div>

        <JobTable jobs={jobs} />

        {totalJobs > limit && (
          <Paginator
            offset={offset}
            limit={limit}
            total={totalJobs}
            onChange={setOffset}
          />
        )}
      </div>

      {/* Pause/Resume Modal */}
      <ConfirmModal
        isOpen={showPauseModal}
        title={queue?.status === 'active' ? 'Pause Queue?' : 'Resume Queue?'}
        message={
          queue?.status === 'active'
            ? 'Pausing the queue prevents workers from picking up newly enqueued tasks. Active in-flight jobs will not be interrupted.'
            : 'Resuming the queue allows workers to immediately pick up ready tasks.'
        }
        confirmLabel={queue?.status === 'active' ? 'Pause' : 'Resume'}
        onConfirm={handlePauseResume}
        onCancel={() => setShowPauseModal(false)}
      />

      {/* Enqueue Modal */}
      {showEnqueueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleEnqueue}
            className="bg-[#1f2937] border border-[#374151] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Enqueue New Job</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Job Name
                </label>
                <input
                  type="text"
                  required
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="send-welcome-email"
                  className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Job Kind
                </label>
                <select
                  value={jobKind}
                  onChange={(e: any) => setJobKind(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2 px-4 text-sm text-white focus:outline-none"
                >
                  <option value="immediate">Immediate</option>
                  <option value="delayed">Delayed / Scheduled</option>
                  <option value="cron">Recurring Cron</option>
                </select>
              </div>

              {jobKind === 'delayed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Run At Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={runAt}
                    onChange={(e) => setRunAt(e.target.value)}
                    className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2 px-4 text-sm text-white focus:outline-none"
                  />
                </div>
              )}

              {jobKind === 'cron' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Cron Expression
                  </label>
                  <input
                    type="text"
                    required
                    value={cronExpr}
                    onChange={(e) => setCronExpr(e.target.value)}
                    placeholder="*/5 * * * *"
                    className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2 px-4 text-sm text-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  JSON Payload
                </label>
                <textarea
                  rows={4}
                  required
                  value={jobPayload}
                  onChange={(e) => setJobPayload(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2 px-4 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-[#111827]/40 border-t border-[#374151]">
              <button
                type="button"
                onClick={() => setShowEnqueueModal(false)}
                className="px-4 py-2 border border-[#374151] rounded-lg text-sm font-semibold text-slate-300 hover:bg-[#374151]/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Enqueue
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
