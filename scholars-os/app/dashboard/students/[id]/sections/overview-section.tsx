import type { StudentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { AssignCounselorForm } from '../assign-counselor-form'
import { BaselineForm } from '../baseline-form'
import { parseIntakeFiles } from '@/lib/types/intake-file'

type Props = {
  studentId: string
  tenantId: string
  isOrgAdmin: boolean
  baselineIncidentCount: number | null
  baselineWindowStart: Date | null
  baselineWindowEnd: Date | null
  currentIncidentCount30d: number
  presentingProblem: string
  generalNotes: string | null
  referralSource: string
  sessionFormat: string
  intakeDate: Date
  intakeFilesRaw: unknown
  assignedCounselorId: string | null
}

type OverviewStatusLog = {
  id: string
  old_status: StudentStatus
  new_status: StudentStatus
  note: string | null
  created_at: Date
  changed_by_profile: { name: string }
}

export async function OverviewSection({
  studentId,
  tenantId,
  isOrgAdmin,
  baselineIncidentCount,
  baselineWindowStart,
  baselineWindowEnd,
  currentIncidentCount30d,
  presentingProblem,
  generalNotes,
  referralSource,
  sessionFormat,
  intakeDate,
  intakeFilesRaw,
  assignedCounselorId,
}: Props) {
  const studentScope = { student_id: studentId, tenant_id: tenantId }

  const overviewPromises: [
    Promise<number>,
    Promise<number>,
    Promise<{ goal_completion_rate: number | null }[]>,
    Promise<{ id: string; name: string; role: string }[] | undefined>,
    Promise<OverviewStatusLog[] | undefined>,
  ] = [
    prisma.session.count({ where: studentScope }),
    prisma.session.count({
      where: { ...studentScope, attendance_status: 'attended' },
    }),
    prisma.session.findMany({
      where: { ...studentScope, goal_completion_rate: { not: null } },
      orderBy: { session_date: 'desc' },
      take: 5,
      select: { goal_completion_rate: true },
    }),
    isOrgAdmin
      ? prisma.profile.findMany({
          where: {
            active: true,
            role: { in: ['counselor', 'assistant', 'owner'] },
            tenant_id: tenantId,
          },
          select: { id: true, name: true, role: true },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve(undefined),
    isOrgAdmin
      ? prisma.studentStatusLog.findMany({
          where: { tenant_id: tenantId, student_id: studentId },
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
      : Promise.resolve(undefined),
  ]

  const [totalSessions, attendedSessions, recentGoalRates, counselors, statusLogs] =
    await Promise.all(overviewPromises)

  const avgGoalRate =
    recentGoalRates.length > 0
      ? Math.round(
          recentGoalRates.reduce(
            (s, sess) => s + (sess.goal_completion_rate ?? 0),
            0
          ) / recentGoalRates.length
        )
      : null

  const baseline = baselineIncidentCount
  const reductionPct =
    baseline && baseline > 0
      ? Number(
          (((baseline - currentIncidentCount30d) / baseline) * 100).toFixed(0)
        )
      : null

  const intakeFiles = parseIntakeFiles(intakeFilesRaw)

  return (
    <>
      <section className="os-kpi-grid">
        <div
          className="os-card-tight"
          style={{ borderTop: '3px solid var(--gold-500)', paddingTop: 17 }}
        >
          <p className="os-label">Baseline incidents</p>
          <p className="os-data-hero mt-2">{baseline ?? '—'}</p>
          <p className="os-caption mt-1">
            {baselineWindowStart && baselineWindowEnd
              ? `${new Date(baselineWindowStart).toLocaleDateString()} – ${new Date(baselineWindowEnd).toLocaleDateString()}`
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
                {reductionPct >= 0
                  ? `↓ ${reductionPct}%`
                  : `↑ ${Math.abs(reductionPct)}%`}{' '}
                vs baseline
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
          <p className="os-caption mt-1">
            Last {recentGoalRates.length} sessions
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="os-card">
          <h2 className="os-heading mb-3">Intake profile</h2>
          <dl className="space-y-2">
            <div>
              <dt className="os-label">Referral source</dt>
              <dd className="os-body">{referralSource}</dd>
            </div>
            <div>
              <dt className="os-label">Session format</dt>
              <dd className="os-body capitalize">{sessionFormat}</dd>
            </div>
            <div>
              <dt className="os-label">Intake date</dt>
              <dd className="os-body">
                {new Date(intakeDate).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="os-card">
          <h2 className="os-heading mb-2">Presenting problem</h2>
          <p className="os-body">{presentingProblem}</p>
          {generalNotes && (
            <>
              <h3 className="os-label mt-4 mb-1">General notes</h3>
              <p className="os-body">{generalNotes}</p>
            </>
          )}
        </div>
      </div>

      {intakeFiles.length > 0 && (
        <div className="os-card">
          <h2 className="os-heading mb-3">Intake documents</h2>
          <p className="os-caption mb-4">
            Prior referrals, assessments, or school records (PDF/Word). Optional
            fields below mirror the referral form for each file.
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

      {isOrgAdmin && statusLogs && statusLogs.length > 0 && (
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

      {isOrgAdmin && counselors && (
        <div className="grid gap-4 lg:grid-cols-2">
          <AssignCounselorForm
            studentId={studentId}
            counselors={counselors}
            currentCounselorId={assignedCounselorId}
          />
          <BaselineForm
            studentId={studentId}
            canEdit={true}
            initialBaselineIncidentCount={baseline}
            initialBaselineWindowStart={baselineWindowStart?.toISOString() ?? null}
            initialBaselineWindowEnd={baselineWindowEnd?.toISOString() ?? null}
          />
        </div>
      )}

      {!isOrgAdmin && (
        <div className="os-card">
          <h3 className="os-heading mb-2">Baseline</h3>
          <p className="os-body">
            Baseline incidents:{' '}
            <span className="os-data">{baseline ?? 'not set'}</span>
          </p>
          {baselineWindowStart && baselineWindowEnd && (
            <p className="os-caption mt-1">
              {new Date(baselineWindowStart).toLocaleDateString()} –{' '}
              {new Date(baselineWindowEnd).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </>
  )
}

export function OverviewSectionSkeleton() {
  return (
    <div className="space-y-4">
      <section className="os-kpi-grid">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="os-card-tight animate-pulse"
            aria-hidden
            style={{ borderTop: '3px solid var(--olive-200)', paddingTop: 17 }}
          >
            <div className="h-3 w-24 rounded bg-[var(--surface-inner)]" />
            <div className="mt-2 h-8 w-16 rounded bg-[var(--surface-inner)]" />
            <div className="mt-1 h-3 w-20 rounded bg-[var(--surface-inner)]" />
          </div>
        ))}
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="os-card animate-pulse h-40" aria-hidden />
        <div className="os-card animate-pulse h-40" aria-hidden />
      </div>
    </div>
  )
}
