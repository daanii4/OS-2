import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AddIncidentForm } from './add-incident-form'
import { AddSessionForm } from './add-session-form'
import { AIPanel } from './ai-panel'
import { AssignCounselorForm } from './assign-counselor-form'
import { BaselineForm } from './baseline-form'
import { CreatePlanForm } from './create-plan-form'
import { parseIntakeFiles } from '@/lib/types/intake-file'
import { GraduationBanner } from '@/components/ui/graduation-banner'
import { EmptyState } from '@/components/ui/empty-state'
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

  const [student, counselors, progressResponse, statusLogs] = await Promise.all([
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

  const currentIncidentCount = progressResponse
  const baseline = student.baseline_incident_count
  const reductionPct =
    baseline && baseline > 0
      ? Number((((baseline - currentIncidentCount) / baseline) * 100).toFixed(0))
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
        <a
          href={`/api/students/${student.id}/report`}
          target="_blank"
          rel="noopener noreferrer"
          className="os-btn-secondary"
          title="Every number here represents a real student."
        >
          Export District Report
        </a>
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
        currentIncidents={currentIncidentCount}
        totalSessions={totalSessions}
        avgGoalRate={avgGoalRate}
      />

      <StudentSectionTabs studentId={student.id} active={section} />
      {section === 'sessions' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <AddSessionForm studentId={student.id} />
            <div className="os-card">
              <h3 className="os-heading mb-3">Session history</h3>
              {student.sessions.length === 0 ? (
                <EmptyState
                  icon={
                    <img
                      src="/logo-mark.png"
                      alt=""
                      className="h-10 w-10 object-contain opacity-40"
                    />
                  }
                  title="No sessions logged yet"
                  body="Write what happened. Character is built in the small moments."
                />
              ) : (
                <ul className="space-y-2">
                  {student.sessions.map(session => (
                    <li key={session.id} className="rounded-md bg-[var(--surface-inner)] p-3">
                      <p className="os-subhead capitalize">
                        {session.session_type.replace(/_/g, ' ')} ·{' '}
                        <span
                          className={
                            session.attendance_status === 'attended'
                              ? 'text-[var(--color-success)]'
                              : session.attendance_status === 'no_show'
                                ? 'text-[var(--color-regression)]'
                                : 'text-[var(--text-secondary)]'
                          }
                        >
                          {session.attendance_status.replace(/_/g, ' ')}
                        </span>
                      </p>
                      <p className="os-caption">
                        <span className="os-data-sm">
                          {new Date(session.session_date).toLocaleDateString()}
                        </span>{' '}
                        · <span className="os-data-sm">{session.duration_minutes}</span>m ·{' '}
                        {session.session_format}
                      </p>
                      {session.goals_attempted !== null &&
                        session.goals_met !== null &&
                        session.goal_completion_rate !== null && (
                          <p className="os-caption">
                            Goals:{' '}
                            <span className="os-data-sm">
                              {session.goals_met}/{session.goals_attempted}
                            </span>{' '}
                            (
                            <span
                              className={
                                session.goal_completion_rate >= 70
                                  ? 'os-data-sm text-[var(--color-success)]'
                                  : 'os-data-sm'
                              }
                            >
                              {session.goal_completion_rate.toFixed(0)}%
                            </span>
                            )
                          </p>
                        )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
      )}
      {section === 'incidents' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <AddIncidentForm studentId={student.id} />
            <div className="os-card">
              <h3 className="os-heading mb-3">Incident history</h3>
              {student.incidents.length === 0 ? (
                <EmptyState
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-[var(--olive-400)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  }
                  title="No incidents on record"
                  body="A clean record is worth celebrating."
                />
              ) : (
                <ul className="space-y-2">
                  {student.incidents.map(incident => (
                    <li key={incident.id} className="rounded-md bg-[var(--surface-inner)] p-3">
                      <p className="os-subhead capitalize">
                        {incident.incident_type.replace(/_/g, ' ')} ·{' '}
                        <span
                          className={
                            incident.severity === 'high'
                              ? 'text-[var(--color-error)]'
                              : incident.severity === 'medium'
                                ? 'text-[var(--color-regression)]'
                                : 'text-[var(--color-success)]'
                          }
                        >
                          {incident.severity}
                        </span>
                      </p>
                      <p className="os-caption">
                        <span className="os-data-sm">
                          {new Date(incident.incident_date).toLocaleDateString()}
                        </span>{' '}
                        · {incident.reported_by}
                      </p>
                      {incident.suspension_days !== null && (
                        <p className="os-caption">
                          Suspension:{' '}
                          <span className="os-data-sm">{incident.suspension_days}d</span>
                        </p>
                      )}
                      <p className="os-body mt-1">{incident.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
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
                <p className="os-data-hero mt-2">{currentIncidentCount}</p>
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
          <div className="grid gap-4 lg:grid-cols-2">
            <CreatePlanForm studentId={student.id} />
            <div className="os-card">
              <h3 className="os-heading mb-3">Success plans</h3>
              {student.success_plans.length === 0 ? (
                <EmptyState
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-[var(--olive-400)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  }
                  title="No success plans yet"
                  body="Goals tell the story behind the numbers."
                />
              ) : (
                <ul className="space-y-2">
                  {student.success_plans.map(plan => (
                    <li key={plan.id} className="rounded-md bg-[var(--surface-inner)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="os-subhead">Target: {plan.target_reduction_pct}% reduction</p>
                        <span
                          className={`rounded-[var(--radius-sm)] px-2 py-0.5 os-caption font-medium uppercase tracking-[0.07em] ${
                            plan.status === 'active'
                              ? 'bg-[var(--olive-100)] text-[var(--olive-800)] border border-[var(--olive-200)]'
                              : 'bg-gray-50 text-gray-400 border border-gray-100'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </div>
                      <p className="os-body mt-1">{plan.goal_statement}</p>
                      <p className="os-caption mt-1">
                        {plan.plan_duration_weeks}w · {plan.session_frequency.replace(/_/g, ' ')}
                      </p>
                      <p className="os-caption">Focus: {plan.focus_behaviors.join(', ')}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
      )}
    </div>
  )
}
