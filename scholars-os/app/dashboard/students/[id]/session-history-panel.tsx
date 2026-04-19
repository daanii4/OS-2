'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

const SESSION_TYPE_LABEL: Record<string, string> = {
  intake_assessment: 'Intake assessment',
  behavioral_observation: 'Behavioral observation',
  classroom_support: 'Classroom support',
  emotional_regulation: 'Emotional regulation',
  group_behavior_support: 'Group behavior support',
  peer_conflict_mediation: 'Peer conflict mediation',
  check_in: 'Check-in',
  crisis: 'Crisis',
}

const ATTENDANCE_LABEL: Record<string, string> = {
  attended: 'Attended',
  no_show: 'No-show',
  rescheduled: 'Rescheduled',
  cancelled: 'Cancelled',
}

export type SessionHistoryItem = {
  id: string
  session_date: Date | string
  session_type: string
  session_format: string
  duration_minutes: number | null
  attendance_status: string
  session_summary: string | null
  goals_attempted: number | null
  goals_met: number | null
  goal_completion_rate: number | null
}

type FilterKey = 'all' | 'attended' | 'no_show' | 'other'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attended', label: 'Attended' },
  { key: 'no_show', label: 'No-show' },
  { key: 'other', label: 'Other' },
]

function attendanceClass(status: string): string {
  if (status === 'attended') return 'text-[var(--color-success)]'
  if (status === 'no_show') return 'text-[var(--color-regression)]'
  return 'text-[var(--text-secondary)]'
}

export function SessionHistoryPanel({ sessions }: { sessions: SessionHistoryItem[] }) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'all') return sessions
    if (filter === 'other') {
      return sessions.filter(s => s.attendance_status !== 'attended' && s.attendance_status !== 'no_show')
    }
    return sessions.filter(s => s.attendance_status === filter)
  }, [sessions, filter])

  return (
    <div
      className="
      flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[rgba(92,107,70,0.12)] bg-white
    "
    >
      <div
        className="
        flex flex-shrink-0 items-center justify-between border-b border-[rgba(92,107,70,0.08)] px-5 py-4
      "
      >
        <h2 className="font-[family-name:var(--font-dm-serif)] text-[18px] font-normal text-[#1e2517]">
          Session history
        </h2>
        <span className="font-mono text-[11px] text-[#6e8050]">
          {filtered.length} session{filtered.length !== 1 ? 's' : ''}
          {filter !== 'all' ? <span className="text-[#8a9e69]"> filtered</span> : null}
        </span>
      </div>

      <div
        className="
        flex flex-shrink-0 flex-wrap items-center gap-1.5 border-b border-[rgba(92,107,70,0.06)] px-5 py-2.5
      "
      >
        {FILTERS.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              setFilter(opt.key)
              setExpandedId(null)
            }}
            aria-pressed={filter === opt.key}
            className={`
              inline-flex h-7 items-center rounded-full border px-2.5
              font-sans text-[11px] font-medium transition-all duration-[150ms]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-offset-1
              ${
                filter === opt.key
                  ? 'border-[#5C6B46] bg-[#5C6B46] text-white'
                  : 'border-[rgba(92,107,70,0.18)] bg-transparent text-[#5C6B46] hover:border-[#8a9e69] hover:bg-[#f3f7e8]'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto md:max-h-[600px]">
        {filtered.length === 0 ? (
          <EmptyState
            icon={
              <Image
                src="/logo-mark.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-contain opacity-40"
              />
            }
            title="No sessions in this view"
            body={
              filter !== 'all'
                ? 'Try another filter or log a new session.'
                : 'Write what happened. Character is built in the small moments.'
            }
          />
        ) : (
          filtered.map(session => (
            <SessionHistoryRow
              key={session.id}
              session={session}
              isExpanded={expandedId === session.id}
              onToggle={() => setExpandedId(prev => (prev === session.id ? null : session.id))}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SessionHistoryRow({
  session,
  isExpanded,
  onToggle,
}: {
  session: SessionHistoryItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const typeLabel = SESSION_TYPE_LABEL[session.session_type] ?? session.session_type.replace(/_/g, ' ')
  const attLabel = ATTENDANCE_LABEL[session.attendance_status] ?? session.attendance_status
  const dateStr = new Date(session.session_date).toLocaleDateString()

  const summaryPreview =
    session.session_summary && session.session_summary.trim()
      ? session.session_summary.trim().replace(/\s+/g, ' ')
      : null

  return (
    <div
      className={`
        border-b border-[rgba(92,107,70,0.07)] last:border-b-0
        transition-colors duration-[150ms]
        ${isExpanded ? 'bg-[#f3f7e8]' : 'hover:bg-[#f3f7e8]'}
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="
          flex w-full items-start gap-2.5 px-5 py-3 text-left
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-inset
        "
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="font-sans text-[13px] font-semibold capitalize text-[#1e2517]">
              {typeLabel}
            </span>
            <span
              className={`font-sans text-[11px] font-medium ${attendanceClass(session.attendance_status)}`}
            >
              · {attLabel}
            </span>
          </div>
          <div className="mb-1.5 font-mono text-[11px] text-[#5C6B46]">
            {dateStr} · {session.duration_minutes ?? '—'}m · {session.session_format}
          </div>
          {session.goals_attempted !== null &&
          session.goals_met !== null &&
          session.goal_completion_rate !== null ? (
            <p className="font-sans text-[12px] text-[#3d4c2c]">
              Goals{' '}
              <span className="font-medium">
                {session.goals_met}/{session.goals_attempted}
              </span>{' '}
              (
              <span
                className={
                  session.goal_completion_rate >= 70 ? 'text-[var(--color-success)]' : ''
                }
              >
                {session.goal_completion_rate.toFixed(0)}%
              </span>
              )
            </p>
          ) : null}
          {summaryPreview && !isExpanded ? (
            <p
              className="
              mt-1 max-w-[500px] overflow-hidden text-ellipsis whitespace-nowrap
              font-sans text-[12px] leading-relaxed text-[#3d4c2c]
            "
            >
              {summaryPreview}
            </p>
          ) : null}
        </div>
        <ChevronRight
          size={16}
          className={`
            mt-0.5 flex-shrink-0 text-[#8a9e69]
            transition-transform duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isExpanded ? 'rotate-90' : ''}
          `}
          aria-hidden
        />
      </button>

      {isExpanded ? (
        <div className="px-5 pb-4">
          <div
            className="
            rounded-[8px] bg-[#eef0e8] p-3.5
          "
          >
            <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">
              Session summary
            </p>
            <p className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-[#2d3820]">
              {session.session_summary?.trim() || '—'}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
