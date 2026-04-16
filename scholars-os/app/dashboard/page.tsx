import type { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CaseloadExport } from './caseload-export'
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
    caseloadSchoolRows,
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
    isOrgView
      ? prisma.student.findMany({
          where: { tenant_id: tenant.id },
          select: { school: true },
          distinct: ['school'],
          orderBy: { school: 'asc' },
        })
      : Promise.resolve([]),
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

  const topOffset = isOrgView ? 120 : 64
  const caseloadSchools = caseloadSchoolRows.map(row => row.school)

  // meetings table — UI removed per client request April 2026, table retained for data safety
  const escalatedStudentName = escalatedStudent
    ? `${escalatedStudent.first_name} ${escalatedStudent.last_name}`
    : null


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
      escalatedStudentName={escalatedStudentName}
      topOffset={topOffset}
      caseloadExport={
        isOrgView ? <CaseloadExport schools={caseloadSchools} /> : undefined
      }
    />
  )
}
