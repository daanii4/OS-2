'use client'

import Link from 'next/link'

import {
  STUDENT_SECTION_IDS,
  type StudentSectionId,
} from './student-section-ids'

const LABELS: Record<StudentSectionId, string> = {
  plans: 'Plans',
  sessions: 'Sessions',
  overview: 'Overview',
  incidents: 'Incidents',
  charts: 'Charts',
}

type Props = {
  studentId: string
  active: StudentSectionId
}

/** Sticky section tabs; each tab is a soft navigation with a small RSC payload. */
export function StudentSectionTabs({ studentId, active }: Props) {
  const base = `/dashboard/students/${studentId}`

  return (
    <div
      className="sticky z-10 -mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border-default)] bg-[var(--surface-page)] px-4 py-2 lg:mx-0 lg:mb-6 lg:px-0"
      style={{ top: 0, scrollbarWidth: 'none' }}
    >
      {STUDENT_SECTION_IDS.map(id => (
        <Link
          key={id}
          href={id === 'sessions' ? base : `${base}?section=${id}`}
          scroll={false}
          prefetch
          className="flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-75"
          style={
            active === id
              ? { background: 'var(--olive-800)', color: '#fff' }
              : { background: 'transparent', color: 'var(--text-secondary)' }
          }
        >
          {LABELS[id]}
        </Link>
      ))}
    </div>
  )
}
