import { AttendanceStatus, type PrismaClient } from '@prisma/client'
import type { CaseloadNoteRow } from '@/lib/exports/CaseloadDocument'
import { caseloadMonthUtcRange } from '@/lib/caseload-month'
import { sessionTypesToPresentingLabels } from '@/lib/session-type-labels'

export type CaseloadExportSummary = {
  totalStudents: number
  totalSessions: number
  totalIndivSessions: number
  totalGroupSessions: number
}

/**
 * Builds merged caseload rows for a calendar month: mental health notes (district sheet rows)
 * plus attended sessions in that UTC month that never received a note (legacy data or edge cases).
 */
export async function buildCaseloadRowsForMonth(
  prisma: PrismaClient,
  tenantId: string,
  month: string,
  school: string
): Promise<{ rows: CaseloadNoteRow[]; summary: CaseloadExportSummary }> {
  const range = caseloadMonthUtcRange(month)
  if (!range) {
    return {
      rows: [],
      summary: {
        totalStudents: 0,
        totalSessions: 0,
        totalIndivSessions: 0,
        totalGroupSessions: 0,
      },
    }
  }

  const notes = await prisma.mentalHealthNote.findMany({
    where: {
      tenant_id: tenantId,
      report_month: month,
      school,
    },
    include: {
      student: {
        select: {
          first_name: true,
          last_name: true,
          grade: true,
        },
      },
    },
    orderBy: [{ student: { last_name: 'asc' } }, { session_number: 'asc' }],
  })

  const noteRows: CaseloadNoteRow[] = notes.map(n => ({
    id: n.id,
    student_id: n.student_id,
    student: n.student,
    date_seen: n.date_seen,
    session_number: n.session_number,
    presenting_problems: n.presenting_problems,
    session_format: n.session_format,
    case_closed: n.case_closed,
    notes: n.notes,
  }))

  const legacySessions = await prisma.session.findMany({
    where: {
      tenant_id: tenantId,
      attendance_status: AttendanceStatus.attended,
      session_date: { gte: range.start, lte: range.end },
      student: { school },
      mental_health_note: null,
    },
    include: {
      student: {
        select: {
          first_name: true,
          last_name: true,
          grade: true,
        },
      },
    },
  })

  const legacyStudentIds = [...new Set(legacySessions.map(s => s.student_id))]
  const priorCounts: Record<string, number> = {}
  if (legacyStudentIds.length > 0) {
    const grouped = await prisma.session.groupBy({
      by: ['student_id'],
      where: {
        tenant_id: tenantId,
        student_id: { in: legacyStudentIds },
        attendance_status: AttendanceStatus.attended,
        session_date: { lt: range.start },
      },
      _count: { _all: true },
    })
    for (const g of grouped) {
      priorCounts[g.student_id] = g._count._all
    }
  }

  const byStudent = new Map<string, typeof legacySessions>()
  for (const s of legacySessions) {
    const list = byStudent.get(s.student_id) ?? []
    list.push(s)
    byStudent.set(s.student_id, list)
  }

  const legacyRows: CaseloadNoteRow[] = []
  for (const [, sessions] of byStudent) {
    const sorted = [...sessions].sort(
      (a, b) => a.session_date.getTime() - b.session_date.getTime()
    )
    const prior = priorCounts[sorted[0]!.student_id] ?? 0
    sorted.forEach((s, i) => {
      legacyRows.push({
        id: `session-${s.id}`,
        student_id: s.student_id,
        student: s.student,
        date_seen: s.session_date,
        session_number: prior + i + 1,
        presenting_problems: sessionTypesToPresentingLabels([s.session_type]),
        session_format: s.session_format,
        case_closed: false,
        notes: null,
      })
    })
  }

  const rows = [...noteRows, ...legacyRows].sort((a, b) => {
    const ln = a.student.last_name.localeCompare(b.student.last_name)
    if (ln !== 0) return ln
    const fn = a.student.first_name.localeCompare(b.student.first_name)
    if (fn !== 0) return fn
    return new Date(a.date_seen).getTime() - new Date(b.date_seen).getTime()
  })

  const totalStudents = new Set(rows.map(r => r.student_id)).size
  const totalSessions = rows.length
  const totalGroupSessions = rows.filter(r => r.session_format === 'group').length
  const totalIndivSessions = rows.filter(r => r.session_format === 'individual').length

  return {
    rows,
    summary: {
      totalStudents,
      totalSessions,
      totalIndivSessions,
      totalGroupSessions,
    },
  }
}
