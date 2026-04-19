'use client'

import Link from 'next/link'
import {
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  StudentsHeader,
  type StudentFilterKey,
} from '@/components/students/students-header'
import { EmptyState } from '@/components/ui/empty-state'
import { StudentAvatar } from '@/components/ui/student-avatar'

export type DashboardStudentRow = {
  id: string
  first_name: string
  last_name: string
  grade: string
  school: string
  status: string
  baseline_incident_count: number | null
  escalation_active: boolean
  /** Present when row comes from `/api/dashboard/students-preview`. */
  incidents_30d?: number
}

type Props = {
  initialStudents: DashboardStudentRow[]
  initialFilteredCount: number
  caseloadTotalCount: number
  /**
   * Pre-computed 30d incident counts keyed by student id, used for initial
   * SSR render before the preview API responds with refined counts.
   */
  incidentCountByStudent: Record<string, number>
  variant?: 'desktop' | 'mobile'
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-[var(--olive-100)] text-[var(--olive-800)] border border-[var(--olive-200)]'
    case 'graduated':
      return 'bg-[var(--gold-100)] text-[#7A5A10] border border-[var(--gold-200)]'
    case 'transferred':
      return 'bg-gray-100 text-gray-600 border border-gray-200'
    case 'escalated':
      return 'bg-[#FEF2F2] text-[var(--color-escalation)] border border-[#FECACA]'
    default:
      return 'bg-gray-50 text-gray-400 border border-gray-100'
  }
}

function trendMeta(
  reductionPct: number | null
): { label: string; className: string } | null {
  if (reductionPct === null) return null
  if (reductionPct > 0) {
    return {
      label: `↓ Improving · ${Math.abs(reductionPct)}%`,
      className:
        'inline-flex max-w-[12rem] justify-end rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700',
    }
  }
  if (reductionPct < 0) {
    return {
      label: `↑ Needs attention · ${Math.abs(reductionPct)}%`,
      className:
        'inline-flex max-w-[12rem] justify-end rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 badge-regression',
    }
  }
  return {
    label: '→ Stable',
    className:
      'inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600',
  }
}

