'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AddSessionForm } from './add-session-form'
import { SessionHistoryPanel, type SessionHistoryItem } from './session-history-panel'

type Props = {
  studentId: string
  sessions: SessionHistoryItem[]
}

export function SessionsSection({ studentId, sessions }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  function afterSave() {
    setShowForm(false)
    router.refresh()
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-[rgba(92,107,70,0.12)] bg-[#5C6B46] px-4 py-3 font-sans text-[13px] font-semibold text-white transition-colors hover:bg-[#3d4c2c]"
        >
          <span>{showForm ? 'Hide form' : '+ Log Session'}</span>
          <svg
            viewBox="0 0 16 16"
            className={`h-4 w-4 transition-transform duration-200 ${showForm ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {showForm ? (
          <div className="mt-2">
            <AddSessionForm studentId={studentId} onSaved={afterSave} />
          </div>
        ) : null}
      </div>

      <div className="hidden w-full gap-4 md:grid md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:items-start md:gap-4">
        <AddSessionForm studentId={studentId} onSaved={afterSave} />
        <SessionHistoryPanel sessions={sessions} />
      </div>

      <div className="md:hidden">
        <SessionHistoryPanel sessions={sessions} />
      </div>
    </div>
  )
}
