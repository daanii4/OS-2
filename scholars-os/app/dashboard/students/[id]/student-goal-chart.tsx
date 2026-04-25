'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  data: { label: string; rate: number }[]
}

const chartConfig = {
  rate: {
    label: 'Goal completion',
    color: 'var(--olive-600)',
  },
} satisfies ChartConfig

const tickCommon = {
  fontSize: 10,
  fill: 'var(--text-tertiary)',
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
} as const

export default function StudentGoalChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full min-h-0 min-w-0">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--input)" strokeDasharray="4 12" />
        <XAxis dataKey="label" tick={tickCommon} axisLine={false} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          unit="%"
          tick={tickCommon}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip
          cursor={{ fill: 'rgba(44, 56, 32, 0.08)' }}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={value => (
                <div className="flex w-full flex-wrap items-center justify-between gap-2 leading-none">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="text-foreground font-mono font-medium tabular-nums">
                    {`${Number(value).toFixed(0)}%`}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="rate" name="Completion %" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.rate >= 70
                  ? 'var(--color-success)'
                  : entry.rate >= 40
                    ? 'var(--gold-400)'
                    : 'var(--color-regression)'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
