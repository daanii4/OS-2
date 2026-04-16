'use client'

import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

const incidentTypes = [
  'office_referral',
  'suspension_iss',
  'suspension_oss',
  'teacher_referral',
  'behavioral_incident',
  'other',
] as const

const severities = ['low', 'medium', 'high'] as const

const INCIDENT_TYPE_LABEL: Record<(typeof incidentTypes)[number], string> = {
  office_referral: 'Office referral',
  suspension_iss: 'In-school suspension (ISS)',
  suspension_oss: 'Out-of-school suspension (OSS)',
  teacher_referral: 'Teacher referral',
  behavioral_incident: 'Behavioral incident',
  other: 'Other',
}

const SEVERITY_LABEL: Record<(typeof severities)[number], string> = {
  low: 'Low — minor / routine',
  medium: 'Medium — notable concern',
  high: 'High — serious / safety-related',
}

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
    const loadingToast = toast.loading('Saving incident...')

    try {
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
        toast.error('Failed to save incident')
        return
      }

      toast.success('Incident logged')
      setTimeout(() => window.location.reload(), 250)
    } catch {
      setError('Unable to save incident right now.')
      toast.error('Failed to save incident')
    } finally {
      toast.dismiss(loadingToast)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="os-card grid gap-3">
      <h3 className="os-heading">Log incident</h3>

      <div>
        <label className="os-label mb-1 block" htmlFor="incident-date">
          Incident date
        </label>
        <p className="os-caption mb-1">When the school recorded or observed this incident.</p>
        <input
          id="incident-date"
          type="date"
          value={incidentDate}
          onChange={e => setIncidentDate(e.target.value)}
          required
          disabled={loading}
          className="os-input"
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="incident-type">
          Incident type
        </label>
        <p className="os-caption mb-1">Category from the school or district record.</p>
        <select
          id="incident-type"
          value={incidentType}
          onChange={e =>
            setIncidentType(e.target.value as (typeof incidentTypes)[number])
          }
          disabled={loading}
          className="os-select"
        >
          {incidentTypes.map(type => (
            <option key={type} value={type}>
              {INCIDENT_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </div>

      {requiresSuspensionDays && (
        <div>
          <label className="os-label mb-1 block" htmlFor="suspension-days">
            Suspension length (school days)
          </label>
          <p className="os-caption mb-1">
            Total days assigned for this suspension. Use <strong>0.5</strong> for a half day.
            Allowed range: <strong>0</strong> or higher (increments of 0.5).
          </p>
          <input
            id="suspension-days"
            type="number"
            min={0}
            step={0.5}
            value={suspensionDays}
            onChange={e => setSuspensionDays(e.target.value)}
            required
            disabled={loading}
            className="os-input"
          />
        </div>
      )}

      <div>
        <label className="os-label mb-1 block" htmlFor="severity">
          Severity
        </label>
        <p className="os-caption mb-1">How serious the incident was for progress tracking and alerts.</p>
        <select
          id="severity"
          value={severity}
          onChange={e => setSeverity(e.target.value as (typeof severities)[number])}
          disabled={loading}
          className="os-select"
        >
          {severities.map(level => (
            <option key={level} value={level}>
              {SEVERITY_LABEL[level]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="reported-by">
          Reported by
        </label>
        <p className="os-caption mb-1">Staff name or role who reported (e.g. teacher, admin).</p>
        <input
          id="reported-by"
          value={reportedBy}
          onChange={e => setReportedBy(e.target.value)}
          required
          disabled={loading}
          placeholder="e.g. Ms. Chen, 6th grade"
          className="os-input"
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="incident-description">
          Incident description
        </label>
        <p className="os-caption mb-1">Factual summary for the file (what happened, context).</p>
        <textarea
          id="incident-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          disabled={loading}
          className="os-textarea"
          rows={4}
        />
      </div>

      {error && <p className="os-caption text-[var(--color-error)]">{error}</p>}
      <button type="submit" disabled={loading} className="os-btn-primary">
        {loading ? 'Saving...' : 'Save incident'}
      </button>
    </form>
  )
}
