export type QueueStatus = 'active' | 'paused'
export type RetryStrategy = 'fixed' | 'linear' | 'exponential'
export type HealthStatus = 'healthy' | 'warning' | 'critical'

export interface Queue {
  id: string
  project_id: string
  name: string
  status: QueueStatus
  priority: number
  concurrency_limit: number
  max_retries: number
  retry_strategy: RetryStrategy
  retry_delay_seconds: number
  created_at: string
  updated_at: string
}

export interface QueueStats {
  queue_id: string
  queue_name: string
  queued: number
  running: number
  completed: number
  failed: number
  dead: number
  avg_duration_ms: number | null
}

export interface QueueHealth {
  queue_id: string
  queue_name: string
  status: HealthStatus
  reasons: string[]
  stats: QueueStats
}

export interface CreateQueueRequest {
  name: string
  priority?: number
  concurrency_limit?: number
  max_retries?: number
  retry_strategy?: RetryStrategy
  retry_delay_seconds?: number
}

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Project {
  id: string
  organization_id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}
