'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

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
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div
      className="
      flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[rgba(92,107,70,0.12)] bg-white
    "
    >
      <div
        className="
        flex flex-shrink-0 items-center justify-between border-b border-[rgba(92,107,70,0.08)] px-5 py-4
      "
      >
        <h2 className="font-[family-name:var(--font-dm-serif)] text-[18px] font-normal text-[#1e2517]">
          Success plans
        </h2>
        <span className="font-mono text-[11px] text-[#6e8050]">
          {plans.length} plan{plans.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto md:max-h-[600px]">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
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
          plans.map(plan => (
            <PlanRow
              key={plan.id}
              plan={plan}
              isExpanded={expandedId === plan.id}
              onToggle={() => setExpandedId(prev => (prev === plan.id ? null : plan.id))}
            />
          ))
        )}
      </div>
    </div>
  )
}

function PlanRow({
  plan,
  isExpanded,
  onToggle,
}: {
  plan: PlanListItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const freq = plan.session_frequency.replace(/_/g, ' ')

  return (
    <div
      className={`
        border-b border-[rgba(92,107,70,0.07)] last:border-b-0
        transition-colors duration-[150ms]
        ${isExpanded ? 'bg-[#f3f7e8]' : 'hover:bg-[#f3f7e8]'}
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="
          flex w-full items-start gap-2.5 px-5 py-3 text-left
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-inset
        "
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="font-sans text-[13px] font-semibold text-[#1e2517]">
              Target: {plan.target_reduction_pct}% reduction
            </span>
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
          <p className="font-sans text-[12px] leading-relaxed text-[#3d4c2c] line-clamp-2">
            {plan.goal_statement}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-[#5C6B46]">
            {plan.plan_duration_weeks}w · {freq}
          </p>
        </div>
        <ChevronRight
          size={16}
          className={`
            mt-0.5 flex-shrink-0 text-[#8a9e69]
            transition-transform duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isExpanded ? 'rotate-90' : ''}
          `}
          aria-hidden
        />
      </button>

      {isExpanded ? (
        <div className="px-5 pb-4">
          <div className="grid gap-3 rounded-[8px] bg-[#eef0e8] p-3.5">
            <div>
              <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">
                Goal statement
              </p>
              <p className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-[#2d3820]">
                {plan.goal_statement}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">
                  Target reduction
                </p>
                <p className="font-mono text-[12px] text-[#2d3820]">{plan.target_reduction_pct}%</p>
              </div>
              <div>
                <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">
                  Duration
                </p>
                <p className="font-mono text-[12px] text-[#2d3820]">{plan.plan_duration_weeks} weeks</p>
              </div>
              <div className="col-span-2">
                <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">
                  Session cadence
                </p>
                <p className="font-sans text-[12px] capitalize text-[#2d3820]">{freq}</p>
              </div>
            </div>
            <div>
              <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">
                Focus behaviors
              </p>
              <p className="font-sans text-[12px] leading-relaxed text-[#2d3820]">
                {plan.focus_behaviors.length > 0 ? plan.focus_behaviors.join(', ') : '—'}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
