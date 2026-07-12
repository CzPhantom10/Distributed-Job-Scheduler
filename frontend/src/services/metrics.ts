import { api } from './api'
import type { SystemOverview, ThroughputResponse, MetricsSummary } from '../types/metrics'

export const metricsService = {
  overview: () => api.get<SystemOverview>('/metrics/overview'),
  throughput: (window_minutes = 60) =>
    api.get<ThroughputResponse>(`/metrics/throughput?window_minutes=${window_minutes}`),
  summary: () => api.get<MetricsSummary>('/metrics/summary'),
}
