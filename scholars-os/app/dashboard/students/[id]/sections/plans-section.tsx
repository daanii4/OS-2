import { prisma } from '@/lib/prisma'
import { CreatePlanForm } from '../create-plan-form'
import { PlansListPanel } from '../plans-list-panel'

const planListSelect = {
  id: true,
  status: true,
  goal_statement: true,
  target_reduction_pct: true,
  plan_duration_weeks: true,
  focus_behaviors: true,
  session_frequency: true,
  created_at: true,
} as const

type Props = {
  studentId: string
  tenantId: string
}

export async function PlansSection({ studentId, tenantId }: Props) {
  const plans = await prisma.successPlan.findMany({
    where: { student_id: studentId, tenant_id: tenantId },
    orderBy: { created_at: 'desc' },
    select: planListSelect,
  })

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <CreatePlanForm studentId={studentId} />
      <PlansListPanel plans={plans} />
    </div>
  )
}

export function PlansSectionSkeleton() {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className="os-card animate-pulse h-72" aria-hidden />
      <div className="os-card animate-pulse h-72" aria-hidden />
    </div>
  )
}
