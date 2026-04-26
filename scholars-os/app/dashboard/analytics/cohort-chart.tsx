'use client'

import dynamic from 'next/dynamic'

const CohortIncidentsChart = dynamic(
  () => import('./cohort-incidents-chart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[240px] w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
    ),
  }
)

const CohortStudentsChart = dynamic(
  () => import('./cohort-students-chart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[180px] w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
    ),
  }
)

type CohortPoint = { label: string; incidents: number; students: number }
type SchoolRow = { school: string; students: number; incidents: number; avgReduction: number | null }

type CohortChartProps = {
  cohortTrend: CohortPoint[]
  schoolBreakdown: SchoolRow[]
}

export function CohortCharts({ cohortTrend, schoolBreakdown }: CohortChartProps) {
  return (
    <div className="space-y-4">
      <div className="os-card">
        <div className="mb-4">
          <h2 className="os-heading">Incident trend — all students</h2>
          <p className="os-body">Total behavioral incidents across caseload by month</p>
        </div>
        <div className="h-[240px] w-full min-h-0 min-w-0 rounded-md bg-[var(--surface-inner)] p-3">
          <CohortIncidentsChart data={cohortTrend} />
        </div>
      </div>

      <div className="os-card">
        <div className="mb-4">
          <h2 className="os-heading">Active students per month</h2>
          <p className="os-body">Students with at least one incident or session logged</p>
        </div>
        <div className="h-[180px] w-full min-h-0 min-w-0 rounded-md bg-[var(--surface-inner)] p-3">
          <CohortStudentsChart data={cohortTrend} />
        </div>
      </div>

      {schoolBreakdown.length > 0 && (
        <div className="os-card">
          <h2 className="os-heading mb-4">By school</h2>
          <div className="space-y-2">
            {schoolBreakdown.map(row => (
              <div
                key={row.school}
                className="flex items-center justify-between rounded-md bg-[var(--surface-inner)] px-4 py-3"
              >
                <p className="os-subhead">{row.school}</p>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="os-caption">Students</p>
                    <p className="os-data-sm">{row.students}</p>
                  </div>
                  <div>
                    <p className="os-caption">Incidents (30d)</p>
                    <p className="os-data-sm">{row.incidents}</p>
                  </div>
                  <div>
                    <p className="os-caption">Avg reduction</p>
                    <p
                      className={`os-data-sm ${
                        row.avgReduction === null
                          ? ''
                          : row.avgReduction >= 0
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-regression)]'
                      }`}
                    >
                      {row.avgReduction === null
                        ? 'n/a'
                        : `${row.avgReduction >= 0 ? '↓' : '↑'} ${Math.abs(row.avgReduction)}%`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
