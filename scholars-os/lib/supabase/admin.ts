// Service role client — server only
// Use only for admin operations that must bypass RLS: seeding, user provisioning
// NEVER import this file in any client component or NEXT_PUBLIC_ context
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
