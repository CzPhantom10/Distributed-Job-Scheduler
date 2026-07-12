import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { jobsService } from '../services/jobs'
import type { JobDetail } from '../types/job'
import StatusBadge from '../components/ui/StatusBadge'
import JobTimeline from '../components/jobs/JobTimeline'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ConfirmModal from '../components/ui/ConfirmModal'
import { ChevronRight, ArrowLeft, RefreshCw, XOctagon } from 'lucide-react'

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // Action Modals
  const [showRetryModal, setShowRetryModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const fetchJobDetail = () => {
    if (!jobId) return
    setLoading(true)
    jobsService.detail(jobId)
      .then(setJob)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchJobDetail()
  }, [jobId])

  const handleRetry = async () => {
    if (!job) return
    try {
      await jobsService.retry(job.id)
      setShowRetryModal(false)
      fetchJobDetail()
    } catch (err) {
      alert('Failed to retry job')
    }
  }

  const handleCancel = async () => {
    if (!job) return
    try {
      await jobsService.cancel(job.id)
      setShowCancelModal(false)
      fetchJobDetail()
    } catch (err) {
      alert('Failed to cancel job')
    }
  }

  if (loading) return <LoadingSpinner size="large" />
  if (!job) return <div className="text-center py-12 text-slate-400">Job not found</div>

  return (
    <div className="space-y-8">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/queues/${job.queue_id}`} className="hover:text-white transition-colors">{job.queue_name}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-200">Job ID: {job.id.slice(0, 8)}...</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            {job.name} <StatusBadge status={job.status} />
          </h1>
        </div>

        <div className="flex gap-3">
          {job.status === 'failed' || job.status === 'dead' ? (
            <button
              onClick={() => setShowRetryModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-lg text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Job
            </button>
          ) : null}

          {job.status === 'queued' || job.status === 'scheduled' ? (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <XOctagon className="h-4 w-4" />
              Cancel Job
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detail Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-[#1f2937]/20 border border-[#374151] rounded-xl p-6 space-y-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Job Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Kind</span>
                <span className="font-bold text-white capitalize">{job.kind}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Priority</span>
                <span className="font-bold text-white font-mono">{job.priority}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Retries</span>
                <span className="font-bold text-white font-mono">{job.retry_count} / {job.max_retries}</span>
              </div>
              {job.idempotency_key && (
                <div className="col-span-2">
                  <span className="text-slate-500 block text-xs">Idempotency Key</span>
                  <span className="font-mono text-slate-300 break-all">{job.idempotency_key}</span>
                </div>
              )}
              {job.cron_expression && (
                <div>
                  <span className="text-slate-500 block text-xs">Cron Expression</span>
                  <span className="font-mono text-white font-bold">{job.cron_expression}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payload Panel */}
          <div className="bg-[#1f2937]/20 border border-[#374151] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Payload (JSON)</h3>
            <pre className="bg-[#111827] border border-[#374151]/60 rounded-xl p-4 text-xs font-mono text-indigo-300 overflow-x-auto">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </div>

          {/* Executions Logs Panel */}
          <div className="bg-[#1f2937]/20 border border-[#374151] rounded-xl p-6 space-y-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Execution History & Logs</h3>
            {job.executions.length === 0 ? (
              <div className="text-sm text-slate-500 italic">No executions have run yet.</div>
            ) : (
              <div className="space-y-6">
                {job.executions.map((exec, idx) => (
                  <div key={exec.id} className="border-l-2 border-indigo-500/30 pl-4 py-1 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Attempt #{exec.attempt} ({exec.status})</span>
                      <span className="text-slate-500">{new Date(exec.started_at).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500 block">Duration</span>
                        <span className="font-mono text-slate-300">{exec.duration_ms ? `${(exec.duration_ms / 1000).toFixed(2)}s` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Worker ID</span>
                        <span className="font-mono text-slate-300">{exec.worker_id || 'N/A'}</span>
                      </div>
                    </div>

                    {exec.output && (
                      <div>
                        <span className="text-slate-500 text-xxs uppercase tracking-wider block mb-1">Standard Output</span>
                        <pre className="bg-[#111827] border border-[#374151]/50 rounded-lg p-3 text-xs font-mono text-slate-300 max-h-40 overflow-y-auto">
                          {exec.output}
                        </pre>
                      </div>
                    )}

                    {exec.error && (
                      <div>
                        <span className="text-rose-500 text-xxs uppercase tracking-wider block mb-1">Error Message</span>
                        <pre className="bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-lg p-3 text-xs font-mono max-h-40 overflow-y-auto">
                          {exec.error}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timeline Event list */}
        <div className="bg-[#1f2937]/10 border border-[#374151] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Transition Timeline</h3>
          <JobTimeline events={job.timeline} />
        </div>
      </div>

      {/* Retry Confirm */}
      <ConfirmModal
        isOpen={showRetryModal}
        title="Manual Retry Job"
        message="This will re-queue the job execution queue with a fresh state transition event. Are you sure?"
        onConfirm={handleRetry}
        onCancel={() => setShowRetryModal(false)}
      />

      {/* Cancel Confirm */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Job"
        message="This will transition the job status to failed. Cancelled tasks will not be run by workers."
        confirmType="danger"
        confirmLabel="Cancel Job"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  )
}
