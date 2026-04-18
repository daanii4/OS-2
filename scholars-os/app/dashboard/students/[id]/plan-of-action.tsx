'use client'

import { toast } from 'sonner'
import { NumberBadge } from '@/components/ui/number-badge'
import type { PlanOfActionData } from '@/lib/ai/validation'
import { queueSessionGoal } from '@/lib/session-goals-queue'

type PlanOfActionPanelProps = {
  studentId: string
  plan: PlanOfActionData
}

export function PlanOfActionPanel({ studentId, plan }: PlanOfActionPanelProps) {
  function handleAddGoal(g: string) {
    queueSessionGoal(studentId, g)
    toast.success('Goal added — open Log session to use it')
  }

  return (
    <section className="rounded-xl border border-[#3d4a2e] bg-[#2d3820] p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="h-2 w-2 shrink-0 rounded-full bg-[#D6A033] motion-safe:animate-pulse" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#D6A033]">
          Plan of Action — Next Session
        </h3>
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(214,160,51,0.2)] bg-[rgba(214,160,51,0.15)] py-0.5 pl-0.5 pr-2 text-xs text-[#e0b44e]">
          <NumberBadge number={plan.milestone_week} variant="ahead" />
          <span>Plan week</span>
        </span>
      </div>

      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.07em] text-white/30">
        This Week&apos;s Target
      </p>
      <p className="mb-4 text-sm leading-relaxed text-white/80">{plan.milestone_target}</p>

      {plan.focus_areas.length > 0 && (
        <>
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.07em] text-white/30">
            Focus Areas
          </p>
          <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-white/75">
            {plan.focus_areas.map((area, i) => (
              <li key={i}>{area}</li>
            ))}
          </ul>
        </>
      )}

      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.07em] text-white/30">
        How to Open
      </p>
      <p className="mb-4 text-sm leading-relaxed text-white/80">{plan.opening_strategy}</p>

      {plan.techniques.length > 0 && (
        <>
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.07em] text-white/30">
            Techniques
          </p>
          <ul className="mb-4 space-y-3">
            {plan.techniques.map((t, i) => (
              <li key={i} className="text-sm text-white/75">
                <span className="font-medium text-white/90">{t.name}</span>
                <span className="text-white/60"> — {t.description}</span>
                {t.source_url ? (
                  <a
                    href={t.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-[#c9a047] underline hover:text-[#e0b44e]"
                  >
                    Source ↗
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.07em] text-white/30">
        Questions to Ask
      </p>
      <ul className="mb-4 space-y-1.5">
        {plan.check_in_questions.map((q, i) => (
          <li key={i} className="flex gap-2 text-sm text-white/70">
            <span className="shrink-0 font-bold text-[#D6A033]">{i + 1}.</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>

      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.07em] text-white/30">
        Suggested Goals
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {plan.session_goal_suggestions.map((g, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleAddGoal(g)}
            className="rounded-lg border border-[rgba(214,160,51,0.25)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-left text-xs text-[#e0b44e] transition-all duration-[var(--duration-fast)] hover:border-[rgba(214,160,51,0.4)] hover:bg-[rgba(214,160,51,0.12)] active:scale-95"
          >
            + {g}
          </button>
        ))}
      </div>

      {plan.red_flags && plan.red_flags.length > 0 && (
        <div className="mt-3 rounded-lg border border-[rgba(180,83,9,0.3)] bg-[rgba(180,83,9,0.15)] p-3">
          <p className="mb-1.5 text-xs font-semibold text-amber-400">Watch for</p>
          {plan.red_flags.map((f, i) => (
            <p key={i} className="text-xs text-amber-300/80">
              • {f}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
