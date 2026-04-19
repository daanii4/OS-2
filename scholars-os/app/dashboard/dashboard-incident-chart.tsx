'use client'

import { useEffect, useState } from 'react'
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

function formatTickLabel(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [, m, d] = raw.split('-')
    return `${Number(m)}/${Number(d)}`
  }
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split('-')
    return `${Number(m)}/${y.slice(2)}`
  }
  return raw
}

function xAxisInterval(isMobile: boolean, dataLength: number, dense: boolean): number | 'preserveStartEnd' {
  if (!isMobile) {
    return dense ? 0 : 'preserveStartEnd'
  }
  if (dataLength <= 7) return 0
  if (dataLength > 14) return Math.floor(dataLength / 6)
  return Math.max(1, Math.floor(dataLength / 6))
}

export default function DashboardIncidentChart({ data, chartMax }: Props) {
  const dense = data.length > 14
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const xInterval = xAxisInterval(isMobile, data.length, dense)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 24, left: -16, bottom: 0 }}
        maxBarSize={isMobile ? 12 : 24}
        barCategoryGap={isMobile ? '20%' : '15%'}
      >
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
          angle={isMobile ? -45 : dense ? -38 : 0}
          textAnchor={isMobile || dense ? 'end' : 'middle'}
          height={isMobile ? 48 : dense ? 56 : 28}
          interval={xInterval}
          minTickGap={isMobile ? 0 : dense ? 4 : 8}
          tickFormatter={formatTickLabel}
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
