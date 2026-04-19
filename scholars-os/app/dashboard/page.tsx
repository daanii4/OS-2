import type { Prisma } from '@prisma/client'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CaseloadExport } from '@/components/CaseloadExport'
import { DashboardLayout, OwnerGreeting } from './components/dashboard-layout'
import { DashboardKPIRow } from './components/dashboard-kpi-row'
import { KPIRowSkeleton } from './components/dashboard-kpi-skeleton'
import { DashboardChartSection } from './components/dashboard-chart-section'
import {
  DashboardSidePanel,
  DashboardSidePanelSkeleton,
} from './components/dashboard-side-panel'
import { DashboardStudentList } from './components/dashboard-student-list'
import { StudentListSkeleton } from './components/dashboard-student-list-skeleton'

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

  // Fast queries for the shell: escalation banner, caseload total/schools,
  // greeting count. Heavy aggregations stream in below behind Suspense.
  const [
    escalatedStudent,
    caseloadTotalCount,
    activeStudentCountForGreeting,
    caseloadSchoolRows,
  ] = await Promise.all([
    prisma.student.findFirst({
      where: escalationWhere,
      select: { id: true, first_name: true, last_name: true },
      orderBy: { updated_at: 'desc' },
    }),
    prisma.student.count({ where: studentScope }),
    isOrgView
      ? prisma.student.count({ where: { ...studentScope, status: 'active' } })
      : Promise.resolve(0),
    isOrgView
      ? prisma.student.findMany({
          where: { tenant_id: tenant.id },
          select: { school: true },
          distinct: ['school'],
          orderBy: { school: 'asc' },
        })
      : Promise.resolve([]),
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

  const escalatedStudentId = escalatedStudent?.id ?? null
  const escalatedStudentName = escalatedStudent
    ? `${escalatedStudent.first_name} ${escalatedStudent.last_name}`
    : null
  const caseloadSchools = caseloadSchoolRows.map(row => row.school)

  const desktopBody = (
    <>
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

      {isOrgView && (
        <div className="os-card-interactive relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-sans text-sm font-semibold text-slate-900">
                Export Caseload Report
              </h3>
              <p className="mt-0.5 font-sans text-xs text-slate-500">
                Generate a PDF caseload report for district meetings
              </p>
            </div>
          </div>
          <CaseloadExport schools={caseloadSchools} />
        </div>
      )}

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-[14px] lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
        <DashboardChartSection variant="desktop" />

        <Suspense fallback={<DashboardSidePanelSkeleton />}>
          <DashboardSidePanel
            studentScope={studentScope}
            studentScopeClauses={studentScopeClauses}
            tenantId={tenant.id}
            periodStart={periodStart}
            now={now}
          />
        </Suspense>
      </div>

      <Suspense fallback={<StudentListSkeleton />}>
        <DashboardStudentList
          studentScope={studentScope}
          studentScopeClauses={studentScopeClauses}
          caseloadTotalCount={caseloadTotalCount}
          periodStart={periodStart}
          now={now}
          variant="desktop"
        />
      </Suspense>
    </>
  )

  const mobileBody = (
    <>
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

      <DashboardChartSection variant="mobile" />

      <Suspense fallback={<StudentListSkeleton />}>
        <DashboardStudentList
          studentScope={studentScope}
          studentScopeClauses={studentScopeClauses}
          caseloadTotalCount={caseloadTotalCount}
          periodStart={periodStart}
          now={now}
          variant="mobile"
        />
      </Suspense>
    </>
  )

  return (
    <DashboardLayout
      profileName={profile.name}
      profileEmail={profile.email}
      profileRole={profile.role}
      showOrgNav={isOrgView}
      escalatedStudentId={escalatedStudentId}
      escalatedStudentName={escalatedStudentName}
      escalationReason={escalatedAnalysis?.escalation_reason ?? null}
      desktopChildren={desktopBody}
      mobileChildren={mobileBody}
      greetingChildren={
        isOrgView ? (
          <OwnerGreeting
            profileName={profile.name}
            profileRole={profile.role}
            activeStudents={activeStudentCountForGreeting}
          />
        ) : null
      }
    />
  )
}
