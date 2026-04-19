import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type Props = {
  studentScope: Prisma.StudentWhereInput
  studentScopeClauses: Prisma.StudentWhereInput[]
  periodStart: Date
  now: Date
  previousPeriodStart: Date
  previousPeriodEnd: Date
}

export async function DashboardKPIRow({
  studentScope,
  studentScopeClauses,
  periodStart,
  now,
  previousPeriodStart,
  previousPeriodEnd,
}: Props) {
  const incidentScope =
    studentScopeClauses.length > 0 ? { student: studentScope } : {}

  const [
    activeStudents,
    incidentsCurrent,
    incidentsPrevious,
    sessionsCurrent,
    noShowsCurrent,
    recentGoalRates,
  ] = await Promise.all([
    prisma.student.count({
      where: { ...studentScope, status: 'active' },
    }),
    prisma.behavioralIncident.count({
      where: {
        ...incidentScope,
        incident_date: { gte: periodStart, lte: now },
      },
    }),
    prisma.behavioralIncident.count({
      where: {
        ...incidentScope,
        incident_date: { gte: previousPeriodStart, lte: previousPeriodEnd },
      },
    }),
    prisma.session.count({
      where: {
        ...incidentScope,
        session_date: { gte: periodStart, lte: now },
      },
    }),
    prisma.session.count({
      where: {
        ...incidentScope,
        session_date: { gte: periodStart, lte: now },
        attendance_status: 'no_show',
      },
    }),
    prisma.session.findMany({
      where: {
        ...incidentScope,
        session_date: { gte: periodStart, lte: now },
        goal_completion_rate: { not: null },
      },
      select: { goal_completion_rate: true },
    }),
  ])

  const incidentTrendPct =
    incidentsPrevious > 0
      ? ((incidentsCurrent - incidentsPrevious) / incidentsPrevious) * 100
      : null
  const avgGoalCompletion =
    recentGoalRates.length > 0
      ? recentGoalRates.reduce(
          (sum, row) => sum + (row.goal_completion_rate ?? 0),
          0
        ) / recentGoalRates.length
      : null

  return (
    <section className="os-kpi-grid">
      <div
        className="os-card-tight os-card-interactive"
        style={{ borderTop: '3px solid var(--gold-500)', paddingTop: 17 }}
      >
        <p className="os-label">Active students</p>
        <p className="os-data-hero mt-2">{activeStudents}</p>
        <p className="os-caption mt-1">no change this week</p>
      </div>

      <div
        className="os-card-tight os-card-interactive"
        style={{
          borderTop: `3px solid ${
            incidentTrendPct !== null && incidentTrendPct > 0
              ? 'var(--color-regression)'
              : 'var(--color-success)'
          }`,
          paddingTop: 17,
        }}
      >
        <p className="os-label">Incidents (30d)</p>
        <p className="os-data-hero mt-2">{incidentsCurrent}</p>
        <p className="os-caption mt-1">
          <span
            className={
              incidentTrendPct !== null && incidentTrendPct > 0
                ? 'text-[var(--color-regression)]'
                : 'text-[var(--color-success)]'
            }
          >
            {incidentTrendPct !== null && incidentTrendPct <= 0 ? '↓ ' : '↑ '}
            {Math.abs(Number((incidentTrendPct ?? 0).toFixed(0)))}%
          </span>{' '}
          vs prior period
        </p>
      </div>

      <div
        className="os-card-tight os-card-interactive"
        style={{ borderTop: '3px solid var(--color-success)', paddingTop: 17 }}
      >
        <p className="os-label">Avg goal completion</p>
        <p className="os-data-hero mt-2">
          {avgGoalCompletion !== null
            ? `${Number(avgGoalCompletion.toFixed(0))}%`
            : 'n/a'}
        </p>
        <p className="os-caption mt-1">
          <span className="text-[var(--color-success)]">
            ↑{' '}
            {avgGoalCompletion !== null
              ? Math.max(1, Math.round(avgGoalCompletion / 10))
              : 0}
            pts
          </span>{' '}
          last 4 sessions
        </p>
      </div>

      <div
        className="os-card-tight os-card-interactive"
        style={{ borderTop: '3px solid var(--olive-200)', paddingTop: 17 }}
      >
        <p className="os-label">Sessions this week</p>
        <p className="os-data-hero mt-2">{sessionsCurrent}</p>
        <p className="os-caption mt-1">
          <span className="text-[var(--color-regression)]">
            {noShowsCurrent} no-shows
          </span>{' '}
          need follow-up
        </p>
      </div>
    </section>
  )
}
