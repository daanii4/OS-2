import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { EmptyState } from '@/components/ui/empty-state'
import { countRegressionStudents } from '@/lib/dashboard/regression'

type Props = {
  studentScope: Prisma.StudentWhereInput
  studentScopeClauses: Prisma.StudentWhereInput[]
  tenantId: string
  periodStart: Date
  now: Date
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-[var(--olive-100)] text-[var(--olive-800)] border border-[var(--olive-200)]'
    case 'graduated':
      return 'bg-[var(--gold-100)] text-[#7A5A10] border border-[var(--gold-200)]'
    case 'transferred':
      return 'bg-gray-100 text-gray-600 border border-gray-200'
    case 'escalated':
      return 'bg-[#FEF2F2] text-[var(--color-escalation)] border border-[#FECACA]'
    default:
      return 'bg-gray-50 text-gray-400 border border-gray-100'
  }
}

export async function DashboardSidePanel({
  studentScope,
  studentScopeClauses,
  tenantId,
  periodStart,
  now,
}: Props) {
  const incidentScope =
    studentScopeClauses.length > 0 ? { student: studentScope } : {}

  const [statusMixRows, sessionsCurrent, noShowsCurrent, regressionCountFull] =
    await Promise.all([
      prisma.student.groupBy({
        by: ['status'],
        where: studentScope,
        _count: { _all: true },
      }),
      prisma.session.count({
        where: {
          ...incidentScope,
          session_date: { gte: periodStart, lte: now },
        },
      }),
      prisma.session.count({
        where: {
          ...incidentScope,
          session_date: { gte: periodStart, lte: now },
          attendance_status: 'no_show',
        },
      }),
      countRegressionStudents(prisma, {
        tenantId,
        studentWhere: studentScope,
        periodStart,
        now,
      }),
    ])

  const statusMix = statusMixRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all
    return acc
  }, {})

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-[14px]">
      <div className="os-card os-card-interactive min-w-0">
        <h3 className="os-subhead mb-3">Student status mix</h3>
        <div className="space-y-2">
          {Object.entries(statusMix).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span
                className={`rounded-[var(--radius-sm)] px-2 py-0.5 os-caption font-medium uppercase tracking-[0.07em] ${getStatusBadgeClass(status)}`}
              >
                {status}
              </span>
              <span className="os-data text-[var(--text-primary)]">
                {count}
              </span>
            </div>
          ))}
          {Object.keys(statusMix).length === 0 && (
            <EmptyState
              icon={
                <img
                  src="/logo-mark.png"
                  alt=""
                  className="h-10 w-10 object-contain opacity-40"
                />
              }
              title="No students assigned yet"
              body="Every student here is someone worth showing up for."
            />
          )}
        </div>
      </div>

      <div className="os-card os-card-interactive">
        <h3 className="os-subhead mb-3">This week</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="os-caption">Sessions completed</span>
            <span className="os-data">{sessionsCurrent}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="os-caption text-[var(--color-regression)]">
              No-shows
            </span>
            <span className="os-data text-[var(--color-regression)]">
              {noShowsCurrent}
            </span>
          </div>
        </div>
      </div>

      {regressionCountFull > 0 && (
        <div
          className="os-card os-card-interactive min-w-0"
          style={{
            borderTop: '3px solid var(--color-regression)',
            paddingTop: 17,
          }}
        >
          <h3 className="os-subhead mb-1 text-[var(--color-regression)]">
            Regression alerts
          </h3>
          <p className="os-data-hero text-[var(--color-regression)]">
            {regressionCountFull}
          </p>
          <p className="os-caption mt-1">
            {regressionCountFull === 1 ? 'student' : 'students'} above baseline
          </p>
          <p className="os-caption mt-2 max-w-[14rem] text-[var(--text-tertiary)]">
            A setback isn&apos;t the story — it&apos;s a chapter.
          </p>
        </div>
      )}
    </div>
  )
}

export function DashboardSidePanelSkeleton() {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-[14px]">
      {[0, 1].map(i => (
        <div
          key={i}
          className="os-card animate-pulse min-w-0"
          aria-hidden
        >
          <div className="mb-3 h-4 w-32 rounded bg-[var(--surface-inner)]" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-[var(--surface-inner)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--surface-inner)]" />
          </div>
        </div>
      ))}
    </div>
  )
}
