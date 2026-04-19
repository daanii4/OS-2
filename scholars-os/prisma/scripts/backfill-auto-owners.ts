/**
 * Promote the auto-owner allow-list (lib/role-overrides.ts) to owners.
 *
 * Idempotent. Run any time:
 *   npx tsx prisma/scripts/backfill-auto-owners.ts
 *
 * What it does for each email in `AUTO_OWNER_EMAILS`:
 *   1. Looks up the matching `auth.users` row in Supabase (case-insensitive).
 *   2. Sets a one-time temporary password and stamps user metadata so the
 *      app's reset flow is triggered on next login.
 *   3. Upserts the corresponding `profiles` row with role=owner, active=true,
 *      attached to the first active tenant, with `must_reset_password=true`
 *      and `onboarding_complete=false` so the user goes through:
 *        login (temp pw)  ->  /reset-password  ->  /onboarding  ->  /dashboard
 *   4. Prints the temp password so the operator can hand it off securely.
 *
 * No existing data is destroyed. If the user already exists with a profile,
 * we only patch role/active/tenant/must_reset/onboarding flags and rotate
 * the temp password.
 */
import 'dotenv/config'

import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { AUTO_OWNER_EMAILS } from '../../lib/role-overrides'

const prisma = new PrismaClient()

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return v
}

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY')
)

function generateTempPassword(): string {
  // 16 chars: upper, lower, digits, symbol — meets common minimums.
  const bytes = crypto.randomBytes(12).toString('base64url').slice(0, 12)
  return `OS!${bytes}9`
}

async function findAuthUserByEmail(email: string) {
  // listUsers does not support per-email filtering so we paginate.
  const target = email.toLowerCase()
  let page = 1
  // Bounded loop — auth.users in this app is < 1k.
  for (let i = 0; i < 25; i++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) throw error
    const match = data.users.find(u => u.email?.toLowerCase() === target)
    if (match) return match
    if (data.users.length < 200) return null
    page += 1
  }
  return null
}

async function pickDefaultTenantId(): Promise<string | null> {
  const t = await prisma.tenant.findFirst({
    where: { active: true },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  })
  return t?.id ?? null
}

async function backfillOne(email: string, defaultTenantId: string | null) {
  console.log(`\n=== ${email} ===`)
  const tempPassword = generateTempPassword()

  let authUser = await findAuthUserByEmail(email)

  if (!authUser) {
    console.log(' - No auth.users row found. Creating one with temp password.')
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: email.split('@')[0],
        role: 'owner',
        must_reset_password: true,
      },
    })
    if (error) throw error
    authUser = data.user
  } else {
    console.log(' - Found auth.users row. Rotating temp password.')
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: tempPassword,
      user_metadata: {
        ...(authUser.user_metadata ?? {}),
        role: 'owner',
        must_reset_password: true,
      },
    })
    if (error) throw error
  }

  if (!authUser) throw new Error(`Auth user resolution failed for ${email}`)

  // Upsert the profile so we end up in the exact target state regardless of
  // what's already in the row (or whether the trigger has run).
  const tenantId = defaultTenantId

  const profile = await prisma.profile.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email,
      name: authUser.user_metadata?.name ?? email.split('@')[0] ?? email,
      role: 'owner',
      active: true,
      tenant_id: tenantId,
      must_reset_password: true,
      onboarding_complete: false,
      onboarding_step: 0,
    },
    update: {
      role: 'owner',
      active: true,
      // Only attach a tenant if missing — don't yank an existing assignment.
      ...(tenantId ? { tenant_id: tenantId } : {}),
      must_reset_password: true,
      onboarding_complete: false,
      onboarding_step: 0,
    },
    select: {
      id: true,
      email: true,
      role: true,
      active: true,
      tenant_id: true,
      must_reset_password: true,
      onboarding_complete: true,
    },
  })

  console.log(' - Profile state:', profile)
  console.log(' - Temporary password:', tempPassword)
  console.log(
    ' - Flow on next login: /login -> /reset-password -> /onboarding -> /dashboard'
  )
}

async function main() {
  console.log('Backfilling auto-owners:', AUTO_OWNER_EMAILS.join(', '))
  const defaultTenantId = await pickDefaultTenantId()
  if (!defaultTenantId) {
    console.warn(
      'WARNING: No active tenant found. Profiles will be created without tenant_id.'
    )
  } else {
    console.log(' - Default tenant id:', defaultTenantId)
  }

  for (const email of AUTO_OWNER_EMAILS) {
    try {
      await backfillOne(email, defaultTenantId)
    } catch (err) {
      console.error(` ! Failed for ${email}:`, err)
    }
  }
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
