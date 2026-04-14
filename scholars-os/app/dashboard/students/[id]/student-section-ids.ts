export const STUDENT_SECTION_IDS = [
  'sessions',
  'incidents',
  'overview',
  'charts',
  'ai',
  'plans',
] as const

export type StudentSectionId = (typeof STUDENT_SECTION_IDS)[number]

export function normalizeStudentSection(
  raw: string | undefined | null
): StudentSectionId {
  if (raw && STUDENT_SECTION_IDS.includes(raw as StudentSectionId)) {
    return raw as StudentSectionId
  }
  return 'sessions'
}
