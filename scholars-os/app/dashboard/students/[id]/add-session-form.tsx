'use client'

import { FormEvent, useState } from 'react'

const attendanceOptions = ['attended', 'no_show', 'rescheduled', 'cancelled'] as const
const sessionTypes = [
  'intake_assessment',
  'behavioral_observation',
  'classroom_support',
  'emotional_regulation',
  'group_behavior_support',
  'peer_conflict_mediation',
  'check_in',
  'crisis',
] as const
const sessionFormats = ['individual', 'group'] as const

type Goal = { goal: string; met: boolean }

type AddSessionFormProps = {
  studentId: string
}

export function AddSessionForm({ studentId }: AddSessionFormProps) {
  const [sessionDate, setSessionDate] = useState('')
  const [sessionType, setSessionType] =
    useState<(typeof sessionTypes)[number]>('check_in')
  const [sessionFormat, setSessionFormat] =
    useState<(typeof sessionFormats)[number]>('individual')
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [attendanceStatus, setAttendanceStatus] =
    useState<(typeof attendanceOptions)[number]>('attended')
  const [sessionSummary, setSessionSummary] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newGoalMet, setNewGoalMet] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const summaryRequired = attendanceStatus === 'attended'

  function addGoal() {
    const trimmedGoal = newGoal.trim()
    if (!trimmedGoal) return
    setGoals(current => [...current, { goal: trimmedGoal, met: newGoalMet }])
    setNewGoal('')
    setNewGoalMet(false)
  }

  function removeGoal(index: number) {
    setGoals(current => current.filter((_, currentIndex) => currentIndex !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const response = await fetch(`/api/students/${studentId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_date: new Date(sessionDate).toISOString(),
        session_type: sessionType,
        session_format: sessionFormat,
        duration_minutes: Number(durationMinutes || 30),
        attendance_status: attendanceStatus,
        session_summary: sessionSummary || null,
        session_goals: goals.length > 0 ? goals : null,
      }),
    })

    if (!response.ok) {
      setError('Unable to save session right now.')
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="os-card grid gap-3">
      <h3 className="os-heading">Log session</h3>
      <input
        type="date"
        value={sessionDate}
        onChange={e => setSessionDate(e.target.value)}
        required
        disabled={loading}
        className="os-input"
      />
      <select
        value={sessionType}
        onChange={e =>
          setSessionType(e.target.value as (typeof sessionTypes)[number])
        }
        disabled={loading}
        className="os-select"
      >
        {sessionTypes.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select
        value={sessionFormat}
        onChange={e =>
          setSessionFormat(e.target.value as (typeof sessionFormats)[number])
        }
        disabled={loading}
        className="os-select"
      >
        {sessionFormats.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        type="number"
        min="1"
        max="240"
        value={durationMinutes}
        onChange={e => setDurationMinutes(e.target.value)}
        disabled={loading}
        className="os-input"
      />
      <select
        value={attendanceStatus}
        onChange={e =>
          setAttendanceStatus(e.target.value as (typeof attendanceOptions)[number])
        }
        disabled={loading}
        className="os-select"
      >
        {attendanceOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <textarea
        value={sessionSummary}
        onChange={e => setSessionSummary(e.target.value)}
        required={summaryRequired}
        disabled={loading}
        placeholder={
          summaryRequired ? 'Session summary (required)' : 'Session summary'
        }
        className="os-textarea"
      />

      <div className="rounded-md bg-[var(--surface-inner)] p-3">
        <p className="os-subhead mb-2">Session goals (optional)</p>
        <div className="mb-2 grid gap-2">
          <input
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            placeholder="Goal text"
            disabled={loading}
            className="os-input"
          />
          <label className="os-body">
            <input
              type="checkbox"
              checked={newGoalMet}
              onChange={e => setNewGoalMet(e.target.checked)}
              disabled={loading}
              className="mr-2"
            />
            Goal met
          </label>
          <button
            type="button"
            onClick={addGoal}
            disabled={loading || !newGoal.trim()}
            className="os-btn-secondary disabled:opacity-50"
          >
            Add goal
          </button>
        </div>
        {goals.length > 0 && (
          <ul className="space-y-1 os-body">
            {goals.map((goal, index) => (
              <li key={`${goal.goal}-${index}`} className="flex items-center gap-2">
                <span>
                  {goal.goal} ({goal.met ? 'met' : 'not met'})
                </span>
                <button
                  type="button"
                  onClick={() => removeGoal(index)}
                  className="underline os-caption"
                  disabled={loading}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="os-caption text-[var(--color-error)]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="os-btn-primary"
      >
        {loading ? 'Saving...' : 'Save session'}
      </button>
    </form>
  )
}
