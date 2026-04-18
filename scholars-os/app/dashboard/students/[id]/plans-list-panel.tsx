export type PlanListItem = {
  id: string
  status: string
  goal_statement: string
  target_reduction_pct: number
  plan_duration_weeks: number
  focus_behaviors: string[]
  session_frequency: string
}

export function PlansListPanel({ plans }: { plans: PlanListItem[] }) {
  return (
    <div className="os-student-section-panel flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="os-student-section-panel__header">
        <h3 className="os-student-section-panel__title">Success plans</h3>
        <p className="os-student-section-panel__subtitle">
          {plans.length} plan{plans.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="os-student-section-panel__body os-student-section-panel__body--scroll flex-1">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[0_0_9999px_0] bg-[var(--olive-50)]">
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
            </div>
            <p className="font-[family-name:var(--font-dm-serif)] text-base text-[var(--text-primary)]">
              No success plans yet
            </p>
            <p className="mt-1 max-w-sm os-caption text-[var(--text-secondary)]">
              Goals tell the story behind the numbers.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {plans.map(plan => (
              <li
                key={plan.id}
                className="rounded-[7px] border border-[rgba(92,107,70,0.1)] bg-[var(--surface-inner)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="os-subhead">Target: {plan.target_reduction_pct}% reduction</p>
                  <span
                    className={`rounded-[var(--radius-sm)] px-2 py-0.5 os-caption font-medium uppercase tracking-[0.07em] ${
                      plan.status === 'active'
                        ? 'border border-[var(--olive-200)] bg-[var(--olive-100)] text-[var(--olive-800)]'
                        : 'border border-gray-100 bg-gray-50 text-gray-400'
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
  )
}
