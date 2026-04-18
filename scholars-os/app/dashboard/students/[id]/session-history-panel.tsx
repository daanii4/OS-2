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
}

export function SessionHistoryPanel({ sessions }: { sessions: SessionHistoryItem[] }) {
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

      <div className="os-student-section-panel__body os-student-section-panel__body--scroll flex-1">
        {sessions.length === 0 ? (
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
        ) : (
          <ul className="space-y-2">
            {sessions.map(session => (
              <li
                key={session.id}
                className="rounded-[7px] border border-[rgba(92,107,70,0.1)] bg-[var(--surface-inner)] p-3"
              >
                <p className="os-subhead capitalize">
                  {session.session_type.replace(/_/g, ' ')} ·{' '}
                  <span
                    className={
                      session.attendance_status === 'attended'
                        ? 'text-[var(--color-success)]'
                        : session.attendance_status === 'no_show'
                          ? 'text-[var(--color-regression)]'
                          : 'text-[var(--text-secondary)]'
                    }
                  >
                    {session.attendance_status.replace(/_/g, ' ')}
                  </span>
                </p>
                <p className="os-caption">
                  <span className="os-data-sm">
                    {new Date(session.session_date).toLocaleDateString()}
                  </span>{' '}
                  · <span className="os-data-sm">{session.duration_minutes ?? '—'}</span>m ·{' '}
                  {session.session_format}
                </p>
                {session.goals_attempted !== null &&
                  session.goals_met !== null &&
                  session.goal_completion_rate !== null && (
                    <p className="os-caption">
                      Goals:{' '}
                      <span className="os-data-sm">
                        {session.goals_met}/{session.goals_attempted}
                      </span>{' '}
                      (
                      <span
                        className={
                          session.goal_completion_rate >= 70
                            ? 'os-data-sm text-[var(--color-success)]'
                            : 'os-data-sm'
                        }
                      >
                        {session.goal_completion_rate.toFixed(0)}%
                      </span>
                      )
                    </p>
                  )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
