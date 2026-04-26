'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  studentId: string
  studentName: string
  escalationReason: string | null
  onClose: () => void
  /** Called after API successfully clears escalation — hide dashboard banner only; modal stays open for Step 3. */
  onEscalationResolved: () => void
}

type Step = 'read' | 'document' | 'confirmed'

export function EscalationReviewModal({
  open,
  studentId,
  studentName,
  escalationReason,
  onClose,
  onEscalationResolved,
}: Props) {
  const [step, setStep] = useState<Step>('read')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStep('read')
      setNotes('')
      setError(null)
    }
  }, [open])

  if (!open) return null

  async function handleSubmit() {
    if (notes.trim().length < 10) {
      setError('Please describe the action taken (minimum 10 characters).')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/students/${studentId}/escalation-acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counselor_notes: notes.trim() }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Failed to save — please try again.')
        return
      }
      setStep('confirmed')
      onEscalationResolved()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('read')
    setNotes('')
    setError(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={step === 'confirmed' ? handleClose : undefined}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="escalation-modal-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="h-1.5 w-full bg-[#DC2626]" aria-hidden />

        <div className="px-6 py-5">
          {step === 'read' && (
            <>
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF2F2]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-[#DC2626]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    id="escalation-modal-title"
                    className="text-[16px] font-semibold text-[#1e2517]"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    Escalation Required — {studentName}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[#6e8050]">
                    AI flagged a safety concern requiring immediate action
                  </p>
                </div>
              </div>

              {escalationReason ? (
                <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#DC2626]">
                    Reason flagged
                  </p>
                  <p className="text-[13px] leading-relaxed text-[#7F1D1D]">{escalationReason}</p>
                </div>
              ) : null}

              <div className="mb-5 rounded-lg border border-[rgba(92,107,70,0.15)] bg-[#f3f7e8] px-4 py-3">
                <p className="text-[12px] leading-relaxed text-[#3d4c2c]">
                  <strong>Required action:</strong> Contact a licensed clinician or your
                  organization&apos;s escalation contact immediately. Document the action taken in the
                  next step — this creates a permanent record in the student&apos;s file.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="os-btn-secondary" onClick={handleClose}>
                  Remind me later
                </button>
                <button
                  type="button"
                  className="os-btn-primary"
                  onClick={() => setStep('document')}
                >
                  Continue to document action →
                </button>
              </div>
            </>
          )}

          {step === 'document' && (
            <>
              <div className="mb-4">
                <button
                  type="button"
                  className="mb-3 flex items-center gap-1 text-[11px] text-[#6e8050] hover:text-[#3d4c2c]"
                  onClick={() => setStep('read')}
                >
                  ← Back
                </button>
                <h2
                  id="escalation-modal-title-document"
                  className="text-[16px] font-semibold text-[#1e2517]"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Document action taken
                </h2>
                <p className="mt-1 text-[12px] text-[#6e8050]">
                  This note becomes a permanent record attached to {studentName}&apos;s escalation.
                </p>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="escalation-notes"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.07em] text-[#3d4c2c]"
                >
                  Action taken <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="escalation-notes"
                  value={notes}
                  onChange={e => {
                    setNotes(e.target.value)
                    setError(null)
                  }}
                  rows={5}
                  maxLength={2000}
                  placeholder="e.g. Contacted licensed clinician Dr. Martinez at Tracy Unified, referred student for immediate evaluation. Parent notified on [date]. Follow-up scheduled for [date]."
                  className={`
                    w-full rounded-lg border px-3 py-2.5
                    bg-[#eef0e8] font-sans text-[13px] leading-relaxed text-[#1e2517]
                    placeholder:text-[#8a9e69] outline-none resize-none
                    transition-[border-color,box-shadow] duration-150
                    focus:border-[#5C6B46] focus:bg-white focus:shadow-[0_0_0_3px_rgba(92,107,70,0.11)]
                    ${error ? 'border-[#DC2626]' : 'border-[rgba(92,107,70,0.2)]'}
                  `}
                  disabled={loading}
                  aria-describedby={error ? 'escalation-notes-error' : undefined}
                />
                <div className="mt-1 flex items-center justify-between">
                  {error ? (
                    <p id="escalation-notes-error" className="text-[11px] text-[#DC2626]" role="alert">
                      {error}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className="text-[11px] text-[#8a9e69]">{notes.length}/2000</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="os-btn-secondary"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || notes.trim().length < 10}
                  className="os-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-3.5 w-3.5 animate-spin"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M8 2a6 6 0 0 1 0 12" strokeLinecap="round" />
                      </svg>
                      Saving…
                    </span>
                  ) : (
                    'Mark as Reviewed'
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'confirmed' && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f7e8]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7 text-[#5C6B46]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2
                id="escalation-modal-title"
                className="text-[17px] font-semibold text-[#1e2517]"
                style={{ fontFamily: 'var(--font-dm-serif)' }}
              >
                Escalation reviewed and documented
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-[#6e8050]">
                The escalation flag has been cleared. Your action note is saved permanently in{' '}
                {studentName}&apos;s intelligence record.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  href={`/dashboard/students/${studentId}?section=overview`}
                  className="os-btn-primary"
                  onClick={handleClose}
                >
                  View in Overview →
                </Link>
                <button type="button" className="os-btn-secondary" onClick={handleClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
