'use client'

import { useId, useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartPlotDotBackground,
  ChartTooltip,
  ChartTooltipContent,
  createOsHatchedBarShape,
  type ChartConfig,
} from '@/components/ui/bar-chart'

type Props = {
  data: { label: string; incidents: number }[]
}

const chartConfig = {
  incidents: {
    label: 'Incidents',
    color: 'var(--olive-600)',
  },
} satisfies ChartConfig

const tickCommon = {
  fontSize: 10,
  fill: 'var(--text-tertiary)',
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
} as const

export default function CohortIncidentsChart({ data }: Props) {
  const hatchId = useId().replace(/:/g, '')
  const dotPatternId = `os-dots-${hatchId}`
  const HatchedBar = useMemo(() => createOsHatchedBarShape(hatchId), [hatchId])

  const maxIncidents = Math.max(0, ...data.map(d => d.incidents))
  const yMax = Math.max(Math.ceil(maxIncidents * 1.18), 1)

  return (
    <ChartContainer config={chartConfig} className="h-full w-full min-h-0 min-w-0">
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 4 }}>
        <ChartPlotDotBackground patternId={dotPatternId} />
        <CartesianGrid vertical={false} stroke="var(--input)" strokeDasharray="4 12" />
        <XAxis dataKey="label" tick={tickCommon} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} domain={[0, yMax]} tick={tickCommon} axisLine={false} tickLine={false} />
        <ChartTooltip
          cursor={{ fill: 'rgba(44, 56, 32, 0.08)' }}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar dataKey="incidents" fill="var(--color-incidents)" shape={HatchedBar} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
