'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Props = {
  data: { label: string; incidents: number }[]
  chartMax: number
}

export default function DashboardIncidentChart({ data, chartMax }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(92,107,70,0.08)" />
        <XAxis
          dataKey="label"
          tick={{
            fill: '#6E8050',
            fontSize: 10,
            fontFamily: 'var(--font-ibm-plex-mono), monospace',
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, chartMax]}
          tick={{
            fill: '#6E8050',
            fontSize: 10,
            fontFamily: 'var(--font-ibm-plex-mono), monospace',
          }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(44,56,32,0.08)' }}
          contentStyle={{
            background: '#2D3820',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontFamily: 'var(--font-ibm-plex-mono), monospace',
            fontSize: 12,
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}
          itemStyle={{ color: '#fff' }}
        />
        <Bar dataKey="incidents" fill="var(--olive-600)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
