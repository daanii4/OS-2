import Link from 'next/link'

export type UpcomingMeetingItem = {
  id: string
  title: string
  meeting_date: string
  duration_minutes: number
  location: string | null
  meeting_type: string
  status: string
  counselorName: string
  studentLabel: string | null
  showCounselorName: boolean
}

function statusClass(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'bg-[var(--olive-100)] text-[var(--olive-800)]'
    case 'rescheduled':
      return 'bg-[var(--gold-100)] text-[#7A5A10]'
    case 'completed':
      return 'bg-gray-100 text-gray-600'
    case 'cancelled':
      return 'bg-gray-50 text-gray-400 line-through'
    default:
      return 'bg-gray-50 text-gray-500'
  }
}

export function DashboardUpcomingMeetings({ meetings }: { meetings: UpcomingMeetingItem[] }) {
  return (
    <section className="os-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="os-heading">Upcoming meetings</h2>
        <Link href="/dashboard/schedule" className="os-caption underline">
          View all
        </Link>
      </div>
      {meetings.length === 0 ? (
        <p className="os-body">No meetings scheduled in the next 7 days.</p>
      ) : (
        <ul className="space-y-3">
          {meetings.map(m => (
            <li key={m.id}>
              <Link
                href={`/dashboard/schedule/${m.id}`}
                className="block rounded-md bg-[var(--surface-inner)] p-3 transition-colors hover:bg-[var(--surface-page)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="os-subhead">{m.title}</p>
                  <span
                    className={`rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusClass(m.status)}`}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="os-caption mt-1">
                  {new Date(m.meeting_date).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {m.location ? ` · ${m.location}` : ''}
                  {m.studentLabel ? ` · ${m.studentLabel}` : ''}
                  {m.showCounselorName ? ` · ${m.counselorName}` : ''}
                </p>
                <p className="os-caption capitalize text-[var(--text-quaternary)]">
                  {m.meeting_type.replace(/_/g, ' ')} · {m.duration_minutes} min
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
