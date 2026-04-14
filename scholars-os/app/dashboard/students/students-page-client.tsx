'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CreateStudentIntakeModal } from './create-student-intake-modal'

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
        {students.length === 0 ? (
          <p className="os-body">No students found yet.</p>
        ) : (
          <ul className="space-y-2">
            {students.map(student => (
              <li
                key={student.id}
                className="rounded-md bg-[var(--surface-inner)] p-3"
              >
                <Link
                  href={`/dashboard/students/${student.id}`}
                  className="os-heading underline"
                >
                  {student.first_name} {student.last_name}
                </Link>
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
