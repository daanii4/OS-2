import { prisma } from '@/lib/prisma'
import type { UserRole } from '@prisma/client'

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
export async function getProfile(userId: string) {
  try {
    return await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        tenant_id: true,
      },
    })
  } catch (error) {
    const prismaCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? 'unknown')
        : 'unknown'

    console.error(
      `[permissions/getProfile] Prisma query failed code=${prismaCode} dbHost=${getDatabaseHost()} message=${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )

    throw error
  }
}
