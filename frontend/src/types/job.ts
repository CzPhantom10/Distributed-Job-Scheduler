export type JobStatus = 'queued' | 'scheduled' | 'claimed' | 'running' | 'completed' | 'failed' | 'dead'
export type JobKind = 'immediate' | 'delayed' | 'scheduled' | 'cron' | 'batch'
export type JobEventType = 'queued' | 'claimed' | 'running' | 'completed' | 'failed' | 'retry' | 'dead' | 'cancelled' | 'scheduled'

export interface JobEvent {
  id: string
  event_type: JobEventType
  message: string | null
  attempt: number
  worker_id: string | null
  created_at: string
}

export interface JobExecution {
  id: string
  attempt: number
  status: string
  worker_id: string | null
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  output: string | null
  error: string | null
}

export interface Job {
  id: string
  name: string
  kind: JobKind
  status: JobStatus
  priority: number
  retry_count: number
  max_retries: number
  queue_id: string
  batch_id: string | null
  run_at: string | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
}

export interface JobDetail extends Job {
  payload: Record<string, unknown>
  queue_name: string
  idempotency_key: string | null
  cron_expression: string | null
  last_error: string | null
  retry_strategy: string
  retry_delay_seconds: number
  executions: JobExecution[]
  timeline: JobEvent[]
}

export interface EnqueueJobRequest {
  name: string
  payload?: Record<string, unknown>
  kind?: JobKind
  priority?: number
  run_at?: string
  cron_expression?: string
  idempotency_key?: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  offset: number
  limit: number
}
