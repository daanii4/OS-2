import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import type { UserRole } from '@prisma/client'
import { requireOnboardingComplete } from '@/lib/require-onboarding-complete'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireOnboardingComplete()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  const navItems = (
    [
      { href: '/settings/account', label: 'Account', roles: ['owner', 'assistant', 'counselor'] as UserRole[] },
      { href: '/settings/preferences', label: 'Preferences', roles: ['owner', 'assistant', 'counselor'] as UserRole[] },
      { href: '/settings/organization', label: 'Organization', roles: ['owner', 'assistant'] as UserRole[] },
      { href: '/settings/danger', label: 'Danger zone', roles: ['owner'] as UserRole[] },
    ] as const
  )
    .filter(item => (item.roles as readonly UserRole[]).includes(profile.role))
    .map(({ href, label }) => ({ href, label }))

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-56">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <span aria-hidden>←</span> Back to Dashboard
        </Link>
        <p className="os-label mb-3">Settings</p>
        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-inner)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
