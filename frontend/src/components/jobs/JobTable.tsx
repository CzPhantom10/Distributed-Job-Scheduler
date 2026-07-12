import React from 'react'
import { Link } from 'react-router-dom'
import type { Job } from '../../types/job'
import StatusBadge from '../ui/StatusBadge'
import EmptyState from '../ui/EmptyState'

interface JobTableProps {
  jobs: Job[]
  loading?: boolean
}

export default function JobTable({ jobs, loading = false }: JobTableProps) {
  if (loading) {
    return (
      <div className="w-full space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-[#1f2937]/50 rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return <EmptyState message="No jobs found in this queue" />
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#374151] bg-[#1f2937]/10 backdrop-blur-md">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#374151] bg-[#111827]/40 text-xs font-semibold text-slate-400 uppercase">
            <th className="p-4">Name</th>
            <th className="p-4">Kind</th>
            <th className="p-4">Status</th>
            <th className="p-4">Priority</th>
            <th className="p-4">Retries</th>
            <th className="p-4">Created</th>
            <th className="p-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#374151]/50 text-sm">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-[#1f2937]/20 transition-colors">
              <td className="p-4 font-semibold text-white truncate max-w-[200px]">
                <Link to={`/jobs/${job.id}`} className="hover:text-indigo-400 transition-colors">
                  {job.name}
                </Link>
              </td>
              <td className="p-4 text-slate-400 capitalize">{job.kind}</td>
              <td className="p-4">
                <StatusBadge status={job.status} />
              </td>
              <td className="p-4 text-slate-300 font-mono">{job.priority}</td>
              <td className="p-4 text-slate-400 font-mono">
                {job.retry_count} / {job.max_retries}
              </td>
              <td className="p-4 text-slate-500 text-xs">
                {new Date(job.created_at).toLocaleString()}
              </td>
              <td className="p-4 text-right">
                <Link
                  to={`/jobs/${job.id}`}
                  className="inline-flex items-center text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
