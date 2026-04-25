'use client'

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
  data: { label: string; days: number }[]
}

const chartConfig = {
  days: {
    label: 'Suspension days',
    color: 'var(--color-regression)',
  },
} satisfies ChartConfig

const tickCommon = {
  fontSize: 10,
  fill: 'var(--text-tertiary)',
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
} as const

export default function StudentSuspensionChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full min-h-0 min-w-0">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--input)" strokeDasharray="4 12" />
        <XAxis dataKey="label" tick={tickCommon} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={tickCommon} axisLine={false} tickLine={false} />
        <ChartTooltip
          cursor={{ fill: 'rgba(44, 56, 32, 0.08)' }}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar dataKey="days" fill="var(--color-days)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
