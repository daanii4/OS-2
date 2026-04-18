import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Grade, SessionFormat, UserRole } from '@prisma/client'

type ProfileFields = {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  tenant_id: string | null
  must_reset_password: boolean
  onboarding_complete: boolean
  onboarding_step: number
  default_session_duration: number | null
  default_session_format: SessionFormat | null
  default_grade_filter_min: Grade | null
  default_grade_filter_max: Grade | null
}

const LEGACY_PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  tenant_id: true,
} as const

function isMissingColumnError(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false
  if (err.code === 'P2022') return true
  const msg = err.message.toLowerCase()
  return msg.includes('does not exist') || msg.includes('column')
}

function getDatabaseHost(): string {
  const url = process.env.DATABASE_URL
  if (!url) return 'missing'

  try {
    return new URL(url).hostname
  } catch {
    return 'invalid'
  }
}

/**
 * Verifies that a user can access a specific student record.
 * Owner and assistant see all students.
 * Counselor: DB query confirms assignment — never trust client-supplied data.
 *
 * Returns false if:
 * - Student does not exist
 * - Counselor is not assigned to this student
 */
export async function canAccessStudent(
  userId: string,
  role: UserRole,
  studentId: string,
  tenantId?: string
): Promise<boolean> {
  if (role === 'owner' || role === 'assistant') {
    const student = await prisma.student.findFirst({
      where: tenantId ? { id: studentId, tenant_id: tenantId } : { id: studentId },
      select: { id: true },
    })
    return student !== null
  }

  const assignment = await prisma.student.findFirst({
    where: {
      id: studentId,
      ...(tenantId ? { tenant_id: tenantId } : {}),
      assigned_counselor_id: userId,
    },
    select: { id: true },
  })

  return !!assignment
}

/**
 * Returns the authenticated user's profile from the database.
 * Called at the top of every route handler after verifying the Supabase session.
 * Returns null if profile does not exist or is inactive.
 */
export async function getProfile(userId: string): Promise<ProfileFields | null> {
  try {
    const row = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        tenant_id: true,
        must_reset_password: true,
        onboarding_complete: true,
        onboarding_step: true,
        default_session_duration: true,
        default_session_format: true,
        default_grade_filter_min: true,
        default_grade_filter_max: true,
      },
    })
    return row
  } catch (error) {
    if (!isMissingColumnError(error)) {
      const prismaCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code ?? 'unknown')
          : 'unknown'
      console.error(`GPF:${prismaCode}:HOST:${getDatabaseHost()}`)
      throw error
    }

    console.error(
      '[getProfile] Schema behind deploy — retrying without onboarding columns. Run prisma migrate deploy.'
    )

    const legacy = await prisma.profile.findUnique({
      where: { id: userId },
      select: LEGACY_PROFILE_SELECT,
    })
    if (!legacy) return null

    return {
      ...legacy,
      must_reset_password: false,
      onboarding_complete: true,
      onboarding_step: 0,
      default_session_duration: null,
      default_session_format: null,
      default_grade_filter_min: null,
      default_grade_filter_max: null,
    }
  }
}
