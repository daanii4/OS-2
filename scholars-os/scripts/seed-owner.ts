// One-time seed script — run once to create the owner account, then delete.
// Usage: npx ts-node --project tsconfig.json scripts/seed-owner.ts
// Or: npx tsx scripts/seed-owner.ts
import { supabaseAdmin } from '../lib/supabase/admin'

async function seedOwner() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'OWNERS_EMAIL_HERE',
    password: 'TEMPORARY_PASSWORD_HERE',
    email_confirm: true,
    user_metadata: {
      name: "De'marieya Nelson",
      role: 'owner',
    },
  })

  if (error) {
    console.error('Seed failed:', error.message)
    return
  }

  console.log('Owner created:', data.user?.id)
}

seedOwner()
