'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  StudentsHeader,
  type StudentFilterKey,
} from '@/components/students/students-header'
import { EmptyState } from '@/components/ui/empty-state'

const CreateStudentIntakeModal = dynamic(
  () =>
    import('./create-student-intake-modal').then(m => ({
      default: m.CreateStudentIntakeModal,
    })),
  { ssr: false }
)

type StudentRow = {
  id: string
  first_name: string
  last_name: string
  grade: string
  school: string
  district: string
  status: string
  intake_date: Date | string
  baseline_incident_count: number | null
  escalation_active: boolean
}

type CounselorOption = { id: string; name: string; role: string }

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-[var(--olive-100)] text-[var(--olive-800)] border border-[var(--olive-200)]'
    case 'graduated':
      return 'bg-[var(--gold-100)] text-[#7A5A10] border border-[var(--gold-200)]'
    case 'transferred':
      return 'bg-gray-100 text-gray-600 border border-gray-200'
    case 'inactive':
      return 'bg-gray-50 text-gray-500 border border-gray-200'
    default:
      return 'bg-gray-50 text-gray-400 border border-gray-100'
  }
}

type Props = {
  students: StudentRow[]
  incidents30dByStudent: Record<string, number>
  canCreateStudents: boolean
  counselors: CounselorOption[]
  profileName: string
  profileRole: string
}

function reductionPct(
  baseline: number | null,
  currentIncidents: number
): number | null {
  if (baseline === null || baseline <= 0) return null
  return Number((((baseline - currentIncidents) / baseline) * 100).toFixed(0))
}

/** Positive when incidents worsened vs baseline (matches “delta_pct” in spec). */
function regressionDeltaPct(
  baseline: number | null,
  currentIncidents: number
): number | null {
  const r = reductionPct(baseline, currentIncidents)
  if (r === null) return null
  return -r
}

export function StudentsPageClient({
  students,
  incidents30dByStudent,
  canCreateStudents,
  counselors,
  profileName,
  profileRole,
}: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<StudentFilterKey>('all')

  const filteredStudents = useMemo(() => {
    let list = students
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        student =>
          `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) ||
          student.school.toLowerCase().includes(q)
      )
    }
    if (activeFilter === 'regression') {
      list = list.filter(s => {
        const current = incidents30dByStudent[s.id] ?? 0
        const delta = regressionDeltaPct(s.baseline_incident_count, current)
        return delta !== null && delta >= 25
      })
    }
    if (activeFilter === 'escalated') {
      list = list.filter(s => s.escalation_active)
    }
    return list
  }, [activeFilter, incidents30dByStudent, query, students])

  function onCreated() {
    router.refresh()
  }

  return (
    <div className="px-5 py-5 md:px-6">
      <Link
        href="/dashboard"
        className="os-btn-secondary mb-4 inline-flex w-full justify-center sm:w-auto md:hidden"
      >
        Back to dashboard
      </Link>

      <StudentsHeader
        totalCount={students.length}
        filteredCount={filteredStudents.length}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onSearchChange={setQuery}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="os-caption">
          Signed in as {profileName} ({profileRole})
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canCreateStudents && (
            <button
              type="button"
              className="os-btn-primary hidden md:inline-flex"
              onClick={() => setModalOpen(true)}
            >
              Add Student to Caseload
            </button>
          )}
          <Link href="/dashboard" className="os-btn-secondary hidden md:inline-flex">
            Back to dashboard
          </Link>
        </div>
      </div>

      {!canCreateStudents && (
        <p className="mb-4 os-body text-[var(--text-secondary)]">
          Counselors can view assigned students but cannot create student records.
        </p>
      )}

      <div className="os-card">
        <h2 className="os-heading mb-3">Student list</h2>

        {students.length === 0 ? (
          <EmptyState
            icon={
              <img src="/logo-mark.png" alt="" className="h-10 w-10 object-contain opacity-40" />
            }
            title="No students assigned yet"
            body="Every student here is someone worth showing up for."
            action={
              canCreateStudents
                ? { label: 'Add Student to Caseload', onClick: () => setModalOpen(true) }
                : undefined
            }
          />
        ) : filteredStudents.length === 0 ? (
          <p className="os-body">No students match that search.</p>
        ) : (
          <ul className="space-y-2">
            {filteredStudents.map((student, i) => (
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
                  <p className="os-heading">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="os-body">
                    Grade {student.grade} · {student.school} · {student.district}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] ${statusBadgeClass(student.status)}`}
                    >
                      {student.status}
                    </span>
                    <span className="os-caption">
                      Intake:{' '}
                      <span className="os-data-sm">
                        {new Date(student.intake_date).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canCreateStudents && (
        <button
          type="button"
          className="os-btn-primary fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full p-0 text-2xl shadow-lg md:hidden"
          onClick={() => setModalOpen(true)}
          aria-label="Add Student to Caseload"
        >
          +
        </button>
      )}

      {canCreateStudents && (
        <CreateStudentIntakeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          counselors={counselors}
          onCreated={onCreated}
        />
      )}
    </div>
  )
}
