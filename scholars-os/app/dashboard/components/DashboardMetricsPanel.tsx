import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { countRegressionStudents } from '@/lib/dashboard/regression'

type Props = {
  studentScope: Prisma.StudentWhereInput
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

export async function DashboardMetricsPanel({ studentScope, tenantId, periodStart, now }: Props) {
  const scopeFilter =
    Object.keys(studentScope).length > 0 ? { student: studentScope } : {}

  const [sessionsCurrent, noShowsCurrent, statusMixRows, regressionCountFull] = await Promise.all([
    prisma.session.count({
      where: { ...scopeFilter, session_date: { gte: periodStart, lte: now } },
    }),
    prisma.session.count({
      where: {
        ...scopeFilter,
        session_date: { gte: periodStart, lte: now },
        attendance_status: 'no_show',
      },
    }),
    prisma.student.groupBy({
      by: ['status'],
      where: studentScope,
      _count: { _all: true },
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
      {/* Status mix */}
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
              <span className="os-data text-[var(--text-primary)]">{count}</span>
            </div>
          ))}
          {Object.keys(statusMix).length === 0 && (
            <p className="os-body text-[var(--text-tertiary)]">No students yet</p>
          )}
        </div>
      </div>

      {/* Sessions + no-shows */}
      <div className="os-card os-card-interactive">
        <h3 className="os-subhead mb-3">This week</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="os-caption">Sessions completed</span>
            <span className="os-data">{sessionsCurrent}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="os-caption text-[var(--color-regression)]">No-shows</span>
            <span className="os-data text-[var(--color-regression)]">{noShowsCurrent}</span>
          </div>
        </div>
      </div>

      {/* Regression alert */}
      {regressionCountFull > 0 && (
        <div
          className="os-card os-card-interactive min-w-0"
          style={{ borderTop: '3px solid var(--color-regression)', paddingTop: 17 }}
        >
          <h3 className="os-subhead mb-1 text-[var(--color-regression)]">Regression alerts</h3>
          <p className="os-data-hero text-[var(--color-regression)]">{regressionCountFull}</p>
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
