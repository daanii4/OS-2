'use client'

import { FormEvent, useEffect, useState } from 'react'
import { takeQueuedSessionGoals } from '@/lib/session-goals-queue'
import { toast } from 'sonner'

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
  const [districtNotes, setDistrictNotes] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newGoalMet, setNewGoalMet] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const queued = takeQueuedSessionGoals(studentId)
    if (queued.length === 0) return
    setGoals(current => {
      const existing = new Set(current.map(g => g.goal))
      const merged = [...current]
      for (const q of queued) {
        if (!existing.has(q.goal)) {
          merged.push(q)
          existing.add(q.goal)
        }
      }
      return merged
    })
    toast.info('Suggested goals from your session intelligence plan were added below.')
  }, [studentId])

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
    const loadingToast = toast.loading('Saving session...')

    try {
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
          district_notes: districtNotes.trim() || null,
          session_goals: goals.length > 0 ? goals : null,
        }),
      })

      if (!response.ok) {
        setError('Unable to save session right now.')
        toast.error('Failed to save session')
        return
      }

      toast.success('Session logged')
      setTimeout(() => window.location.reload(), 250)
    } catch {
      setError('Unable to save session right now.')
      toast.error('Failed to save session')
    } finally {
      toast.dismiss(loadingToast)
      setLoading(false)
    }
  }

  function handleClear() {
    setSessionDate('')
    setSessionType('check_in')
    setSessionFormat('individual')
    setDurationMinutes('30')
    setAttendanceStatus('attended')
    setSessionSummary('')
    setDistrictNotes('')
    setNewGoal('')
    setNewGoalMet(false)
    setGoals([])
    setError(null)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="os-student-section-panel flex w-full max-w-[360px] shrink-0 flex-col self-start md:sticky md:top-5"
    >
      <div className="border-b border-[rgba(92,107,70,0.08)] px-5 py-4">
        <h2 className="font-[family-name:var(--font-dm-serif)] text-[18px] font-normal text-[#1e2517]">
          Log session
        </h2>
        <p className="mt-0.5 font-sans text-[11px] text-[#6e8050]">
          Pre-filled context — record what happened in this visit.
        </p>
      </div>
      <div className="flex flex-col gap-3.5 px-5 py-4">

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
          placeholder="Write what happened. Character is built in the small moments."
          className="os-textarea"
          rows={4}
        />
      </div>

      <div className="mt-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inner)] p-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          District notes (optional)
        </label>
        <p className="os-caption mb-2">
          Brief notes for the monthly caseload report (e.g. rapport building, family dynamics).
        </p>
        <input
          type="text"
          value={districtNotes}
          onChange={e => setDistrictNotes(e.target.value)}
          disabled={loading}
          placeholder="e.g. Rapport building, family dynamics, goal setting"
          className="os-input w-full"
        />
      </div>

      <div className="rounded-md bg-[var(--surface-inner)] p-3">
        <p className="os-subhead mb-1">Session goals (optional)</p>
        <p className="os-caption mb-2">
          Add one or more goals for this session and mark if the student met each one. Used to compute
          goal completion rate.
        </p>
        {goals.length === 0 && (
          <p className="os-caption mb-2 text-[var(--text-tertiary)]">
            Goals tell the story behind the numbers.
          </p>
        )}
        <div className="mb-2 grid gap-2">
          <input
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            placeholder="e.g. Student will identify one coping strategy before next session"
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
      </div>

      <div
        className="
        flex items-center gap-2 border-t border-[rgba(92,107,70,0.08)] px-5 py-3.5
      "
      >
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="
            h-10 rounded-lg border border-[rgba(92,107,70,0.22)] bg-transparent px-4
            font-sans text-[13px] font-medium text-[#5C6B46]
            transition-all duration-[150ms] hover:bg-[#f3f7e8] active:scale-[0.99]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-offset-1
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          Clear
        </button>
        <button
          type="submit"
          disabled={loading}
          className="
            flex h-10 flex-1 items-center justify-center rounded-lg bg-[#5C6B46] font-sans text-[13px] font-semibold
            text-white transition-all duration-[150ms] hover:bg-[#3d4c2c] active:scale-[0.99] active:bg-[#2d3820]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {loading ? 'Saving…' : 'Save session'}
        </button>
      </div>
    </form>
  )
}
