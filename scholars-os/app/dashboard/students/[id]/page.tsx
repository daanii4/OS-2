import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { IncidentsTab } from '@/components/incidents/IncidentsTab'
import { AddSessionForm } from './add-session-form'
import { SessionHistoryPanel } from './session-history-panel'
import { PlansListPanel } from './plans-list-panel'
import { AIPanel } from './ai-panel'
import { AssignCounselorForm } from './assign-counselor-form'
import { BaselineForm } from './baseline-form'
import { CreatePlanForm } from './create-plan-form'
import { parseIntakeFiles } from '@/lib/types/intake-file'
import { GraduationBanner } from '@/components/ui/graduation-banner'
import { StudentExportButton } from '@/components/student-export-button'
import { ProfileHeader } from './profile-header'
import { StudentStatusControl } from './student-status-control'
import { StudentCharts } from './student-charts'
import { normalizeStudentSection } from './student-section-ids'
import { StudentSectionTabs } from './student-section-tabs'
import { ScrollReveal } from './scroll-reveal'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

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
  const section = normalizeStudentSection(sp?.section)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) redirect('/login')

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) redirect('/dashboard/students')

  const isOrgAdmin = profile.role === 'owner' || profile.role === 'assistant'

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [student, counselors, currentIncidentCount30d, statusLogs] = await Promise.all([
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
        success_plans: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            status: true,
            goal_statement: true,
            target_reduction_pct: true,
            plan_duration_weeks: true,
            focus_behaviors: true,
            session_frequency: true,
            created_at: true,
          },
        },
        sessions: {
          orderBy: { session_date: 'desc' },
          select: {
            id: true,
            session_date: true,
            session_type: true,
            session_format: true,
            duration_minutes: true,
            attendance_status: true,
            session_summary: true,
            goals_attempted: true,
            goals_met: true,
            goal_completion_rate: true,
            created_at: true,
          },
        },
        incidents: {
          orderBy: { incident_date: 'desc' },
          select: {
            id: true,
            incident_date: true,
            incident_type: true,
            severity: true,
            suspension_days: true,
            reported_by: true,
            description: true,
            logged_by: true,
            created_at: true,
          },
        },
      },
    }),
    isOrgAdmin
      ? prisma.profile.findMany({
          where: {
            active: true,
            role: { in: ['counselor', 'assistant', 'owner'] },
            tenant_id: tenant.id,
          },
          select: { id: true, name: true, role: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
    prisma.behavioralIncident.count({
      where: {
        tenant_id: tenant.id,
        student_id: studentId,
        incident_date: { gte: thirtyDaysAgo },
      },
    }),
    isOrgAdmin
      ? prisma.studentStatusLog.findMany({
          where: { tenant_id: tenant.id, student_id: studentId },
          orderBy: { created_at: 'desc' },
          take: 50,
          select: {
            id: true,
            old_status: true,
            new_status: true,
            note: true,
            created_at: true,
            changed_by_profile: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ])

  if (!student) notFound()

  const intakeFiles = parseIntakeFiles(student.intake_files)

  const baseline = student.baseline_incident_count
  const reductionPct =
    baseline && baseline > 0
      ? Number((((baseline - currentIncidentCount30d) / baseline) * 100).toFixed(0))
      : null

  const totalSessions = student.sessions.length
  const attendedSessions = student.sessions.filter(s => s.attendance_status === 'attended').length
  const recentGoalRates = student.sessions
    .filter(s => s.goal_completion_rate !== null)
    .slice(0, 5)
  const avgGoalRate =
    recentGoalRates.length > 0
      ? Math.round(
          recentGoalRates.reduce((s, sess) => s + (sess.goal_completion_rate ?? 0), 0) /
            recentGoalRates.length
        )
      : null

  return (
    <div className="os-page">
      {/* Breadcrumb + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="os-label os-breadcrumb-crumb">
            Dashboard
          </Link>
          <span className="os-label text-[var(--text-quaternary)]" aria-hidden>
            /
          </span>
          <Link href="/dashboard/students" className="os-label os-breadcrumb-crumb">
            Students
          </Link>
          <span className="os-label text-[var(--text-quaternary)]" aria-hidden>
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

      {/* Dark profile header — §3.7 */}
      <ProfileHeader
        firstName={student.first_name}
        lastName={student.last_name}
        grade={student.grade}
        school={student.school}
        district={student.district}
        status={student.status}
        statusSlot={
          isOrgAdmin ? (
            <StudentStatusControl studentId={student.id} currentStatus={student.status} />
          ) : undefined
        }
        referralSource={student.referral_source}
        intakeDate={student.intake_date.toISOString()}
        baselineIncidents={student.baseline_incident_count}
        currentIncidents={currentIncidentCount30d}
        totalSessions={totalSessions}
        avgGoalRate={avgGoalRate}
      />

      <StudentSectionTabs studentId={student.id} active={section} />
      {section === 'sessions' && (
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <AddSessionForm studentId={student.id} />
          <SessionHistoryPanel sessions={student.sessions} />
        </div>
      )}
      {section === 'incidents' && (
        <IncidentsTab
          studentId={student.id}
          initialIncidents={student.incidents}
          canDeleteIncidents={isOrgAdmin}
        />
      )}
      {section === 'overview' && (
          <>
            {/* Progress KPI row */}
            <section className="os-kpi-grid">
              <div
                className="os-card-tight"
                style={{ borderTop: '3px solid var(--gold-500)', paddingTop: 17 }}
              >
                <p className="os-label">Baseline incidents</p>
                <p className="os-data-hero mt-2">{baseline ?? '—'}</p>
                <p className="os-caption mt-1">
                  {student.baseline_window_start && student.baseline_window_end
                    ? `${new Date(student.baseline_window_start).toLocaleDateString()} – ${new Date(student.baseline_window_end).toLocaleDateString()}`
                    : 'Baseline not set'}
                </p>
              </div>

              <div
                className="os-card-tight"
                style={{
                  borderTop: `3px solid ${reductionPct !== null && reductionPct >= 0 ? 'var(--color-success)' : 'var(--color-regression)'}`,
                  paddingTop: 17,
                }}
              >
                <p className="os-label">Incidents (30d)</p>
                <p className="os-data-hero mt-2">{currentIncidentCount30d}</p>
                <p className="os-caption mt-1">
                  {reductionPct !== null ? (
                    <span
                      className={
                        reductionPct >= 0
                          ? 'text-[var(--color-success)]'
                          : 'text-[var(--color-regression)]'
                      }
                    >
                      {reductionPct >= 0 ? `↓ ${reductionPct}%` : `↑ ${Math.abs(reductionPct)}%`} vs
                      baseline
                    </span>
                  ) : (
                    'No baseline set'
                  )}
                </p>
              </div>

              <div
                className="os-card-tight"
                style={{ borderTop: '3px solid var(--olive-200)', paddingTop: 17 }}
              >
                <p className="os-label">Sessions</p>
                <p className="os-data-hero mt-2">{totalSessions}</p>
                <p className="os-caption mt-1">{attendedSessions} attended</p>
              </div>

              <div
                className="os-card-tight"
                style={{ borderTop: '3px solid var(--color-success)', paddingTop: 17 }}
              >
                <p className="os-label">Avg goal rate</p>
                <p className="os-data-hero mt-2">
                  {avgGoalRate !== null ? `${avgGoalRate}%` : '—'}
                </p>
                <p className="os-caption mt-1">Last {recentGoalRates.length} sessions</p>
              </div>
            </section>

            {/* Profile details */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="os-card">
                <h2 className="os-heading mb-3">Intake profile</h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="os-label">Referral source</dt>
                    <dd className="os-body">{student.referral_source}</dd>
                  </div>
                  <div>
                    <dt className="os-label">Session format</dt>
                    <dd className="os-body capitalize">{student.session_format}</dd>
                  </div>
                  <div>
                    <dt className="os-label">Intake date</dt>
                    <dd className="os-body">
                      {new Date(student.intake_date).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="os-card">
                <h2 className="os-heading mb-2">Presenting problem</h2>
                <p className="os-body">{student.presenting_problem}</p>
                {student.general_notes && (
                  <>
                    <h3 className="os-label mt-4 mb-1">General notes</h3>
                    <p className="os-body">{student.general_notes}</p>
                  </>
                )}
              </div>
            </div>

            {intakeFiles.length > 0 && (
              <div className="os-card">
                <h2 className="os-heading mb-3">Intake documents</h2>
                <p className="os-caption mb-4">
                  Prior referrals, assessments, or school records (PDF/Word). Optional fields below
                  mirror the referral form for each file.
                </p>
                <ul className="space-y-4">
                  {intakeFiles.map(file => (
                    <li
                      key={file.url}
                      className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-inner)] p-4"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="os-subhead text-[var(--olive-700)] underline"
                      >
                        {file.name}
                      </a>
                      <p className="os-caption mt-1">
                        Uploaded {new Date(file.uploaded_at).toLocaleString()}
                      </p>
                      {(file.referred_by ||
                        file.brief_description ||
                        file.referral_date) && (
                        <dl className="mt-3 space-y-2 border-t border-[var(--border-subtle)] pt-3">
                          {file.referred_by && (
                            <div>
                              <dt className="os-label">Referred by</dt>
                              <dd className="os-body">{file.referred_by}</dd>
                            </div>
                          )}
                          {file.brief_description && (
                            <div>
                              <dt className="os-label">Brief description</dt>
                              <dd className="os-body">{file.brief_description}</dd>
                            </div>
                          )}
                          {file.referral_date && (
                            <div>
                              <dt className="os-label">Referral date</dt>
                              <dd className="os-body">
                                {new Date(file.referral_date).toLocaleDateString()}
                              </dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isOrgAdmin && statusLogs.length > 0 && (
              <div className="os-card">
                <h2 className="os-heading mb-3">Status history</h2>
                <ul className="space-y-3">
                  {statusLogs.map(log => (
                    <li
                      key={log.id}
                      className="border-b border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0"
                    >
                      <p className="os-body">
                        <span className="capitalize">{log.old_status}</span>
                        {' → '}
                        <span className="capitalize">{log.new_status}</span>
                      </p>
                      <p className="os-caption">
                        {log.changed_by_profile.name} ·{' '}
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                      {log.note && <p className="os-body mt-1">{log.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Counselor assignment + Baseline (owner/assistant only) */}
            {isOrgAdmin && (
              <div className="grid gap-4 lg:grid-cols-2">
                <AssignCounselorForm
                  studentId={student.id}
                  counselors={counselors}
                  currentCounselorId={student.assigned_counselor_id}
                />
                <BaselineForm
                  studentId={student.id}
                  canEdit={true}
                  initialBaselineIncidentCount={student.baseline_incident_count}
                  initialBaselineWindowStart={student.baseline_window_start?.toISOString() ?? null}
                  initialBaselineWindowEnd={student.baseline_window_end?.toISOString() ?? null}
                />
              </div>
            )}

            {!isOrgAdmin && (
              <div className="os-card">
                <h3 className="os-heading mb-2">Baseline</h3>
                <p className="os-body">
                  Baseline incidents:{' '}
                  <span className="os-data">{student.baseline_incident_count ?? 'not set'}</span>
                </p>
                {student.baseline_window_start && student.baseline_window_end && (
                  <p className="os-caption mt-1">
                    {new Date(student.baseline_window_start).toLocaleDateString()} –{' '}
                    {new Date(student.baseline_window_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </>
      )}
      {section === 'charts' && (
        <ScrollReveal>
          <StudentCharts studentId={student.id} />
        </ScrollReveal>
      )}
      {section === 'ai' && (
        <ScrollReveal>
          <AIPanel studentId={student.id} escalationActive={student.escalation_active} />
        </ScrollReveal>
      )}
      {section === 'plans' && (
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <CreatePlanForm studentId={student.id} />
          <PlansListPanel plans={student.success_plans} />
        </div>
      )}
    </div>
  )
}
