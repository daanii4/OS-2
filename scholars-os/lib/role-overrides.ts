/**
 * Emails that should always be promoted to `owner` on first login.
 *
 * Used by:
 * - `prisma/sql/handle_new_user.sql` (trigger that creates the profile)
 * - `lib/permissions.ts#getProfile` (runtime safety net — repairs stale rows)
 * - `prisma/scripts/backfill-auto-owners.ts` (one-shot backfill)
 *
 * Comparison is case-insensitive. Keep this list short and intentional.
 */
export const AUTO_OWNER_EMAILS: readonly string[] = [
  'elijahchrim@gmail.com',
  'demarieyanelson12@gmail.com',
] as const

/** Returns true if the given email should be auto-promoted to owner. */
export function isAutoOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return AUTO_OWNER_EMAILS.some(e => e === normalized)
}
