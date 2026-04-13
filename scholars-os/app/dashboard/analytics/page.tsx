import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
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
    allStudents,
    monthlyData,
  ] = await Promise.all([
    prisma.student.count({ where: { status: 'active' } }),

    prisma.behavioralIncident.count({
      where: { incident_date: { gte: thirtyDaysAgo } },
    }),
    prisma.behavioralIncident.count({
      where: { incident_date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),

    prisma.session.count({ where: { session_date: { gte: thirtyDaysAgo } } }),
    prisma.session.count({
      where: { session_date: { gte: thirtyDaysAgo }, attendance_status: 'no_show' },
    }),

    // Per-counselor stats
    prisma.profile.findMany({
      where: { active: true, role: 'counselor' },
      select: {
        id: true,
        name: true,
        _count: { select: { assigned_students: true } },
        assigned_students: {
          where: { status: 'active' },
          select: {
            id: true,
            baseline_incident_count: true,
            incidents: {
              where: { incident_date: { gte: thirtyDaysAgo } },
              select: { id: true },
            },
            sessions: {
              where: { session_date: { gte: thirtyDaysAgo } },
              select: { id: true, goal_completion_rate: true },
            },
          },
        },
      },
    }),

    // All active students for school breakdown
    prisma.student.findMany({
      where: { status: 'active' },
      select: {
        school: true,
        baseline_incident_count: true,
        incidents: {
          where: { incident_date: { gte: thirtyDaysAgo } },
          select: { id: true },
        },
      },
    }),

    // Monthly incident + active student counts
    Promise.all(
      months.map(async m => {
        const [incidents, studentIds] = await Promise.all([
          prisma.behavioralIncident.count({
            where: { incident_date: { gte: m.start, lte: m.end } },
          }),
          prisma.behavioralIncident.findMany({
            where: { incident_date: { gte: m.start, lte: m.end } },
            select: { student_id: true },
            distinct: ['student_id'],
          }),
        ])
        return { label: m.label, incidents, students: studentIds.length }
      })
    ),
  ])

  const incidentTrendPct =
    incidentsPrior30 > 0
      ? Number((((incidentsCurrent30 - incidentsPrior30) / incidentsPrior30) * 100).toFixed(0))
      : null

  // School breakdown
  const schoolMap = new Map<string, { students: number; incidents: number; reductions: number[] }>()
  for (const s of allStudents) {
    const key = s.school
    if (!schoolMap.has(key)) schoolMap.set(key, { students: 0, incidents: 0, reductions: [] })
    const entry = schoolMap.get(key)!
    entry.students++
    entry.incidents += s.incidents.length
    if (s.baseline_incident_count && s.baseline_incident_count > 0) {
      const pct = Number(
        (((s.baseline_incident_count - s.incidents.length) / s.baseline_incident_count) * 100).toFixed(0)
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

  // Counselor performance
  const counselorRows = counselors.map(c => {
    const students = c.assigned_students
    const totalStudents = students.length

    const studentsWithBaseline = students.filter(
      s => s.baseline_incident_count && s.baseline_incident_count > 0
    )
    const avgReduction =
      studentsWithBaseline.length > 0
        ? Math.round(
            studentsWithBaseline.reduce((sum, s) => {
              const current = s.incidents.length
              const baseline = s.baseline_incident_count!
              return sum + ((baseline - current) / baseline) * 100
            }, 0) / studentsWithBaseline.length
          )
        : null

    const totalSessions30d = students.reduce((sum, s) => sum + s.sessions.length, 0)
    const allRates = students.flatMap(s =>
      s.sessions.map(sess => sess.goal_completion_rate).filter(r => r !== null)
    ) as number[]
    const avgGoalRate =
      allRates.length > 0
        ? Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length)
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
      <div className="os-card-tight flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="os-title">Analytics</h1>
          <p className="os-body mt-1">Organization-wide performance — owner and assistant view</p>
        </div>
        <Link href="/dashboard" className="os-btn-secondary">
          Back to dashboard
        </Link>
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
          <p className="os-data-hero mt-2">{counselors.length}</p>
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
