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

const SESSION_TYPE_LABEL: Record<(typeof sessionTypes)[number], string> = {
  intake_assessment: 'Intake assessment',
  behavioral_observation: 'Behavioral observation',
  classroom_support: 'Classroom support',
  emotional_regulation: 'Emotional regulation',
  group_behavior_support: 'Group behavior support',
  peer_conflict_mediation: 'Peer conflict mediation',
  check_in: 'Check-in',
  crisis: 'Crisis',
}

const FORMAT_LABEL: Record<(typeof sessionFormats)[number], string> = {
  individual: 'Individual (1:1)',
  group: 'Group',
}

const ATTENDANCE_LABEL: Record<(typeof attendanceOptions)[number], string> = {
  attended: 'Attended',
  no_show: 'No-show',
  rescheduled: 'Rescheduled',
  cancelled: 'Cancelled',
}

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

      <div>
        <label className="os-label mb-1 block" htmlFor="session-date">
          Session date
        </label>
        <p className="os-caption mb-1">Calendar day this session occurred.</p>
        <input
          id="session-date"
          type="date"
          value={sessionDate}
          onChange={e => setSessionDate(e.target.value)}
          required
          disabled={loading}
          className="os-input"
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="session-type">
          Session type
        </label>
        <p className="os-caption mb-1">What kind of counseling activity this was.</p>
        <select
          id="session-type"
          value={sessionType}
          onChange={e =>
            setSessionType(e.target.value as (typeof sessionTypes)[number])
          }
          disabled={loading}
          className="os-select"
        >
          {sessionTypes.map(option => (
            <option key={option} value={option}>
              {SESSION_TYPE_LABEL[option]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="session-format">
          Session format
        </label>
        <p className="os-caption mb-1">One student vs a group.</p>
        <select
          id="session-format"
          value={sessionFormat}
          onChange={e =>
            setSessionFormat(e.target.value as (typeof sessionFormats)[number])
          }
          disabled={loading}
          className="os-select"
        >
          {sessionFormats.map(option => (
            <option key={option} value={option}>
              {FORMAT_LABEL[option]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="duration-minutes">
          Duration (minutes)
        </label>
        <p className="os-caption mb-1">
          Length of the scheduled block. Typical school sessions are 30–50 minutes. Allowed range:{' '}
          <strong>1–240</strong> minutes.
        </p>
        <input
          id="duration-minutes"
          type="number"
          min={1}
          max={240}
          value={durationMinutes}
          onChange={e => setDurationMinutes(e.target.value)}
          disabled={loading}
          className="os-input"
        />
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="attendance-status">
          Attendance outcome
        </label>
        <p className="os-caption mb-1">Whether the student attended, missed, or the session moved.</p>
        <select
          id="attendance-status"
          value={attendanceStatus}
          onChange={e =>
            setAttendanceStatus(e.target.value as (typeof attendanceOptions)[number])
          }
          disabled={loading}
          className="os-select"
        >
          {attendanceOptions.map(option => (
            <option key={option} value={option}>
              {ATTENDANCE_LABEL[option]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="os-label mb-1 block" htmlFor="session-summary">
          Session summary
        </label>
        <p className="os-caption mb-1">
          {summaryRequired
            ? 'Required when attendance is Attended (brief narrative of what happened).'
            : 'Optional if the student did not attend.'}
        </p>
        <textarea
          id="session-summary"
          value={sessionSummary}
          onChange={e => setSessionSummary(e.target.value)}
          required={summaryRequired}
          disabled={loading}
          placeholder="What was covered, student response, follow-ups"
          className="os-textarea"
          rows={4}
        />
      </div>

      <div className="rounded-md bg-[var(--surface-inner)] p-3">
        <p className="os-subhead mb-1">Session goals (optional)</p>
        <p className="os-caption mb-2">
          Add one or more goals for this session and mark if the student met each one. Used to compute
          goal completion rate.
        </p>
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
      <button type="submit" disabled={loading} className="os-btn-primary">
        {loading ? 'Saving...' : 'Save session'}
      </button>
    </form>
  )
}
