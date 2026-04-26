export const STUDENT_SECTION_IDS = [
  'plans',
  'sessions',
  'overview',
  'incidents',
  'charts',
] as const

export type StudentSectionId = (typeof STUDENT_SECTION_IDS)[number]

export function normalizeStudentSection(
  raw: string | undefined | null
): StudentSectionId {
  if (raw === 'ai') {
    return 'overview'
  }
  if (raw && STUDENT_SECTION_IDS.includes(raw as StudentSectionId)) {
    return raw as StudentSectionId
  }
  return 'sessions'
}
