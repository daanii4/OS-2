/**
 * One-off / ops: set profiles.role for a user by email.
 *
 * Usage (from scholars-os/):
 *   PROMOTE_PROFILE_EMAIL=user@example.com PROMOTE_PROFILE_ROLE=owner npx tsx prisma/promote-profile-role.ts
 *
 * Role: owner | assistant | counselor
 * Requires DATABASE_URL (and .env loaded via dotenv).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.join(__dirname, '..', '.env') })

const RoleSchema = z.enum(['owner', 'assistant', 'counselor'])

async function main() {
  const emailRaw = process.env.PROMOTE_PROFILE_EMAIL?.trim()
  const emailParsed = z.string().email().safeParse(emailRaw)
  const roleParsed = RoleSchema.safeParse(process.env.PROMOTE_PROFILE_ROLE?.trim().toLowerCase())

  if (!emailParsed.success) {
    console.error('Set PROMOTE_PROFILE_EMAIL to a valid email address')
    process.exit(1)
  }
  if (!roleParsed.success) {
    console.error('Set PROMOTE_PROFILE_ROLE to owner, assistant, or counselor')
    process.exit(1)
  }

  const email = emailParsed.data
  const role = roleParsed.data as UserRole

  const profile = await prisma.profile.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true },
  })

  if (!profile) {
    console.error(`No profile found for email: ${email}`)
    process.exit(1)
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { role },
  })

  console.log(`Updated profile ${profile.email} to role "${role}".`)
}

main()
  .catch(e => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
