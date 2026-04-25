import Link from 'next/link'
import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { IntelligencePanel } from './intelligence-panel'
import { GraduationBanner } from '@/components/ui/graduation-banner'
import { StudentExportButton } from '@/components/student-export-button'
import { ProfileHeader } from './profile-header'
import { StudentStatusControl } from './student-status-control'
import { StudentCharts } from './student-charts'
import {
  normalizeStudentSection,
  type StudentSectionId,
} from './student-section-ids'
import { StudentSectionTabs } from './student-section-tabs'
import { ScrollReveal } from './scroll-reveal'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'
import {
  SessionsSection,
  SessionsSectionSkeleton,
} from './sections/sessions-section'
import {
  IncidentsSection,
  IncidentsSectionSkeleton,
} from './sections/incidents-section'
import {
  PlansSection,
  PlansSectionSkeleton,
} from './sections/plans-section'
import {
  OverviewSection,
  OverviewSectionSkeleton,
} from './sections/overview-section'

type StudentDetailPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ section?: string }>
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: StudentDetailPageProps) {
  const { id: studentId } = await params
  const sp = await searchParams
  const section: StudentSectionId = normalizeStudentSection(sp?.section)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) redirect('/login')

  const isOrgAdmin = profile.role === 'owner' || profile.role === 'assistant'

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Run access check in parallel with the header data — saves a serial
  // round-trip. Owner/assistant access is also enforced by the `where` on
  // the student lookup (tenant scope + canAccessStudent), so a failed auth
  // simply leads to the same redirect after the awaits resolve.
  const [
    authorized,
    student,
    currentIncidentCount30d,
    totalSessionsForHeader,
    recentGoalRowsForHeader,
  ] = await Promise.all([
    canAccessStudent(profile.id, profile.role, studentId, tenant.id),
    prisma.student.findFirst({
      where: { id: studentId, tenant_id: tenant.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        grade: true,
        school: true,
        district: true,
        status: true,
        referral_source: true,
        presenting_problem: true,
        intake_date: true,
        session_format: true,
        assigned_counselor_id: true,
        baseline_incident_count: true,
        baseline_window_start: true,
        baseline_window_end: true,
        general_notes: true,
        escalation_active: true,
        intake_files: true,
      },
    }),
    prisma.behavioralIncident.count({
      where: {
        tenant_id: tenant.id,
        student_id: studentId,
        incident_date: { gte: thirtyDaysAgo },
      },
    }),
    prisma.session.count({
      where: { student_id: studentId, tenant_id: tenant.id },
    }),
    prisma.session.findMany({
      where: {
        student_id: studentId,
        tenant_id: tenant.id,
        goal_completion_rate: { not: null },
      },
      orderBy: { session_date: 'desc' },
      take: 5,
      select: { goal_completion_rate: true },
    }),
  ])

  if (!authorized) redirect('/dashboard/students')
  if (!student) notFound()

  const avgGoalRateForHeader =
    recentGoalRowsForHeader.length > 0
      ? Math.round(
          recentGoalRowsForHeader.reduce(
            (s, r) => s + (r.goal_completion_rate ?? 0),
            0
          ) / recentGoalRowsForHeader.length
        )
      : null

  return (
    <div className="os-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="os-label os-breadcrumb-crumb">
            Dashboard
          </Link>
          <span
            className="os-label text-[var(--text-quaternary)]"
            aria-hidden
          >
            /
          </span>
          <Link
            href="/dashboard/students"
            className="os-label os-breadcrumb-crumb"
          >
            Students
          </Link>
          <span
            className="os-label text-[var(--text-quaternary)]"
            aria-hidden
          >
            /
          </span>
          <span className="os-label os-breadcrumb-crumb os-breadcrumb-crumb--current">
            {student.first_name} {student.last_name}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StudentExportButton
            studentId={student.id}
            studentName={`${student.first_name} ${student.last_name}`}
          />
          <a
            href={`/api/students/${student.id}/report`}
            target="_blank"
            rel="noopener noreferrer"
            className="os-btn-secondary"
            title="Every number here represents a real student."
          >
            District progress report
          </a>
        </div>
      </div>

      {student.status === 'graduated' && <GraduationBanner />}

      <ProfileHeader
        firstName={student.first_name}
        lastName={student.last_name}
        grade={student.grade}
        school={student.school}
        district={student.district}
        status={student.status}
        statusSlot={
          isOrgAdmin ? (
            <StudentStatusControl
              studentId={student.id}
              currentStatus={student.status}
            />
          ) : undefined
        }
        referralSource={student.referral_source}
        intakeDate={student.intake_date.toISOString()}
        baselineIncidents={student.baseline_incident_count}
        currentIncidents={currentIncidentCount30d}
        totalSessions={totalSessionsForHeader}
        avgGoalRate={avgGoalRateForHeader}
      />

      <StudentSectionTabs studentId={student.id} active={section} />

      {section === 'sessions' && (
        <Suspense fallback={<SessionsSectionSkeleton />}>
          <SessionsSection studentId={student.id} tenantId={tenant.id} />
        </Suspense>
      )}

      {section === 'incidents' && (
        <Suspense fallback={<IncidentsSectionSkeleton />}>
          <IncidentsSection
            studentId={student.id}
            tenantId={tenant.id}
            canDelete={isOrgAdmin}
          />
        </Suspense>
      )}

      {section === 'overview' && (
        <div className="space-y-6">
          <Suspense fallback={<PlansSectionSkeleton />}>
            <PlansSection studentId={student.id} tenantId={tenant.id} />
          </Suspense>

          <Suspense fallback={<OverviewSectionSkeleton />}>
            <OverviewSection
              studentId={student.id}
              tenantId={tenant.id}
              isOrgAdmin={isOrgAdmin}
              baselineIncidentCount={student.baseline_incident_count}
              baselineWindowStart={student.baseline_window_start}
              baselineWindowEnd={student.baseline_window_end}
              currentIncidentCount30d={currentIncidentCount30d}
              presentingProblem={student.presenting_problem}
              generalNotes={student.general_notes}
              referralSource={student.referral_source}
              sessionFormat={student.session_format}
              intakeDate={student.intake_date}
              intakeFilesRaw={student.intake_files}
              assignedCounselorId={student.assigned_counselor_id}
            />
          </Suspense>

          <Suspense
            fallback={
              <div className="os-card animate-pulse" style={{ minHeight: 200 }} aria-hidden />
            }
          >
            <ScrollReveal>
              <IntelligencePanel
                studentId={student.id}
                escalationActive={student.escalation_active}
              />
            </ScrollReveal>
          </Suspense>
        </div>
      )}

      {section === 'charts' && (
        <ScrollReveal>
          <StudentCharts studentId={student.id} />
        </ScrollReveal>
      )}

    </div>
  )
}
