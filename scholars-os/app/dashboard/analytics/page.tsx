import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'
import { CohortCharts } from './cohort-chart'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')
  if (profile.role !== 'owner' && profile.role !== 'assistant') redirect('/dashboard')

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    redirect('/dashboard')
  }

  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  // Last 6 monthly windows for cohort trend
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: d.toLocaleString('en-US', { month: 'short' }),
      start: d,
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    }
  })

  const [
    totalActiveStudents,
    incidentsCurrent30,
    incidentsPrior30,
    totalSessions30,
    noShows30,
    counselors,
    activeStudentsForAnalytics,
    incidentCountByStudent30d,
    counselorSessionAgg,
    monthlyData,
  ] = await Promise.all([
    prisma.student.count({ where: { tenant_id: tenant.id, status: 'active' } }),

    prisma.behavioralIncident.count({
      where: { tenant_id: tenant.id, incident_date: { gte: thirtyDaysAgo } },
    }),
    prisma.behavioralIncident.count({
      where: {
        tenant_id: tenant.id,
        incident_date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),

    prisma.session.count({
      where: { tenant_id: tenant.id, session_date: { gte: thirtyDaysAgo } },
    }),
    prisma.session.count({
      where: {
        tenant_id: tenant.id,
        session_date: { gte: thirtyDaysAgo },
        attendance_status: 'no_show',
      },
    }),

    prisma.profile.findMany({
      where: { active: true, role: 'counselor', tenant_id: tenant.id },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.student.findMany({
      where: { tenant_id: tenant.id, status: 'active' },
      select: {
        id: true,
        school: true,
        baseline_incident_count: true,
        assigned_counselor_id: true,
      },
    }),

    prisma.behavioralIncident.groupBy({
      by: ['student_id'],
      where: {
        tenant_id: tenant.id,
        incident_date: { gte: thirtyDaysAgo },
        student: { status: 'active', tenant_id: tenant.id },
      },
      _count: { _all: true },
    }),

    prisma.session.groupBy({
      by: ['counselor_id'],
      where: {
        tenant_id: tenant.id,
        session_date: { gte: thirtyDaysAgo },
      },
      _count: { _all: true },
      _avg: { goal_completion_rate: true },
    }),

    Promise.all(
      months.map(async m => {
        const [incidents, studentIds] = await Promise.all([
          prisma.behavioralIncident.count({
            where: {
              tenant_id: tenant.id,
              incident_date: { gte: m.start, lte: m.end },
            },
          }),
          prisma.behavioralIncident.findMany({
            where: {
              tenant_id: tenant.id,
              incident_date: { gte: m.start, lte: m.end },
            },
            select: { student_id: true },
            distinct: ['student_id'],
          }),
        ])
        return { label: m.label, incidents, students: studentIds.length }
      })
    ),
  ])

  const incidentCountByStudentId = incidentCountByStudent30d.reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.student_id] = row._count._all
      return acc
    },
    {}
  )

  const sessionStatsByCounselorId = counselorSessionAgg.reduce<
    Record<string, { sessions: number; avgGoal: number | null }>
  >((acc, row) => {
    acc[row.counselor_id] = {
      sessions: row._count._all,
      avgGoal:
        row._avg.goal_completion_rate !== null && row._avg.goal_completion_rate !== undefined
          ? row._avg.goal_completion_rate
          : null,
    }
    return acc
  }, {})

  const studentsByCounselorId = new Map<
    string,
    Array<{
      id: string
      school: string
      baseline_incident_count: number | null
      assigned_counselor_id: string | null
    }>
  >()
  for (const s of activeStudentsForAnalytics) {
    if (!s.assigned_counselor_id) continue
    const list = studentsByCounselorId.get(s.assigned_counselor_id)
    if (list) list.push(s)
    else studentsByCounselorId.set(s.assigned_counselor_id, [s])
  }

  const incidentTrendPct =
    incidentsPrior30 > 0
      ? Number((((incidentsCurrent30 - incidentsPrior30) / incidentsPrior30) * 100).toFixed(0))
      : null

  // School breakdown (incident counts from groupBy, not per-row arrays)
  const schoolMap = new Map<string, { students: number; incidents: number; reductions: number[] }>()
  for (const s of activeStudentsForAnalytics) {
    const key = s.school
    if (!schoolMap.has(key)) schoolMap.set(key, { students: 0, incidents: 0, reductions: [] })
    const entry = schoolMap.get(key)!
    entry.students++
    const inc = incidentCountByStudentId[s.id] ?? 0
    entry.incidents += inc
    if (s.baseline_incident_count && s.baseline_incident_count > 0) {
      const pct = Number(
        (((s.baseline_incident_count - inc) / s.baseline_incident_count) * 100).toFixed(0)
      )
      entry.reductions.push(pct)
    }
  }
  const schoolBreakdown = Array.from(schoolMap.entries())
    .map(([school, data]) => ({
      school,
      students: data.students,
      incidents: data.incidents,
      avgReduction:
        data.reductions.length > 0
          ? Math.round(data.reductions.reduce((a, b) => a + b, 0) / data.reductions.length)
          : null,
    }))
    .sort((a, b) => b.students - a.students)

  // Counselor performance (aggregates at DB — no per-incident row fetch)
  const counselorRows = counselors.map(c => {
    const students = studentsByCounselorId.get(c.id) ?? []
    const totalStudents = students.length

    const studentsWithBaseline = students.filter(
      s => s.baseline_incident_count && s.baseline_incident_count > 0
    )
    const avgReduction =
      studentsWithBaseline.length > 0
        ? Math.round(
            studentsWithBaseline.reduce((sum, s) => {
              const current = incidentCountByStudentId[s.id] ?? 0
              const baseline = s.baseline_incident_count!
              return sum + ((baseline - current) / baseline) * 100
            }, 0) / studentsWithBaseline.length
          )
        : null

    const sess = sessionStatsByCounselorId[c.id]
    const totalSessions30d = sess?.sessions ?? 0
    const avgGoalRate =
      sess?.avgGoal !== null && sess?.avgGoal !== undefined
        ? Math.round(sess.avgGoal)
        : null

    return {
      id: c.id,
      name: c.name,
      totalStudents,
      avgReduction,
      totalSessions30d,
      avgGoalRate,
    }
  })

  return (
    <div className="os-page">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-[var(--olive-800)] p-5">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 85% 50%, rgba(214, 160, 51, 0.15) 0%, transparent 65%)',
          }}
          aria-hidden
        />
        <div className="absolute left-0 top-0 h-full w-1 bg-[var(--gold-500)]" aria-hidden />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="os-title text-white">Impact Overview</h1>
            <p className="os-body mt-1 text-white/60">
              Organization-wide performance — Attendance, Discipline, Academics
            </p>
          </div>
          <Link
            href="/dashboard"
            className="os-btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/15"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      {/* Org KPIs */}
      <section className="os-kpi-grid">
        <div className="os-card-tight" style={{ borderTop: '3px solid var(--gold-500)', paddingTop: 17 }}>
          <p className="os-label">Active students</p>
          <p className="os-data-hero mt-2">{totalActiveStudents}</p>
          <p className="os-caption mt-1">Across all counselors</p>
        </div>

        <div
          className="os-card-tight"
          style={{
            borderTop: `3px solid ${incidentTrendPct !== null && incidentTrendPct > 0 ? 'var(--color-regression)' : 'var(--color-success)'}`,
            paddingTop: 17,
          }}
        >
          <p className="os-label">Incidents (30d)</p>
          <p className="os-data-hero mt-2">{incidentsCurrent30}</p>
          <p className="os-caption mt-1">
            {incidentTrendPct !== null ? (
              <span
                className={
                  incidentTrendPct <= 0
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-regression)]'
                }
              >
                {incidentTrendPct <= 0 ? `↓ ${Math.abs(incidentTrendPct)}%` : `↑ ${incidentTrendPct}%`}
              </span>
            ) : null}{' '}
            vs prior 30d
          </p>
        </div>

        <div className="os-card-tight" style={{ borderTop: '3px solid var(--olive-200)', paddingTop: 17 }}>
          <p className="os-label">Sessions (30d)</p>
          <p className="os-data-hero mt-2">{totalSessions30}</p>
          <p className="os-caption mt-1">
            <span className="text-[var(--color-regression)]">{noShows30} no-shows</span>
          </p>
        </div>

        <div className="os-card-tight" style={{ borderTop: '3px solid var(--olive-200)', paddingTop: 17 }}>
          <p className="os-label">Counselors</p>
          <p className="os-data-hero mt-2">{counselorRows.length}</p>
          <p className="os-caption mt-1">Active on caseload</p>
        </div>
      </section>

      {/* Charts (client component — Recharts) */}
      <CohortCharts cohortTrend={monthlyData} schoolBreakdown={schoolBreakdown} />

      {/* Counselor performance table */}
      {counselorRows.length > 0 && (
        <div className="os-card">
          <h2 className="os-heading mb-4">Counselor performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  {['Counselor', 'Students', 'Avg reduction', 'Sessions (30d)', 'Avg goal rate'].map(h => (
                    <th key={h} className="pb-2 pr-6 text-left os-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {counselorRows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-[var(--border-default)] ${
                      i % 2 === 1 ? 'bg-[var(--surface-inner)]' : ''
                    }`}
                  >
                    <td className="py-3 pr-6 os-subhead">{row.name}</td>
                    <td className="py-3 pr-6 os-data-sm">{row.totalStudents}</td>
                    <td className="py-3 pr-6">
                      {row.avgReduction === null ? (
                        <span className="os-caption">n/a</span>
                      ) : (
                        <span
                          className={`os-data-sm ${
                            row.avgReduction >= 0
                              ? 'text-[var(--color-success)]'
                              : 'text-[var(--color-regression)]'
                          }`}
                        >
                          {row.avgReduction >= 0 ? `↓ ${row.avgReduction}%` : `↑ ${Math.abs(row.avgReduction)}%`}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-6 os-data-sm">{row.totalSessions30d}</td>
                    <td className="py-3 os-data-sm">
                      {row.avgGoalRate !== null ? `${row.avgGoalRate}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
