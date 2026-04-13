'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Props = {
  data: { label: string; students: number }[]
}

export default function CohortStudentsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(92,107,70,0.08)" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6E8050', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#6E8050', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#2D3820',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 12,
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}
          itemStyle={{ color: '#fff' }}
        />
        <Line
          type="monotone"
          dataKey="students"
          name="Students active"
          stroke="var(--gold-500)"
          strokeWidth={2}
          dot={{ fill: 'var(--gold-500)', r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
