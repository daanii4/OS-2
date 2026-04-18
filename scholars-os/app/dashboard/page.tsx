import type { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { countRegressionStudents } from '@/lib/dashboard/regression'
import { CaseloadExport } from '@/components/CaseloadExport'
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

  const studentScope: Prisma.StudentWhereInput = { AND: studentScopeClauses }

  const now = new Date()
  const periodStart = new Date(now)
  periodStart.setDate(now.getDate() - 29)
  const previousPeriodEnd = new Date(periodStart)
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1)
  const previousPeriodStart = new Date(previousPeriodEnd)
  previousPeriodStart.setDate(previousPeriodEnd.getDate() - 29)

  const studentWhere: Prisma.StudentWhereInput = studentScope
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
    caseloadTotalCount,
    regressionCountFull,
    statusMixRows,
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
      select: { id: true, first_name: true, last_name: true },
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
        escalation_active: true,
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
    prisma.student.count({ where: studentWhere }),
    countRegressionStudents(prisma, {
      tenantId: tenant.id,
      studentWhere,
      periodStart,
      now,
    }),
    prisma.student.groupBy({
      by: ['status'],
      where: studentWhere,
      _count: { _all: true },
    }),
  ])

  const escalatedAnalysis = escalatedStudent
    ? await prisma.aiAnalysis.findFirst({
        where: {
          student_id: escalatedStudent.id,
          escalation_flag: true,
          student: studentScope,
        },
        select: { escalation_reason: true },
        orderBy: { created_at: 'desc' },
      })
    : null

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

  const caseloadSchools = caseloadSchoolRows.map(row => row.school)
  const statusMix = statusMixRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all
    return acc
  }, {})

  // meetings table — UI removed per client request April 2026, table retained for data safety
  const escalatedStudentName = escalatedStudent
    ? `${escalatedStudent.first_name} ${escalatedStudent.last_name}`
    : null
  const escalatedStudentId = escalatedStudent?.id ?? null

  return (
    <DashboardShell
      profileName={profile.name}
      profileEmail={profile.email}
      profileRole={profile.role}
      showOrgNav={isOrgView}
      activeStudents={activeStudents}
      incidentsCurrent={incidentsCurrent}
      incidentTrendPct={incidentTrendPct}
      sessionsCurrent={sessionsCurrent}
      noShowsCurrent={noShowsCurrent}
      avgGoalCompletion={avgGoalCompletion}
      recentStudents={recentStudents}
      incidentCountByStudent={incidentCountByStudent}
      escalatedStudentId={escalatedStudentId}
      escalatedStudentName={escalatedStudentName}
      escalationReason={escalatedAnalysis?.escalation_reason ?? null}
      caseloadTotalCount={caseloadTotalCount}
      regressionCountFull={regressionCountFull}
      statusMix={statusMix}
      caseloadExport={
        isOrgView ? <CaseloadExport schools={caseloadSchools} /> : undefined
      }
    />
  )
}
