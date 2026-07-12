import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { metricsService } from '../services/metrics'
import { queuesService, projectsService } from '../services/queues'
import { workersService } from '../services/workers'
import { jobsService } from '../services/jobs'
import type { JobStatus } from '../types/job'

// ── Metrics ───────────────────────────────────────────────────────────────

export function useSystemOverview() {
  return useQuery({
    queryKey: ['metrics', 'overview'],
    queryFn: metricsService.overview,
    refetchInterval: 10_000, // live dashboard
  })
}

export function useThroughput(windowMinutes = 60) {
  return useQuery({
    queryKey: ['metrics', 'throughput', windowMinutes],
    queryFn: () => metricsService.throughput(windowMinutes),
    refetchInterval: 30_000,
  })
}

export function useMetricsSummary() {
  return useQuery({
    queryKey: ['metrics', 'summary'],
    queryFn: metricsService.summary,
    refetchInterval: 30_000,
  })
}

// ── Projects & Orgs ───────────────────────────────────────────────────────

export function useOrganizations() {
  return useQuery({
    queryKey: ['orgs'],
    queryFn: projectsService.listOrgs,
  })
}

export function useProjects(orgId: string | undefined) {
  return useQuery({
    queryKey: ['projects', orgId],
    queryFn: () => projectsService.listProjects(orgId!),
    enabled: !!orgId,
  })
}

// ── Queues ────────────────────────────────────────────────────────────────

export function useQueues(projectId: string | undefined) {
  return useQuery({
    queryKey: ['queues', projectId],
    queryFn: () => queuesService.list(projectId!),
    enabled: !!projectId,
  })
}

export function useQueue(queueId: string | undefined) {
  return useQuery({
    queryKey: ['queue', queueId],
    queryFn: () => queuesService.get(queueId!),
    enabled: !!queueId,
  })
}

export function useQueueStats(queueId: string | undefined) {
  return useQuery({
    queryKey: ['queue-stats', queueId],
    queryFn: () => queuesService.stats(queueId!),
    enabled: !!queueId,
    refetchInterval: 10_000,
  })
}

export function useQueueHealth(queueId: string | undefined) {
  return useQuery({
    queryKey: ['queue-health', queueId],
    queryFn: () => queuesService.health(queueId!),
    enabled: !!queueId,
    refetchInterval: 15_000,
  })
}

export function usePauseQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: queuesService.pause,
    onSuccess: (_, queueId) => {
      qc.invalidateQueries({ queryKey: ['queue', queueId] })
      qc.invalidateQueries({ queryKey: ['queues'] })
    },
  })
}

export function useResumeQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: queuesService.resume,
    onSuccess: (_, queueId) => {
      qc.invalidateQueries({ queryKey: ['queue', queueId] })
      qc.invalidateQueries({ queryKey: ['queues'] })
    },
  })
}

// ── Jobs ──────────────────────────────────────────────────────────────────

export function useJobs(
  queueId: string | undefined,
  params: { offset?: number; limit?: number; status?: JobStatus; sort_by?: string; sort_order?: string }
) {
  return useQuery({
    queryKey: ['jobs', queueId, params],
    queryFn: () => jobsService.list(queueId!, params),
    enabled: !!queueId,
    refetchInterval: 10_000,
  })
}

export function useJobDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsService.detail(jobId!),
    enabled: !!jobId,
    refetchInterval: 5_000,
  })
}

export function useRetryJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: jobsService.retry,
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ['job', job.id] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useCancelJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: jobsService.cancel,
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ['job', job.id] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

// ── Workers ───────────────────────────────────────────────────────────────

export function useActiveWorkers() {
  return useQuery({
    queryKey: ['workers', 'active'],
    queryFn: workersService.active,
    refetchInterval: 10_000,
  })
}

export function useAllWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: workersService.list,
    refetchInterval: 15_000,
  })
}
