/**
 * Stored in students.intake_files — Vercel Blob URLs. Parsed from Prisma Json.
 * Optional fields mirror the referral form (Step 2) so each document can carry the same context.
 */
export type IntakeFileEntry = {
  name: string
  url: string
  uploaded_at: string
  referred_by?: string | null
  brief_description?: string | null
  /** ISO date string when provided */
  referral_date?: string | null
}

export function parseIntakeFiles(value: unknown): IntakeFileEntry[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (row): row is IntakeFileEntry =>
      typeof row === 'object' &&
      row !== null &&
      typeof (row as IntakeFileEntry).name === 'string' &&
      typeof (row as IntakeFileEntry).url === 'string' &&
      typeof (row as IntakeFileEntry).uploaded_at === 'string'
  )
}
