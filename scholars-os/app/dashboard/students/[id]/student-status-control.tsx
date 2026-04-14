'use client'

import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const STATUSES = ['active', 'graduated', 'transferred', 'inactive'] as const

type Props = {
  studentId: string
  currentStatus: string
}

function badgeStyle(status: string): CSSProperties {
  switch (status) {
    case 'active':
      return { background: 'rgba(92,107,70,0.18)', color: '#c8d6aa', border: '1px solid rgba(200,214,170,0.25)' }
    case 'graduated':
      return { background: 'rgba(214,160,51,0.18)', color: '#f0d898', border: '1px solid rgba(240,216,152,0.25)' }
    case 'transferred':
      return { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.12)' }
    case 'inactive':
      return { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.10)' }
    default:
      return { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.15)' }
  }
}

export function StudentStatusControl({ studentId, currentStatus }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  async function applyStatus(next: string) {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/students/${studentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: next,
        note: note.trim() || undefined,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Could not update status.')
      return
    }
    setConfirmStatus(null)
    setNote('')
    setOpen(false)
    router.refresh()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="rounded-[var(--radius-sm)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] transition-opacity hover:opacity-90"
        style={badgeStyle(currentStatus)}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {currentStatus}
      </button>
      {open && (
        <ul
          className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-md border border-[var(--border-subtle)] bg-[var(--surface-card)] py-1 shadow-lg"
          role="listbox"
        >
          {STATUSES.map(s => (
            <li key={s}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[12px] capitalize text-[var(--text-primary)] hover:bg-[var(--surface-inner)]"
                onClick={() => {
                  if (s === currentStatus) {
                    setOpen(false)
                    return
                  }
                  setConfirmStatus(s)
                  setOpen(false)
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      {confirmStatus && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg bg-[var(--surface-card)] p-4 shadow-xl">
            <p className="os-heading mb-2">Change status to {confirmStatus}?</p>
            <label className="os-label mb-1 block">Note (optional)</label>
            <textarea
              className="os-textarea mb-3"
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Reason for change"
            />
            {error && <p className="os-caption mb-2 text-[var(--color-error)]">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="os-btn-secondary"
                onClick={() => {
                  setConfirmStatus(null)
                  setNote('')
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="os-btn-primary"
                disabled={loading}
                onClick={() => applyStatus(confirmStatus)}
              >
                {loading ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
