'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

type Props = {
  data: { label: string; incidents: number }[]
  chartMax: number
}

const chartConfig = {
  incidents: {
    label: 'Incidents',
    color: 'var(--olive-600)',
  },
} satisfies ChartConfig

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

function xAxisInterval(
  isMobile: boolean,
  dataLength: number,
  dense: boolean
): number | 'preserveStartEnd' {
  if (!isMobile) {
    return dense ? 0 : 'preserveStartEnd'
  }
  if (dataLength <= 7) return 0
  if (dataLength > 14) return Math.floor(dataLength / 6)
  return Math.max(1, Math.floor(dataLength / 6))
}

const tickCommon = {
  fontSize: 10,
  fill: 'var(--text-tertiary)',
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
} as const

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
    <ChartContainer config={chartConfig} className="h-full w-full min-h-0 min-w-0">
      <BarChart
        data={data}
        margin={{ top: 8, right: 24, left: -16, bottom: 0 }}
        maxBarSize={isMobile ? 12 : 24}
        barCategoryGap={isMobile ? '20%' : '15%'}
      >
        <CartesianGrid vertical={false} stroke="var(--input)" strokeDasharray="4 12" />
        <XAxis
          dataKey="label"
          tick={tickCommon}
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
          tick={tickCommon}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip
          cursor={{ fill: 'rgba(44, 56, 32, 0.08)' }}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar
          dataKey="incidents"
          fill="var(--color-incidents)"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
