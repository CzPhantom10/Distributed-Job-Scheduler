import { api } from './api'
import type { Job, JobDetail, Paginated, EnqueueJobRequest } from '../types/job'
import type { JobStatus } from '../types/job'

export const jobsService = {
  list: (queueId: string, params: { offset?: number; limit?: number; status?: JobStatus; sort_by?: string; sort_order?: string }) => {
    const q = new URLSearchParams()
    if (params.offset !== undefined) q.set('offset', String(params.offset))
    if (params.limit !== undefined) q.set('limit', String(params.limit))
    if (params.status) q.set('status', params.status)
    if (params.sort_by) q.set('sort_by', params.sort_by)
    if (params.sort_order) q.set('sort_order', params.sort_order)
    return api.get<Paginated<Job>>(`/jobs/queues/${queueId}/jobs?${q}`)
  },
  detail: (jobId: string) => api.get<JobDetail>(`/jobs/jobs/${jobId}`),
  enqueue: (queueId: string, data: EnqueueJobRequest) => api.post<Job>(`/jobs/queues/${queueId}/jobs`, data),
  retry: (jobId: string) => api.post<Job>(`/jobs/jobs/${jobId}/retry`),
  cancel: (jobId: string) => api.post<Job>(`/jobs/jobs/${jobId}/cancel`),
}
