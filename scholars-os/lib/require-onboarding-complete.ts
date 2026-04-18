import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'

/** Redirect to /onboarding if the user has not finished onboarding (after password is set). */
export async function requireOnboardingComplete(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  if (!profile.must_reset_password && !profile.onboarding_complete) {
    redirect('/onboarding')
  }
}
