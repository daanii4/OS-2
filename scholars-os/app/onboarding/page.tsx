import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  if (profile.must_reset_password) {
    redirect('/reset-password')
  }

  if (profile.onboarding_complete) {
    redirect('/dashboard')
  }

  if (profile.role !== 'owner' && profile.role !== 'assistant' && profile.role !== 'counselor') {
    redirect('/dashboard')
  }

  return (
    <OnboardingFlow
      profile={{
        id: profile.id,
        name: profile.name,
        role: profile.role,
        onboarding_step: profile.onboarding_step,
      }}
    />
  )
}
