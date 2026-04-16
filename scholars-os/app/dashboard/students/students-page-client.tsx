'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

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
  canCreateStudents: boolean
  counselors: CounselorOption[]
  profileName: string
  profileRole: string
}

export function StudentsPageClient({
  students,
  canCreateStudents,
  counselors,
  profileName,
  profileRole,
}: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(student =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) ||
      student.school.toLowerCase().includes(q)
    )
  }, [query, students])

  function onCreated() {
    router.refresh()
  }

  return (
    <>
      <div className="os-card-tight flex flex-wrap items-center justify-between gap-3 pr-14 md:pr-3">
        <h1 className="os-title">Students</h1>
        <div className="flex items-center gap-2">
          {canCreateStudents && (
            <button
              type="button"
              className="os-btn-primary hidden md:inline-flex"
              onClick={() => setModalOpen(true)}
            >
              Add student
            </button>
          )}
          <Link href="/dashboard" className="os-btn-secondary">
            Back to dashboard
          </Link>
        </div>
      </div>

      <p className="os-caption">
        Signed in as {profileName} ({profileRole})
      </p>

      {!canCreateStudents && (
        <p className="os-card-tight os-body">
          Counselors can view assigned students but cannot create student records.
        </p>
      )}

      <div className="os-card">
        <h2 className="os-heading mb-3">Student list</h2>

        <div className="relative mb-4 md:hidden">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search students..."
            className="os-input w-full pr-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {students.length === 0 ? (
          <p className="os-body">No students found yet.</p>
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
          aria-label="Add student"
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
    </>
  )
}
