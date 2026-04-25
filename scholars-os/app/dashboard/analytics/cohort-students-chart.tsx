'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
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
  data: { label: string; students: number }[]
}

const chartConfig = {
  students: {
    label: 'Students active',
    color: 'var(--gold-500)',
  },
} satisfies ChartConfig

const tickCommon = {
  fontSize: 10,
  fill: 'var(--text-tertiary)',
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
} as const

export default function CohortStudentsChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full min-h-0 min-w-0">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--input)" strokeDasharray="4 12" />
        <XAxis dataKey="label" tick={tickCommon} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={tickCommon} axisLine={false} tickLine={false} />
        <ChartTooltip
          cursor={{ strokeDasharray: '3 3', stroke: 'var(--text-tertiary)', strokeOpacity: 0.5 }}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Line
          type="monotone"
          dataKey="students"
          stroke="var(--color-students)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-students)', r: 3 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
