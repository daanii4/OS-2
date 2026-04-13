import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getProfile } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { CreateStudentForm } from './create-student-form'

function statusBadgeClass(status: string): string {
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

export default async function StudentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  const students = await prisma.student.findMany({
    where:
      profile.role === 'counselor'
        ? { assigned_counselor_id: profile.id }
        : undefined,
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      grade: true,
      school: true,
      district: true,
      status: true,
      intake_date: true,
    },
  })

  const canCreateStudents = profile.role === 'owner' || profile.role === 'assistant'

  return (
    <div className="os-page">
      <div className="os-card-tight flex flex-wrap items-center justify-between gap-3">
        <h1 className="os-title">Students</h1>
        <Link href="/dashboard" className="os-btn-secondary">
          Back to dashboard
        </Link>
      </div>

      <p className="os-caption">
        Signed in as {profile.name} ({profile.role})
      </p>

      {canCreateStudents ? (
        <CreateStudentForm />
      ) : (
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
    </div>
  )
}
