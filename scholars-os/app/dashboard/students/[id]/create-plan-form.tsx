'use client'

import { FormEvent, useState } from 'react'

const frequencyOptions = ['daily', 'weekly', 'biweekly', 'as_needed'] as const

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
    <form onSubmit={handleSubmit} className="os-card grid gap-3">
      <h3 className="os-heading">Create success plan</h3>
      <textarea
        value={goalStatement}
        onChange={e => setGoalStatement(e.target.value)}
        required
        disabled={loading}
        placeholder="Goal statement"
        className="os-textarea"
      />
      <input
        type="number"
        min="0"
        max="100"
        value={targetReductionPct}
        onChange={e => setTargetReductionPct(e.target.value)}
        required
        disabled={loading}
        placeholder="Target reduction %"
        className="os-input"
      />
      <input
        type="number"
        min="1"
        value={planDurationWeeks}
        onChange={e => setPlanDurationWeeks(e.target.value)}
        required
        disabled={loading}
        placeholder="Plan duration (weeks)"
        className="os-input"
      />
      <textarea
        value={focusBehaviorsText}
        onChange={e => setFocusBehaviorsText(e.target.value)}
        required
        disabled={loading}
        placeholder="Focus behaviors (one per line)"
        className="os-textarea"
      />
      <select
        value={sessionFrequency}
        onChange={e =>
          setSessionFrequency(e.target.value as (typeof frequencyOptions)[number])
        }
        disabled={loading}
        className="os-select"
      >
        {frequencyOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <textarea
        value={planNotes}
        onChange={e => setPlanNotes(e.target.value)}
        disabled={loading}
        placeholder="Plan notes (optional)"
        className="os-textarea"
      />
      {error && <p className="os-caption text-[var(--color-error)]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="os-btn-primary"
      >
        {loading ? 'Saving...' : 'Create plan'}
      </button>
    </form>
  )
}
