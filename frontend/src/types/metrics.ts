export interface SystemOverview {
  total_projects: number
  total_queues: number
  active_workers: number
  queued_jobs: number
  running_jobs: number
  failed_jobs: number
  dead_jobs: number
  completed_jobs: number
}

export interface ThroughputPoint {
  timestamp: string
  completed: number
  failed: number
}

export interface ThroughputResponse {
  window_minutes: number
  points: ThroughputPoint[]
}

export interface MetricsSummary {
  jobs_per_minute: number
  success_rate: number
  failure_rate: number
  retry_rate: number
  avg_execution_ms: number | null
  worker_utilization: number
}
