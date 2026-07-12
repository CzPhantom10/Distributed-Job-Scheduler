import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { queuesService, projectsService } from '../services/queues'
import type { Queue, QueueHealth, Project } from '../types/queue'
import QueueCard from '../components/queues/QueueCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import { Plus, ChevronRight } from 'lucide-react'

export default function QueuesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [queues, setQueues] = useState<Queue[]>([])
  const [healths, setHealths] = useState<Record<string, QueueHealth>>({})
  const [loading, setLoading] = useState(true)

  // Creation Modal
  const [showModal, setShowModal] = useState(false)
  const [queueName, setQueueName] = useState('')
  const [concurrency, setConcurrency] = useState(5)
  const [maxRetries, setMaxRetries] = useState(3)
  const [retryStrategy, setRetryStrategy] = useState<'fixed' | 'linear' | 'exponential'>('exponential')
  const [retryDelay, setRetryDelay] = useState(60)

  // Danger Action Modals
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'pause' | 'resume' | 'delete' | null>(null)

  const fetchQueues = () => {
    if (!projectId) return
    setLoading(true)
    Promise.all([
      projectsService.getProject(projectId),
      queuesService.list(projectId)
    ])
      .then(([projRes, queuesRes]) => {
        setProject(projRes)
        setQueues(queuesRes.items)
        // Fetch health for each queue
        return Promise.all(
          queuesRes.items.map((q: Queue) =>
            queuesService.health(q.id).then((health) => ({ id: q.id, health }))
          )
        )
      })
      .then((healthRes) => {
        const mapping: Record<string, QueueHealth> = {}
        healthRes.forEach((item: { id: string; health: QueueHealth }) => {
          mapping[item.id] = item.health
        })
        setHealths(mapping)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchQueues()
  }, [projectId])

  const handlePause = (id: string) => {
    setSelectedQueueId(id)
    setConfirmAction('pause')
  }

  const handleResume = (id: string) => {
    setSelectedQueueId(id)
    setConfirmAction('resume')
  }

  const handleDelete = (id: string) => {
    setSelectedQueueId(id)
    setConfirmAction('delete')
  }

  const executeQueueAction = async () => {
    if (!selectedQueueId || !confirmAction) return
    try {
      if (confirmAction === 'pause') {
        await queuesService.pause(selectedQueueId)
      } else if (confirmAction === 'resume') {
        await queuesService.resume(selectedQueueId)
      } else if (confirmAction === 'delete') {
        await queuesService.delete(selectedQueueId)
      }
      fetchQueues()
    } catch (err) {
      alert(`Failed to perform queue action: ${confirmAction}`)
    } finally {
      setSelectedQueueId(null)
      setConfirmAction(null)
    }
  }

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !queueName) return
    try {
      await queuesService.create(projectId, {
        name: queueName,
        concurrency_limit: concurrency,
        max_retries: maxRetries,
        retry_strategy: retryStrategy,
        retry_delay_seconds: retryDelay
      })
      setShowModal(false)
      setQueueName('')
      setConcurrency(5)
      setMaxRetries(3)
      setRetryStrategy('exponential')
      setRetryDelay(60)
      fetchQueues()
    } catch (err) {
      alert('Failed to create queue')
    }
  }

  if (loading) return <LoadingSpinner size="large" />

  return (
    <div className="space-y-8">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-200">{project?.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Queues Workspace</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-lg text-white transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Queue
        </button>
      </div>

      {/* Queues List Grid */}
      {queues.length === 0 ? (
        <EmptyState
          title="No queues in this project"
          message="Create a processing queue to begin enqueuing scheduling work."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-lg text-white transition-colors cursor-pointer"
            >
              Add First Queue
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queues.map((q) => (
            <QueueCard
              key={q.id}
              queue={q}
              health={healths[q.id]}
              onPause={handlePause}
              onResume={handleResume}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmAction !== null}
        title={
          confirmAction === 'delete'
            ? 'Delete Queue?'
            : confirmAction === 'pause'
            ? 'Pause Queue?'
            : 'Resume Queue?'
        }
        message={
          confirmAction === 'delete'
            ? 'Warning: Deleting this queue will delete all historical jobs and outputs. This action is irreversible.'
            : confirmAction === 'pause'
            ? 'Pausing this queue will prevent workers from claiming and running queued jobs immediately.'
            : 'Resuming will allow workers to continue claiming jobs from this queue.'
        }
        confirmLabel={
          confirmAction === 'delete'
            ? 'Delete'
            : confirmAction === 'pause'
            ? 'Pause'
            : 'Resume'
        }
        confirmType={confirmAction === 'delete' ? 'danger' : 'primary'}
        onConfirm={executeQueueAction}
        onCancel={() => {
          setSelectedQueueId(null)
          setConfirmAction(null)
        }}
      />

      {/* Create Queue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateQueue}
            className="bg-[#1f2937] border border-[#374151] rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Create Processing Queue</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Queue Name
                  </label>
                  <input
                    type="text"
                    required
                    value={queueName}
                    onChange={(e) => setQueueName(e.target.value)}
                    placeholder="email-notifications"
                    className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Concurrency Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={concurrency}
                      onChange={(e) => setConcurrency(parseInt(e.target.value))}
                      className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Max Retries
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                      className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Retry Strategy
                    </label>
                    <select
                      value={retryStrategy}
                      onChange={(e: any) => setRetryStrategy(e.target.value)}
                      className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="linear">Linear</option>
                      <option value="exponential">Exponential</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Retry Delay (sec)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={retryDelay}
                      onChange={(e) => setRetryDelay(parseInt(e.target.value))}
                      className="w-full bg-[#111827] border border-[#374151] rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-[#111827]/40 border-t border-[#374151]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#374151] rounded-lg text-sm font-semibold text-slate-300 hover:bg-[#374151]/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
