'use client'

import dynamic from 'next/dynamic'
import { startTransition, useCallback, useEffect, useState } from 'react'

const DashboardIncidentChart = dynamic(
  () => import('../dashboard-incident-chart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
    ),
  }
)

type ChartPeriod = 'week' | 'month' | 'year'

type Props = {
  variant?: 'desktop' | 'mobile'
}

export function DashboardChartSection({ variant = 'desktop' }: Props) {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('month')
  const [chartData, setChartData] = useState<
    { label: string; incidents: number }[]
  >([])
  const [chartMax, setChartMax] = useState(1)
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)

  const fetchIncidentChart = useCallback(async (p: ChartPeriod) => {
    setChartLoading(true)
    setChartError(null)
    try {
      const res = await fetch(`/api/dashboard/incident-frequency?period=${p}`)
      if (!res.ok) throw new Error('Failed to load chart')
      const json = (await res.json()) as {
        data: { labels: string[]; incidents: number[]; chartMax: number }
      }
      const d = json.data
      setChartData(
        d.labels.map((label, i) => ({
          label,
          incidents: d.incidents[i] ?? 0,
        }))
      )
      setChartMax(d.chartMax ?? 1)
    } catch {
      setChartError('Could not load incident chart')
    } finally {
      setChartLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIncidentChart(chartPeriod)
  }, [chartPeriod, fetchIncidentChart])

  function handlePeriodChange(p: ChartPeriod) {
    startTransition(() => {
      setChartPeriod(p)
    })
  }

  const periodToggle = (
    <div
      className="flex items-center rounded-full p-1"
      style={{ background: 'var(--surface-inner)' }}
      role="group"
      aria-label="Incident chart time range"
    >
      {(['week', 'month', 'year'] as ChartPeriod[]).map(p => (
        <button
          key={p}
          type="button"
          onClick={() => handlePeriodChange(p)}
          className={`rounded-full px-3 py-1 text-[10px] transition-colors ${
            chartPeriod === p ? 'font-semibold' : 'font-medium'
          }`}
          style={
            chartPeriod === p
              ? { background: 'var(--surface-card)' }
              : { background: 'transparent' }
          }
        >
          {p === 'week' ? 'Wk' : p === 'month' ? 'Mo' : 'Yr'}
        </button>
      ))}
    </div>
  )

  if (variant === 'mobile') {
    return (
      <section className="os-card os-card-interactive">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h2 className="os-subhead">Incident Frequency</h2>
          {periodToggle}
        </div>
        <div className="h-[200px] w-full min-h-0 min-w-0 rounded-md bg-[var(--surface-inner)] p-2">
          {chartError ? (
            <p className="os-body text-[var(--color-regression)]">
              {chartError}
            </p>
          ) : chartLoading ? (
            <div className="h-full w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
          ) : (
            <DashboardIncidentChart data={chartData} chartMax={chartMax} />
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="os-card os-card-interactive min-w-0 overflow-hidden">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="os-heading">Incident Frequency — All Students</h2>
          <p className="os-body">
            Office referrals, suspensions, and behavioral incidents
          </p>
        </div>
        {periodToggle}
      </div>

      <div className="h-[200px] w-full min-h-0 min-w-0 rounded-md bg-[var(--surface-inner)] p-3 sm:h-[240px]">
        {chartError ? (
          <p className="os-body text-[var(--color-regression)]">{chartError}</p>
        ) : chartLoading ? (
          <div className="h-full w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
        ) : (
          <DashboardIncidentChart data={chartData} chartMax={chartMax} />
        )}
      </div>
    </section>
  )
}
