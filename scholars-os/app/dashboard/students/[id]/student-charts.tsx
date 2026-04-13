'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'

const StudentIncidentChart = dynamic(
  () => import('./student-incident-chart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
    ),
  }
)

const StudentGoalChart = dynamic(
  () => import('./student-goal-chart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
    ),
  }
)

const StudentSuspensionChart = dynamic(
  () => import('./student-suspension-chart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[180px] w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
    ),
  }
)

type Period = 'week' | 'month' | 'year'

type ChartData = {
  incidentFrequency: { label: string; total: number }[]
  goalCompletion: { label: string; rate: number }[]
  suspensionDays: { label: string; days: number }[]
}

type StudentChartsProps = {
  studentId: string
}

export function StudentCharts({ studentId }: StudentChartsProps) {
  const [period, setPeriod] = useState<Period>('month')
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCharts = useCallback(async (p: Period) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/students/${studentId}/charts?period=${p}`)
      if (!res.ok) throw new Error('Failed to load chart data')
      const json = await res.json()
      setData(json.data)
    } catch {
      setError('Could not load charts')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchCharts(period)
  }, [period, fetchCharts])

  const incidentData = useMemo(() => data?.incidentFrequency ?? [], [data])
  const goalData = useMemo(() => data?.goalCompletion ?? [], [data])
  const suspensionData = useMemo(() => data?.suspensionDays ?? [], [data])

  const PeriodToggle = (
    <div className="rounded-md bg-[var(--surface-inner)] p-1">
      {(['week', 'month', 'year'] as Period[]).map(p => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`rounded px-3 py-1 os-caption capitalize transition-colors ${
            period === p ? 'bg-white font-semibold shadow-sm' : ''
          }`}
        >
          {p === 'week' ? 'Wk' : p === 'month' ? 'Mo' : 'Yr'}
        </button>
      ))}
    </div>
  )

  if (error) {
    return (
      <div className="os-card">
        <p className="os-body text-[var(--color-regression)]">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="os-card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="os-heading">Incident frequency</h3>
            <p className="os-body">Office referrals, suspensions, and behavioral incidents</p>
          </div>
          {PeriodToggle}
        </div>

        {loading ? (
          <div className="h-[200px] w-full animate-pulse rounded-sm bg-[var(--surface-inner)]" />
        ) : incidentData.length === 0 ? (
          <p className="os-body">No incident data for this period.</p>
        ) : (
          <div className="h-[200px] w-full min-w-0 rounded-md bg-[var(--surface-inner)] p-3">
            <StudentIncidentChart data={incidentData} />
          </div>
        )}
      </div>

      <div className="os-card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="os-heading">Goal completion rate</h3>
            <p className="os-body">% of session goals met per period</p>
          </div>
          {PeriodToggle}
        </div>

        {loading ? (
          <div className="h-[200px] w-full animate-pulse rounded-sm bg-[var(--surface-inner)]" />
        ) : goalData.length === 0 ? (
          <p className="os-body">No session goal data for this period.</p>
        ) : (
          <div className="h-[200px] w-full min-w-0 rounded-md bg-[var(--surface-inner)] p-3">
            <StudentGoalChart data={goalData} />
          </div>
        )}
      </div>

      {!loading && suspensionData.some(s => s.days > 0) && (
        <div className="os-card">
          <div className="mb-4">
            <h3 className="os-heading">Suspension days</h3>
            <p className="os-body">Total suspension days per period</p>
          </div>
          <div className="h-[180px] w-full min-w-0 rounded-md bg-[var(--surface-inner)] p-3">
            <StudentSuspensionChart data={suspensionData} />
          </div>
        </div>
      )}
    </div>
  )
}
