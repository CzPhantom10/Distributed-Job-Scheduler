export type WorkerStatus = 'idle' | 'busy' | 'offline'

export interface Worker {
  id: string
  name: string
  status: WorkerStatus
  hostname: string
  pid: number
  max_concurrency: number
  active_jobs: number
  last_heartbeat_at: string | null
  created_at: string
}

export interface WorkerStats {
  worker_id: string
  worker_name: string
  hostname: string
  pid: number
  status: WorkerStatus
  active_jobs: number
  max_concurrency: number
  last_heartbeat_at: string | null
  completed_jobs: number
  failed_jobs: number
}
