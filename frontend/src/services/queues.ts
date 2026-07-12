import { api } from './api'
import type { Queue, QueueStats, QueueHealth, CreateQueueRequest, Organization, Project } from '../types/queue'
import type { Paginated } from '../types/job'

export const projectsService = {
  listOrgs: () => api.get<Paginated<Organization>>('/projects/orgs?limit=100'),
  createOrg: (data: { name: string; slug: string; description?: string }) =>
    api.post<Organization>('/projects/orgs', data),
  listProjects: (orgId: string, search?: string) => {
    const q = new URLSearchParams({ limit: '100' })
    if (search) q.set('search', search)
    return api.get<Paginated<Project>>(`/projects/orgs/${orgId}/projects?${q}`)
  },
  createProject: (orgId: string, data: { name: string; slug: string; description?: string }) =>
    api.post<Project>(`/projects/orgs/${orgId}/projects`, data),
  getProject: (projectId: string) => api.get<Project>(`/projects/projects/${projectId}`),
  deleteProject: (projectId: string) => api.delete<void>(`/projects/projects/${projectId}`),
}

export const queuesService = {
  list: (projectId: string) =>
    api.get<Paginated<Queue>>(`/queues/projects/${projectId}/queues?limit=100`),
  get: (queueId: string) => api.get<Queue>(`/queues/queues/${queueId}`),
  create: (projectId: string, data: CreateQueueRequest) =>
    api.post<Queue>(`/queues/projects/${projectId}/queues`, data),
  update: (queueId: string, data: Partial<CreateQueueRequest>) =>
    api.patch<Queue>(`/queues/queues/${queueId}`, data),
  pause: (queueId: string) => api.post<Queue>(`/queues/queues/${queueId}/pause`),
  resume: (queueId: string) => api.post<Queue>(`/queues/queues/${queueId}/resume`),
  delete: (queueId: string) => api.delete<void>(`/queues/queues/${queueId}`),
  stats: (queueId: string) => api.get<QueueStats>(`/queues/queues/${queueId}/stats`),
  health: (queueId: string) => api.get<QueueHealth>(`/queues/queues/${queueId}/health`),
}
