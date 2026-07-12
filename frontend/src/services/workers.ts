import { api } from './api'
import type { WorkerStats, Worker } from '../types/worker'
import type { Paginated } from '../types/job'

export const workersService = {
  list: () => api.get<Paginated<Worker>>('/workers?limit=100'),
  active: () => api.get<WorkerStats[]>('/workers/active'),
  get: (workerId: string) => api.get<WorkerStats>(`/workers/${workerId}`),
}
