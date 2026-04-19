import { Suspense } from 'react'
import type { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CaseloadExport } from '@/components/CaseloadExport'
import { DashboardLayout } from './components/DashboardLayout'
import { DashboardKPIRow } from './components/DashboardKPIRow'
import { DashboardStudentList } from './components/DashboardStudentList'
import { DashboardMetricsPanel } from './components/DashboardMetricsPanel'
import { DashboardChartIsland } from './components/DashboardChartIsland'
import { KPIRowSkeleton } from './components/KPIRowSkeleton'
import { StudentListSkeleton } from './components/StudentListSkeleton'
import { MetricsPanelSkeleton } from './components/MetricsPanelSkeleton'

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

  const escalationWhere: Prisma.StudentWhereInput = {
    AND: [{ escalation_active: true }, ...studentScopeClauses],
  }

  // Fast queries only — shell renders before slower streamed sections
  const [escalatedStudent, caseloadSchoolRows, activeStudents, caseloadTotalCount] =
    await Promise.all([
      prisma.student.findFirst({
        where: escalationWhere,
        select: { id: true, first_name: true, last_name: true },
        orderBy: { updated_at: 'desc' },
      }),
      isOrgView
        ? prisma.student.findMany({
            where: { tenant_id: tenant.id },
            select: { school: true },
            distinct: ['school'],
            orderBy: { school: 'asc' },
          })
        : Promise.resolve([]),
      prisma.student.count({ where: { ...studentScope, status: 'active' } }),
      prisma.student.count({ where: studentScope }),
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

  const escalatedStudentName = escalatedStudent
    ? `${escalatedStudent.first_name} ${escalatedStudent.last_name}`
    : null
  const escalatedStudentId = escalatedStudent?.id ?? null

  const caseloadSchools = caseloadSchoolRows.map(row => row.school)

  return (
    <DashboardLayout
      profileName={profile.name}
      profileEmail={profile.email}
      profileRole={profile.role}
      showOrgNav={isOrgView}
      escalatedStudentId={escalatedStudentId}
      escalatedStudentName={escalatedStudentName}
      escalationReason={escalatedAnalysis?.escalation_reason ?? null}
      activeStudents={activeStudents}
      caseloadExport={
        isOrgView ? <CaseloadExport schools={caseloadSchools} /> : undefined
      }
    >
      {/* KPI cards — stream in behind skeleton */}
      <Suspense fallback={<KPIRowSkeleton />}>
        <DashboardKPIRow
          studentScope={studentScope}
          studentScopeClauses={studentScopeClauses}
          periodStart={periodStart}
          now={now}
          previousPeriodStart={previousPeriodStart}
          previousPeriodEnd={previousPeriodEnd}
        />
      </Suspense>

      {/* Primary 2-col grid: chart left, metrics right */}
      <div className="grid min-w-0 max-w-full grid-cols-1 gap-[14px] lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
        {/* Chart island — client component, fetches its own data */}
        <DashboardChartIsland />

        {/* Metrics panel — streams in behind skeleton */}
        <Suspense fallback={<MetricsPanelSkeleton />}>
          <DashboardMetricsPanel
            studentScope={studentScope}
            tenantId={tenant.id}
            periodStart={periodStart}
            now={now}
          />
        </Suspense>
      </div>

      {/* Student list — streams in behind skeleton */}
      <Suspense fallback={<StudentListSkeleton />}>
        <DashboardStudentList
          studentScope={studentScope}
          studentScopeClauses={studentScopeClauses}
          caseloadTotalCount={caseloadTotalCount}
          periodStart={periodStart}
          now={now}
        />
      </Suspense>
    </DashboardLayout>
  )
}