export function DashboardStudentListIsland({
  initialStudents,
  initialFilteredCount,
  caseloadTotalCount,
  incidentCountByStudent,
  variant = 'desktop',
}: Props) {
  const [studentSearch, setStudentSearch] = useState('')
  const [studentFilter, setStudentFilter] = useState<StudentFilterKey>('all')
  const [previewStudents, setPreviewStudents] =
    useState<DashboardStudentRow[]>(initialStudents)
  const [previewFilteredCount, setPreviewFilteredCount] =
    useState(initialFilteredCount)
  const skipFirstFetch = useRef(true)

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false
      return
    }
    const q = studentSearch.trim()
    const t = window.setTimeout(() => {
      const params = new URLSearchParams({
        filter: studentFilter,
        ...(q ? { q } : {}),
      })
      fetch(`/api/dashboard/students-preview?${params}`)
        .then(res => {
          if (!res.ok) throw new Error('preview failed')
          return res.json() as Promise<{
            data: { filteredCount: number; students: DashboardStudentRow[] }
          }>
        })
        .then(json => {
          startTransition(() => {
            setPreviewFilteredCount(json.data.filteredCount)
            setPreviewStudents(json.data.students)
          })
        })
        .catch(() => {
          startTransition(() => {
            setPreviewFilteredCount(0)
            setPreviewStudents([])
          })
        })
    }, 280)
    return () => clearTimeout(t)
  }, [studentSearch, studentFilter])

  function handleFilterChange(filter: StudentFilterKey) {
    startTransition(() => {
      setStudentFilter(filter)
    })
  }

  function handleSearchChange(query: string) {
    setStudentSearch(query)
  }

  const displayStudents = previewStudents

  const headerWrapperClass = variant === 'mobile' ? 'px-1 pt-1' : 'px-4 pt-4 md:px-5'

  return (
    <section className="os-card os-card-interactive min-w-0 overflow-x-hidden">
      <div className={headerWrapperClass}>
        <StudentsHeader
          totalCount={caseloadTotalCount}
          filteredCount={previewFilteredCount}
          activeFilter={studentFilter}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
        />
      </div>

      {displayStudents.length === 0 ? (
        caseloadTotalCount === 0 ? (
          <EmptyState
            icon={
              <img
                src="/logo-mark.png"
                alt=""
                className="h-10 w-10 object-contain opacity-40"
              />
            }
            title="No students assigned yet"
            body="Every student here is someone worth showing up for."
          />
        ) : (
          <p className={`os-body pb-4 ${variant === 'mobile' ? 'px-4' : 'px-4 md:px-5'}`}>
            No students match this filter or search. Try the{' '}
            <Link
              href="/dashboard/students"
              className="text-[var(--olive-600)] underline"
            >
              Student Caseload
            </Link>{' '}
            for the full list.
          </p>
        )
      ) : (
        <ul className="space-y-2">
          {displayStudents.map((student, i) => {
            const currentCount =
              student.incidents_30d !== undefined
                ? student.incidents_30d
                : (incidentCountByStudent[student.id] ?? 0)
            const baseline = student.baseline_incident_count
            const reductionPct =
              baseline && baseline > 0
                ? Number((((baseline - currentCount) / baseline) * 100).toFixed(0))
                : null
            const trend = trendMeta(reductionPct)

            if (variant === 'mobile') {
              return (
                <li key={student.id}>
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="card-enter os-student-card"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <svg
                      className="os-student-card__chevron"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      aria-hidden
                    >
                      <path
                        d="M6 4l4 4-4 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex items-start gap-3">
                      <StudentAvatar
                        firstName={student.first_name}
                        lastName={student.last_name}
                        size="sm"
                      />
                      <div>
                        <p className="os-heading">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="os-caption">
                          Gr {student.grade} · {student.school}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-[var(--radius-sm)] px-2 py-0.5 os-caption font-medium uppercase tracking-[0.07em] ${getStatusBadgeClass(student.status)}`}
                      >
                        {student.status}
                      </span>
                      <span className="os-caption">
                        {currentCount} inc. (30d)
                        {trend && (
                          <span className={`ml-2 ${trend.className}`}>
                            {trend.label}
                          </span>
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            }

            return (
              <li key={student.id}>
                <Link
                  href={`/dashboard/students/${student.id}`}
                  className="card-enter os-student-card"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <svg
                    className="os-student-card__chevron"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden
                  >
                    <path
                      d="M6 4l4 4-4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <StudentAvatar
                        firstName={student.first_name}
                        lastName={student.last_name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="os-heading">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="os-caption">
                          Grade {student.grade} · {student.school}
                        </p>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-shrink-0 flex-wrap items-center gap-3 sm:max-w-[min(100%,22rem)] sm:justify-end sm:text-right">
                      <span
                        className={`rounded-[var(--radius-sm)] px-2 py-0.5 os-caption font-medium uppercase tracking-[0.07em] ${getStatusBadgeClass(student.status)}`}
                      >
                        {student.status}
                      </span>
                      <div>
                        <p className="os-caption">Incidents (30d)</p>
                        <p className="os-data text-right sm:text-right">
                          {currentCount}
                        </p>
                      </div>
                      <div className="min-w-0 max-w-full text-left sm:min-w-[7rem] sm:text-right">
                        <p className="os-caption">vs baseline</p>
                        {trend ? (
                          <span
                            className={`${trend.className} mt-0.5 inline-flex max-w-full flex-wrap justify-start sm:max-w-[12rem] sm:justify-end`}
                          >
                            {trend.label}
                          </span>
                        ) : (
                          <p className="os-data">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {displayStudents.length > 0 && previewFilteredCount > 25 ? (
        <p
          className={`os-caption border-t border-[var(--border-default)] px-4 py-3 text-[var(--text-tertiary)] ${variant === 'mobile' ? '' : 'md:px-5'}`}
        >
          Showing the 25 most recent matches on the dashboard. Open{' '}
          <Link
            href="/dashboard/students"
            className="text-[var(--olive-600)] underline"
          >
            Student Caseload
          </Link>{' '}
          for all {previewFilteredCount} results.
        </p>
      ) : null}
    </section>
  )
}
