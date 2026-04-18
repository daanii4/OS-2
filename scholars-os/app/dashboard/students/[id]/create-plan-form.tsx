'use client'

import { FormEvent, useState } from 'react'

const frequencyOptions = ['daily', 'weekly', 'biweekly', 'as_needed'] as const

const FREQUENCY_LABEL: Record<(typeof frequencyOptions)[number], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every two weeks',
  as_needed: 'As needed',
}

type CreatePlanFormProps = {
  studentId: string
}

export function CreatePlanForm({ studentId }: CreatePlanFormProps) {
  const [goalStatement, setGoalStatement] = useState('')
  const [targetReductionPct, setTargetReductionPct] = useState('50')
  const [planDurationWeeks, setPlanDurationWeeks] = useState('12')
  const [focusBehaviorsText, setFocusBehaviorsText] = useState('')
  const [sessionFrequency, setSessionFrequency] =
    useState<(typeof frequencyOptions)[number]>('weekly')
  const [planNotes, setPlanNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const focusBehaviors = focusBehaviorsText
      .split('\n')
      .map(value => value.trim())
      .filter(Boolean)

    const response = await fetch(`/api/students/${studentId}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_statement: goalStatement,
        target_reduction_pct: Number(targetReductionPct),
        plan_duration_weeks: Number(planDurationWeeks),
        focus_behaviors: focusBehaviors,
        session_frequency: sessionFrequency,
        plan_notes: planNotes || null,
      }),
    })

    if (!response.ok) {
      setError('Unable to create plan right now.')
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="os-student-section-panel flex w-full max-w-[360px] shrink-0 flex-col md:sticky md:top-5 md:self-start"
    >
      <div className="os-student-section-panel__header">
        <h3 className="os-student-section-panel__title">Create success plan</h3>
        <p className="os-student-section-panel__subtitle">
          Define the outcome and cadence for this student.
        </p>
      </div>
      <div className="os-student-section-panel__body grid flex-1 gap-3 pb-5">

      <div>
        <label className="os-label mb-1 block" htmlFor="goal-statement">
          Goal statement
        </label>
        <p className="os-caption mb-1">Plain-language outcome you are working toward for this student.</p>
        <textarea
          id="goal-statement"
          value={goalStatement}
          onChange={e => setGoalStatement(e.target.value)}
          required
          disabled={loading}
          placeholder="e.g. Reduce office referrals by building conflict skills"
          className="os-textarea"
          rows={3}
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="target-reduction-pct">
          Target reduction (%)
        </label>
        <p className="os-caption mb-1">
          Goal for how much to <strong>lower</strong> incidents compared to baseline, expressed as a percent.
          Range: <strong>0–100</strong> (e.g. 50 means aim for half as many incidents as baseline).
        </p>
        <input
          id="target-reduction-pct"
          type="number"
          min={0}
          max={100}
          value={targetReductionPct}
          onChange={e => setTargetReductionPct(e.target.value)}
          required
          disabled={loading}
          className="os-input"
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="plan-duration-weeks">
          Plan duration (weeks)
        </label>
        <p className="os-caption mb-1">
          How long this plan should run before review. Minimum <strong>1</strong> week; use whole numbers.
        </p>
        <input
          id="plan-duration-weeks"
          type="number"
          min={1}
          step={1}
          value={planDurationWeeks}
          onChange={e => setPlanDurationWeeks(e.target.value)}
          required
          disabled={loading}
          className="os-input"
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="focus-behaviors">
          Focus behaviors
        </label>
        <p className="os-caption mb-1">One behavior per line (e.g. arguing, leaving class).</p>
        <textarea
          id="focus-behaviors"
          value={focusBehaviorsText}
          onChange={e => setFocusBehaviorsText(e.target.value)}
          required
          disabled={loading}
          placeholder={'One per line\ne.g. verbal conflict\nleaving class without permission'}
          className="os-textarea"
          rows={4}
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="session-frequency">
          Session cadence
        </label>
        <p className="os-caption mb-1">How often counseling sessions are expected while the plan is active.</p>
        <select
          id="session-frequency"
          value={sessionFrequency}
          onChange={e =>
            setSessionFrequency(e.target.value as (typeof frequencyOptions)[number])
          }
          disabled={loading}
          className="os-select"
        >
          {frequencyOptions.map(option => (
            <option key={option} value={option}>
              {FREQUENCY_LABEL[option]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="plan-notes">
          Plan notes (optional)
        </label>
        <p className="os-caption mb-1">Internal notes for the team (not shown to students).</p>
        <textarea
          id="plan-notes"
          value={planNotes}
          onChange={e => setPlanNotes(e.target.value)}
          disabled={loading}
          className="os-textarea"
          rows={3}
        />
      </div>

      {error && <p className="os-caption text-[var(--color-error)]">{error}</p>}
      <button type="submit" disabled={loading} className="os-btn-primary w-full sm:w-auto">
        {loading ? 'Saving...' : 'Create plan'}
      </button>
      </div>
    </form>
  )
}
