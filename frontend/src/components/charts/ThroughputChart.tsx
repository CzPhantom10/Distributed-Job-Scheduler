import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import type { ThroughputPoint } from '../../types/metrics'

interface ThroughputChartProps {
  data: ThroughputPoint[]
}

export default function ThroughputChart({ data }: ThroughputChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }))

  return (
    <div className="w-full h-80 bg-[#1f2937]/20 border border-[#374151] rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Throughput (last 60m)</h3>
      <div className="w-full h-[calc(100%-24px)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area
              name="Completed"
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorCompleted)"
              strokeWidth={2}
            />
            <Area
              name="Failed"
              type="monotone"
              dataKey="failed"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorFailed)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
