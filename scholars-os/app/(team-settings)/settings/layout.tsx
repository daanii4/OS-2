import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { requireOnboardingComplete } from '@/lib/require-onboarding-complete'

/** Team management at /settings/team — minimal chrome (no settings tabs, no sign out). */
export default async function TeamSettingsLayout({ children }: { children: React.ReactNode }) {
  // Resolve the user once, then run onboarding check + profile load in parallel.
  // Both reads are cached via React.cache(), so the page can reuse them
  // without a duplicate database round-trip.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [, profile] = await Promise.all([
    requireOnboardingComplete(),
    getProfile(user.id),
  ])
  if (!profile || !profile.active) redirect('/login')
  if (profile.role !== 'owner' && profile.role !== 'assistant') {
    redirect('/settings/account')
  }

  return (
    <div className="mx-auto min-h-full max-w-5xl px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <span aria-hidden>←</span> Back to Dashboard
      </Link>
      <main className="min-w-0">{children}</main>
    </div>
  )
}
