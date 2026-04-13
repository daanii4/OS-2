'use client'

import { FormEvent, useState } from 'react'

const gradeOptions = [
  'K',
  'G1',
  'G2',
  'G3',
  'G4',
  'G5',
  'G6',
  'G7',
  'G8',
  'G9',
  'G10',
  'G11',
  'G12',
] as const

type CreateStudentFormProps = {
  disabled?: boolean
}

export function CreateStudentForm({ disabled = false }: CreateStudentFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [grade, setGrade] = useState<(typeof gradeOptions)[number]>('G9')
  const [school, setSchool] = useState('')
  const [district, setDistrict] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [presentingProblem, setPresentingProblem] = useState('')
  const [intakeDate, setIntakeDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    setLoading(true)
    setError(null)

    const response = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        grade,
        school,
        district,
        referral_source: referralSource,
        presenting_problem: presentingProblem,
        intake_date: new Date(intakeDate).toISOString(),
      }),
    })

    if (!response.ok) {
      setError('Unable to create student right now.')
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="os-card grid gap-3">
      <h2 className="os-heading">Create student</h2>
      <input
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        placeholder="First name"
        required
        disabled={disabled || loading}
        className="os-input"
      />
      <input
        value={lastName}
        onChange={e => setLastName(e.target.value)}
        placeholder="Last name"
        required
        disabled={disabled || loading}
        className="os-input"
      />
      <select
        value={grade}
        onChange={e => setGrade(e.target.value as (typeof gradeOptions)[number])}
        disabled={disabled || loading}
        className="os-select"
      >
        {gradeOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        value={school}
        onChange={e => setSchool(e.target.value)}
        placeholder="School"
        required
        disabled={disabled || loading}
        className="os-input"
      />
      <input
        value={district}
        onChange={e => setDistrict(e.target.value)}
        placeholder="District"
        required
        disabled={disabled || loading}
        className="os-input"
      />
      <input
        value={referralSource}
        onChange={e => setReferralSource(e.target.value)}
        placeholder="Referral source"
        required
        disabled={disabled || loading}
        className="os-input"
      />
      <textarea
        value={presentingProblem}
        onChange={e => setPresentingProblem(e.target.value)}
        placeholder="Presenting problem"
        required
        disabled={disabled || loading}
        className="os-textarea"
      />
      <input
        type="date"
        value={intakeDate}
        onChange={e => setIntakeDate(e.target.value)}
        required
        disabled={disabled || loading}
        className="os-input"
      />
      {error && <p className="os-caption text-[var(--color-error)]">{error}</p>}
      <button
        type="submit"
        disabled={disabled || loading}
        className="os-btn-primary"
      >
        {loading ? 'Saving...' : 'Create student'}
      </button>
    </form>
  )
}
