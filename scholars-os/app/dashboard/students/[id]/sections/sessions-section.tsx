import { prisma } from '@/lib/prisma'
import { AddSessionForm } from '../add-session-form'
import { SessionHistoryPanel } from '../session-history-panel'

const sessionHistorySelect = {
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
} as const

type Props = {
  studentId: string
  tenantId: string
}

export async function SessionsSection({ studentId, tenantId }: Props) {
  const sessions = await prisma.session.findMany({
    where: { student_id: studentId, tenant_id: tenantId },
    orderBy: { session_date: 'desc' },
    select: sessionHistorySelect,
  })

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <AddSessionForm studentId={studentId} />
      <SessionHistoryPanel sessions={sessions} />
    </div>
  )
}

export function SessionsSectionSkeleton() {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className="os-card animate-pulse h-72" aria-hidden />
      <div className="os-card animate-pulse h-72" aria-hidden />
    </div>
  )
}
