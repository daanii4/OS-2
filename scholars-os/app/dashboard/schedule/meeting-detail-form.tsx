'use client'

import { MeetingStatus } from '@prisma/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  meetingId: string
  initialStatus: MeetingStatus
  initialNotes: string | null
  canEdit: boolean
  studentId: string | null
}

const STATUS_OPTIONS: MeetingStatus[] = [
  MeetingStatus.scheduled,
  MeetingStatus.rescheduled,
  MeetingStatus.completed,
  MeetingStatus.cancelled,
]

export function MeetingDetailForm({
  meetingId,
  initialStatus,
  initialNotes,
  canEdit,
  studentId,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        notes: notes.trim() || null,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Could not save changes.')
      return
    }
    router.refresh()
  }

  return (
    <div className="os-card grid gap-4">
      <h2 className="os-heading">Details</h2>
      {studentId && (
        <p className="os-body">
          <Link href={`/dashboard/students/${studentId}`} className="underline">
            Open student profile
          </Link>
        </p>
      )}
      {canEdit ? (
        <>
          <div>
            <label className="os-label mb-1 block">Status</label>
            <select
              className="os-select"
              value={status}
              onChange={e => setStatus(e.target.value as MeetingStatus)}
              disabled={loading}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="os-label mb-1 block">Notes</label>
            <textarea
              className="os-textarea"
              rows={5}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <p className="os-caption text-[var(--color-error)]">{error}</p>}
          <button type="button" className="os-btn-primary" disabled={loading} onClick={() => save()}>
            {loading ? 'Saving…' : 'Save'}
          </button>
        </>
      ) : (
        <>
          <p className="os-body capitalize">Status: {initialStatus}</p>
          {initialNotes && <p className="os-body whitespace-pre-wrap">{initialNotes}</p>}
        </>
      )}
    </div>
  )
}
