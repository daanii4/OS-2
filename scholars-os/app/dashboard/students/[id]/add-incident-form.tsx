'use client'

import { FormEvent, useState } from 'react'

const incidentTypes = [
  'office_referral',
  'suspension_iss',
  'suspension_oss',
  'teacher_referral',
  'behavioral_incident',
  'other',
] as const

const severities = ['low', 'medium', 'high'] as const

type AddIncidentFormProps = {
  studentId: string
}

export function AddIncidentForm({ studentId }: AddIncidentFormProps) {
  const [incidentDate, setIncidentDate] = useState('')
  const [incidentType, setIncidentType] =
    useState<(typeof incidentTypes)[number]>('behavioral_incident')
  const [suspensionDays, setSuspensionDays] = useState('')
  const [severity, setSeverity] = useState<(typeof severities)[number]>('medium')
  const [description, setDescription] = useState('')
  const [reportedBy, setReportedBy] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const requiresSuspensionDays =
    incidentType === 'suspension_iss' || incidentType === 'suspension_oss'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const response = await fetch(`/api/students/${studentId}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incident_date: new Date(incidentDate).toISOString(),
        incident_type: incidentType,
        suspension_days: requiresSuspensionDays
          ? Number(suspensionDays || 0)
          : undefined,
        severity,
        description,
        reported_by: reportedBy,
      }),
    })

    if (!response.ok) {
      setError('Unable to save incident right now.')
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="os-card grid gap-3">
      <h3 className="os-heading">Log incident</h3>
      <input
        type="date"
        value={incidentDate}
        onChange={e => setIncidentDate(e.target.value)}
        required
        disabled={loading}
        className="os-input"
      />
      <select
        value={incidentType}
        onChange={e =>
          setIncidentType(e.target.value as (typeof incidentTypes)[number])
        }
        disabled={loading}
        className="os-select"
      >
        {incidentTypes.map(type => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      {requiresSuspensionDays && (
        <input
          type="number"
          min="0"
          step="0.5"
          value={suspensionDays}
          onChange={e => setSuspensionDays(e.target.value)}
          required
          disabled={loading}
          placeholder="Suspension days"
          className="os-input"
        />
      )}
      <select
        value={severity}
        onChange={e => setSeverity(e.target.value as (typeof severities)[number])}
        disabled={loading}
        className="os-select"
      >
        {severities.map(level => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
      <input
        value={reportedBy}
        onChange={e => setReportedBy(e.target.value)}
        required
        disabled={loading}
        placeholder="Reported by"
        className="os-input"
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        required
        disabled={loading}
        placeholder="Incident description"
        className="os-textarea"
      />
      {error && <p className="os-caption text-[var(--color-error)]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="os-btn-primary"
      >
        {loading ? 'Saving...' : 'Save incident'}
      </button>
    </form>
  )
}
