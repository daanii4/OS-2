import type { Prisma } from '@prisma/client'
import { MeetingStatus } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { safeMeetingFindMany } from '@/lib/meetings-db'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardShell } from './dashboard-shell'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    redirect('/login')
  }

  const isOrgView = profile.role === 'owner' || profile.role === 'assistant'

  const studentScopeClauses: Prisma.StudentWhereInput[] = []
  studentScopeClauses.push({ tenant_id: tenant.id })
  if (!isOrgView) {
    studentScopeClauses.push({ assigned_counselor_id: profile.id })
  }

  const studentScope: Prisma.StudentWhereInput =
    studentScopeClauses.length > 0 ? { AND: studentScopeClauses } : {}

  const now = new Date()
  const periodStart = new Date(now)
  periodStart.setDate(now.getDate() - 29)
  const previousPeriodEnd = new Date(periodStart)
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1)
  const previousPeriodStart = new Date(previousPeriodEnd)
  previousPeriodStart.setDate(previousPeriodEnd.getDate() - 29)

  const studentWhere = studentScopeClauses.length > 0 ? studentScope : undefined
  const escalationWhere: Prisma.StudentWhereInput = {
    AND: [{ escalation_active: true }, ...studentScopeClauses],
  }

  const months = Array.from({ length: 4 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (3 - index), 1)
    const monthStart = new Date(monthDate)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)
    return {
      label: monthDate.toLocaleString('en-US', { month: 'short' }),
      start: monthStart,
      end: monthEnd,
    }
  })

  const [
    activeStudents,
    incidentsCurrent,
    incidentsPrevious,
    sessionsCurrent,
    noShowsCurrent,
    recentGoalRates,
    escalatedStudent,
    incidentsCurrentRows,
    recentStudents,
    monthlyIncidentCounts,
  ] = await Promise.all([
    prisma.student.count({
      where: {
        ...studentScope,
        status: 'active',
      },
    }),
    prisma.behavioralIncident.count({
      where: {
        ...(studentScopeClauses.length > 0 ? { student: studentScope } : {}),
        incident_date: {
          gte: periodStart,
          lte: now,
        },
      },
    }),
    prisma.behavioralIncident.count({
      where: {
        ...(studentScopeClauses.length > 0 ? { student: studentScope } : {}),
        incident_date: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
    }),
    prisma.session.count({
      where: {
        ...(studentScopeClauses.length > 0 ? { student: studentScope } : {}),
        session_date: {
          gte: periodStart,
          lte: now,
        },
      },
    }),
    prisma.session.count({
      where: {
        ...(studentScopeClauses.length > 0 ? { student: studentScope } : {}),
        session_date: {
          gte: periodStart,
          lte: now,
        },
        attendance_status: 'no_show',
      },
    }),
    prisma.session.findMany({
      where: {
        ...(studentScopeClauses.length > 0 ? { student: studentScope } : {}),
        session_date: {
          gte: periodStart,
          lte: now,
        },
        goal_completion_rate: { not: null },
      },
      select: { goal_completion_rate: true },
    }),
    prisma.student.findFirst({
      where: escalationWhere,
      select: { first_name: true, last_name: true },
      orderBy: { updated_at: 'desc' },
    }),
    prisma.behavioralIncident.findMany({
      where: {
        ...(studentScopeClauses.length > 0 ? { student: studentScope } : {}),
        incident_date: {
          gte: periodStart,
          lte: now,
        },
      },
      select: { student_id: true },
    }),
    prisma.student.findMany({
      where: studentWhere,
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        grade: true,
        school: true,
        status: true,
        baseline_incident_count: true,
      },
    }),
    Promise.all(
      months.map(month =>
        prisma.behavioralIncident.count({
          where: {
            ...(studentScopeClauses.length > 0 ? { student: studentScope } : {}),
            incident_date: {
              gte: month.start,
              lte: month.end,
            },
          },
        })
      )
    ),
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
  const incidentCountByStudent = incidentsCurrentRows.reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.student_id] = (acc[row.student_id] ?? 0) + 1
      return acc
    },
    {}
  )

  const chartMax = Math.max(...monthlyIncidentCounts, 1)
  const topOffset = isOrgView ? 120 : 64
  const escalatedStudentName = escalatedStudent
    ? `${escalatedStudent.first_name} ${escalatedStudent.last_name}`
    : null

  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  weekEnd.setHours(23, 59, 59, 999)

  const upcomingMeetingsRaw = await safeMeetingFindMany({
    where: {
      tenant_id: tenant.id,
      ...(isOrgView ? {} : { counselor_id: profile.id }),
      meeting_date: { gte: now, lte: weekEnd },
      status: { in: [MeetingStatus.scheduled, MeetingStatus.rescheduled] },
    },
    orderBy: { meeting_date: 'asc' },
    select: {
      id: true,
      title: true,
      meeting_date: true,
      duration_minutes: true,
      location: true,
      meeting_type: true,
      status: true,
      counselor: { select: { name: true } },
      student: { select: { first_name: true, last_name: true } },
    },
  })

  const upcomingMeetings = upcomingMeetingsRaw.map(m => ({
    id: m.id,
    title: m.title,
    meeting_date: m.meeting_date.toISOString(),
    duration_minutes: m.duration_minutes,
    location: m.location,
    meeting_type: m.meeting_type,
    status: m.status,
    counselorName: m.counselor.name,
    studentLabel: m.student
      ? `${m.student.first_name} ${m.student.last_name}`
      : null,
    showCounselorName: isOrgView,
  }))

  return (
    <DashboardShell
      profileName={profile.name}
      profileRole={profile.role}
      activeStudents={activeStudents}
      incidentsCurrent={incidentsCurrent}
      incidentTrendPct={incidentTrendPct}
      sessionsCurrent={sessionsCurrent}
      noShowsCurrent={noShowsCurrent}
      avgGoalCompletion={avgGoalCompletion}
      recentStudents={recentStudents}
      incidentCountByStudent={incidentCountByStudent}
      monthLabels={months.map(month => month.label)}
      monthlyIncidentCounts={monthlyIncidentCounts}
      chartMax={chartMax}
      escalatedStudentName={escalatedStudentName}
      topOffset={topOffset}
      upcomingMeetings={upcomingMeetings}
    />
  )
}
