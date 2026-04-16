import type { Prisma, SessionFormat, SessionType } from '@prisma/client'
import { sessionTypesToPresentingLabels } from '@/lib/session-type-labels'

function reportMonthFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Creates a caseload row for an attended session (district monthly sheet).
 * Call inside the same transaction as `session.create`.
 */
export async function createMentalHealthNoteForSession(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string
    studentId: string
    sessionId: string
    counselorId: string
    sessionDate: Date
    sessionFormat: SessionFormat
    school: string
    interventionTypes: SessionType[] | null | undefined
    districtNotes: string | null | undefined
  }
): Promise<void> {
  const priorCount = await tx.mentalHealthNote.count({
    where: { tenant_id: input.tenantId, student_id: input.studentId },
  })

  const presentingProblems = sessionTypesToPresentingLabels(input.interventionTypes ?? [])

  const notes = input.districtNotes?.trim() || null

  await tx.mentalHealthNote.create({
    data: {
      tenant_id: input.tenantId,
      student_id: input.studentId,
      session_id: input.sessionId,
      counselor_id: input.counselorId,
      report_month: reportMonthFromDate(input.sessionDate),
      school: input.school,
      date_seen: input.sessionDate,
      session_number: priorCount + 1,
      presenting_problems: presentingProblems,
      session_format: input.sessionFormat,
      case_closed: false,
      notes,
    },
  })
}
