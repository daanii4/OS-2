'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import { EmptyState } from '@/components/ui/empty-state'

export type SessionHistoryItem = {
  id: string
  session_date: Date | string
  session_type: string
  session_format: string
  duration_minutes: number | null
  attendance_status: string
  goals_attempted: number | null
  goals_met: number | null
  goal_completion_rate: number | null
  session_summary?: string | null
  session_goals?: unknown
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  intake_assessment: 'Intake assessment',
  behavioral_observation: 'Behavioral observation',
  classroom_support: 'Classroom support',
  emotional_regulation: 'Emotional regulation',
  group_behavior_support: 'Group behavior support',
  peer_conflict_mediation: 'Peer conflict mediation',
  check_in: 'Check-in',
  crisis: 'Crisis',
}

const ATTENDANCE_CONFIG: Record<string, { color: string; label: string }> = {
  attended: { color: 'var(--color-success)', label: 'Attended' },
  no_show: { color: 'var(--color-regression)', label: 'No Show' },
  rescheduled: { color: 'var(--color-warning)', label: 'Rescheduled' },
  cancelled: { color: 'var(--text-tertiary)', label: 'Cancelled' },
}

function parseSessionGoals(raw: unknown): { goal: string; met: boolean }[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.filter(
    (g): g is { goal: string; met: boolean } =>
      typeof g === 'object' &&
      g !== null &&
      'goal' in g &&
      typeof (g as { goal: unknown }).goal === 'string' &&
      'met' in g &&
      typeof (g as { met: unknown }).met === 'boolean'
  )
}

export function SessionHistoryPanel({ sessions }: { sessions: SessionHistoryItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="os-student-section-panel flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="os-student-section-panel__header">
          <h3 className="os-student-section-panel__title">Session history</h3>
          <p className="os-student-section-panel__subtitle">0 sessions logged</p>
        </div>
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
          title="No sessions logged yet"
          body="Write what happened. Character is built in the small moments."
        />
      </div>
    )
  }

  return (
    <div className="os-student-section-panel flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="os-student-section-panel__header flex flex-shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="os-student-section-panel__title">Session history</h3>
          <p className="os-student-section-panel__subtitle">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} logged
          </p>
        </div>
      </div>
      <div className="os-student-section-panel__body--scroll flex-1 overflow-y-auto md:max-h-[600px]">
        {sessions.map(session => {
          const isExpanded = expandedId === session.id
          const dateStr =
            typeof session.session_date === 'string'
              ? session.session_date.slice(0, 10)
              : session.session_date.toISOString().slice(0, 10)
          const formattedDate = format(new Date(`${dateStr}T12:00:00`), 'MM/dd/yyyy')
          const attendance =
            ATTENDANCE_CONFIG[session.attendance_status] ?? {
              color: 'var(--text-tertiary)',
              label: session.attendance_status.replace(/_/g, ' '),
            }
          const typeLabel =
            SESSION_TYPE_LABELS[session.session_type] ??
            session.session_type.replace(/_/g, ' ')
          const goals = parseSessionGoals(session.session_goals)

          return (
            <div
              key={session.id}
              className={`border-b border-[rgba(92,107,70,0.07)] last:border-b-0 transition-colors duration-[150ms] ${
                isExpanded ? 'bg-[#f3f7e8]' : 'hover:bg-[#f3f7e8]'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                aria-expanded={isExpanded}
                className="flex w-full items-start gap-2.5 px-5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-inset"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="font-sans text-[13px] font-semibold text-[#1e2517]">{typeLabel}</span>
                    <span className="font-sans text-[13px]" style={{ color: attendance.color }}>
                      · {attendance.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] text-[#5C6B46]">{formattedDate}</span>
                    <span className="text-[rgba(92,107,70,0.3)]" aria-hidden>
                      ·
                    </span>
                    <span className="font-mono text-[11px] text-[#6e8050]">{session.duration_minutes ?? '—'}m</span>
                    <span className="text-[rgba(92,107,70,0.3)]" aria-hidden>
                      ·
                    </span>
                    <span className="font-sans text-[11px] capitalize text-[#6e8050]">{session.session_format}</span>
                    {session.goal_completion_rate !== null && (
                      <>
                        <span className="text-[rgba(92,107,70,0.3)]" aria-hidden>
                          ·
                        </span>
                        <span
                          className="font-mono text-[11px]"
                          style={{
                            color:
                              session.goal_completion_rate >= 70
                                ? 'var(--color-success)'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {session.goal_completion_rate.toFixed(0)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className={`mt-0.5 flex-shrink-0 text-[#8a9e69] transition-transform duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  aria-hidden
                />
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 pl-5">
                  <div className="grid grid-cols-2 gap-3 rounded-[8px] bg-[#eef0e8] p-3.5">
                    <DetailField label="Session type">{typeLabel}</DetailField>
                    <DetailField label="Date">
                      <span className="font-mono text-[12px]">{formattedDate}</span>
                    </DetailField>
                    <DetailField label="Format">
                      <span className="capitalize">{session.session_format}</span>
                    </DetailField>
                    <DetailField label="Duration">
                      <span className="font-mono text-[12px]">{session.duration_minutes ?? '—'} min</span>
                    </DetailField>
                    <DetailField label="Attendance">
                      <span style={{ color: attendance.color }}>{attendance.label}</span>
                    </DetailField>
                    {session.goals_attempted !== null && session.goals_met !== null && (
                      <DetailField label="Goals">
                        <span className="font-mono text-[12px]">
                          {session.goals_met}/{session.goals_attempted}
                        </span>
                        {session.goal_completion_rate !== null && (
                          <span
                            className="ml-1 font-mono text-[11px]"
                            style={{
                              color:
                                session.goal_completion_rate >= 70
                                  ? 'var(--color-success)'
                                  : 'var(--text-secondary)',
                            }}
                          >
                            ({session.goal_completion_rate.toFixed(0)}%)
                          </span>
                        )}
                      </DetailField>
                    )}
                    {session.attendance_status === 'attended' && session.session_summary?.trim() && (
                      <div className="col-span-2">
                        <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">
                          Session summary
                        </p>
                        <p className="font-sans text-[12px] leading-relaxed text-[#2d3820]">{session.session_summary}</p>
                      </div>
                    )}
                    {goals.length > 0 && (
                      <div className="col-span-2">
                        <p className="mb-2 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">
                          Goals
                        </p>
                        <ul className="space-y-1.5">
                          {goals.map((g, i) => (
                            <li key={i} className="flex items-start gap-2 font-sans text-[12px] text-[#2d3820]">
                              <span
                                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: g.met ? 'var(--color-success)' : 'var(--text-tertiary)' }}
                                aria-hidden
                              />
                              <span>
                                {g.goal}{' '}
                                <span className="font-mono text-[11px] text-[#6e8050]">({g.met ? 'met' : 'not met'})</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">{label}</p>
      <div className="font-sans text-[12px] leading-relaxed text-[#2d3820]">{children}</div>
    </div>
  )
}
