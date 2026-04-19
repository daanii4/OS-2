import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { InviteTeamMemberForm } from '@/components/settings/invite-team-member-form'
import {
  TeamRosterData,
  TeamRosterSkeleton,
} from './team-roster-data'

export default async function TeamSettingsPage() {
  // Auth + tenant resolution. These are tiny and shared across the app via
  // React `cache()`, but they still must finish before we know the page is
  // safe to render. Heavier roster queries stream in below behind Suspense.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, tenant] = await Promise.all([
    getProfile(user.id),
    getTenantFromRequest(),
  ])
  if (!profile || !profile.active) redirect('/login')
  if (profile.role !== 'owner' && profile.role !== 'assistant') {
    redirect('/settings/account')
  }
  if (!profile.tenant_id || profile.tenant_id !== tenant.id) {
    redirect('/settings/account')
  }

  const viewerRole: 'owner' | 'assistant' =
    profile.role === 'assistant' ? 'assistant' : 'owner'

  return (
    <div className="space-y-6">
      <Suspense fallback={<TeamRosterSkeleton />}>
        <TeamRosterData
          tenantId={tenant.id}
          viewerId={profile.id}
          viewerRole={viewerRole}
        />
      </Suspense>

      <div className="os-card space-y-4">
        <h1 className="os-title">Invite teammate</h1>
        <p className="os-body text-[var(--text-secondary)]">
          We email a temporary password. They sign in, choose a new password, then complete onboarding.
        </p>
        <InviteTeamMemberForm />
      </div>
    </div>
  )
}
