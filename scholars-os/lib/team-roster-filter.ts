import type { Prisma } from '@prisma/client'

/**
 * Optional `TEST_USER_EMAIL` — excluded from team roster UI/API so QA accounts
 * do not appear in production team lists.
 */
export function teamRosterEmailExclude(): Prisma.ProfileWhereInput {
  const email = process.env.TEST_USER_EMAIL?.trim().toLowerCase()
  if (!email) return {}
  return { NOT: { email: { equals: email, mode: 'insensitive' } } }
}

export function teamRosterInvitationEmailExclude(): Prisma.InvitationWhereInput {
  const email = process.env.TEST_USER_EMAIL?.trim().toLowerCase()
  if (!email) return {}
  return { NOT: { email: { equals: email, mode: 'insensitive' } } }
}
