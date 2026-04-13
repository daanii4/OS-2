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
      <input
        type="number"
        min="0"
        required
        value={baselineIncidentCount}
        onChange={e => setBaselineIncidentCount(e.target.value)}
        disabled={!canEdit || loading}
        placeholder="Baseline incident count"
        className="os-input"
      />
      <input
        type="date"
        required
        value={baselineWindowStart}
        onChange={e => setBaselineWindowStart(e.target.value)}
        disabled={!canEdit || loading}
        className="os-input"
      />
      <input
        type="date"
        required
        value={baselineWindowEnd}
        onChange={e => setBaselineWindowEnd(e.target.value)}
        disabled={!canEdit || loading}
        className="os-input"
      />
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
