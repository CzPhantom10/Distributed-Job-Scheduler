import React from 'react'
import type { JobEvent } from '../../types/job'
import { Calendar, Play, CheckCircle2, AlertCircle, RefreshCw, XCircle } from 'lucide-react'

interface JobTimelineProps {
  events: JobEvent[]
}

export default function JobTimeline({ events }: JobTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'queued':
        return <Calendar className="h-4 w-4 text-blue-400" />
      case 'claimed':
      case 'running':
        return <Play className="h-4 w-4 text-indigo-400" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-amber-400" />
      case 'retry':
        return <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
      case 'dead':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-rose-400" />
      default:
        return <Calendar className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {events.map((event, idx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {idx !== events.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-[#374151]"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-[#111827] border border-[#374151] flex items-center justify-center">
                    {getIcon(event.event_type)}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-slate-300 font-semibold">
                      Status transitioned to{' '}
                      <span className="text-white capitalize">{event.event_type}</span>
                    </p>
                    {event.message && (
                      <p className="text-xs text-slate-500 mt-1 font-mono">{event.message}</p>
                    )}
                  </div>
                  <div className="text-right text-xs whitespace-nowrap text-slate-500">
                    <time dateTime={event.created_at}>
                      {new Date(event.created_at).toLocaleString()}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
