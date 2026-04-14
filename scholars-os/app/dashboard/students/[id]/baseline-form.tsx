'use client'

import { FormEvent, useState } from 'react'

type BaselineFormProps = {
  studentId: string
  canEdit: boolean
  initialBaselineIncidentCount: number | null
  initialBaselineWindowStart: string | null
  initialBaselineWindowEnd: string | null
}

function isoDate(date: string | null): string {
  if (!date) return ''
  return date.slice(0, 10)
}

export function BaselineForm({
  studentId,
  canEdit,
  initialBaselineIncidentCount,
  initialBaselineWindowStart,
  initialBaselineWindowEnd,
}: BaselineFormProps) {
  const [baselineIncidentCount, setBaselineIncidentCount] = useState(
    initialBaselineIncidentCount?.toString() ?? ''
  )
  const [baselineWindowStart, setBaselineWindowStart] = useState(
    isoDate(initialBaselineWindowStart)
  )
  const [baselineWindowEnd, setBaselineWindowEnd] = useState(
    isoDate(initialBaselineWindowEnd)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canEdit) return
    setLoading(true)
    setError(null)

    const response = await fetch(`/api/students/${studentId}/baseline`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseline_incident_count: Number(baselineIncidentCount),
        baseline_window_start: new Date(baselineWindowStart).toISOString(),
        baseline_window_end: new Date(baselineWindowEnd).toISOString(),
      }),
    })

    if (!response.ok) {
      setError('Unable to update baseline right now.')
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="os-card grid gap-3">
      <h3 className="os-heading">Baseline settings</h3>
      <p className="os-caption">
        Baseline is the reference period for measuring incident reduction. Charts compare current
        incidents to this count.
      </p>

      <div>
        <label className="os-label mb-1 block" htmlFor="baseline-incident-count">
          Baseline incident count
        </label>
        <p className="os-caption mb-1">
          Total behavioral incidents recorded for this student <strong>during the baseline window</strong>{' '}
          below (not a yearly estimate). Use a <strong>whole number</strong> from <strong>0</strong> upward.
        </p>
        <input
          id="baseline-incident-count"
          type="number"
          min={0}
          step={1}
          required
          value={baselineIncidentCount}
          onChange={e => setBaselineIncidentCount(e.target.value)}
          disabled={!canEdit || loading}
          className="os-input"
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="baseline-window-start">
          Baseline window — start date
        </label>
        <p className="os-caption mb-1">First day included in the baseline count (often intake or first 30 days).</p>
        <input
          id="baseline-window-start"
          type="date"
          required
          value={baselineWindowStart}
          onChange={e => setBaselineWindowStart(e.target.value)}
          disabled={!canEdit || loading}
          className="os-input"
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="baseline-window-end">
          Baseline window — end date
        </label>
        <p className="os-caption mb-1">Last day included in that same baseline period (must be on or after start).</p>
        <input
          id="baseline-window-end"
          type="date"
          required
          value={baselineWindowEnd}
          onChange={e => setBaselineWindowEnd(e.target.value)}
          disabled={!canEdit || loading}
          className="os-input"
        />
      </div>

      {error && <p className="os-caption text-[var(--color-error)]">{error}</p>}
      <button
        type="submit"
        disabled={!canEdit || loading}
        className="os-btn-primary"
      >
        {loading ? 'Saving...' : 'Save baseline'}
      </button>
      {!canEdit && (
        <p className="os-caption">
          Only owner/assistant can update baseline settings.
        </p>
      )}
    </form>
  )
}
