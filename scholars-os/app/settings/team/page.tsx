import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { InviteTeamMemberForm } from '@/components/settings/invite-team-member-form'
import { TeamRoster } from '@/components/settings/team-roster'

export default async function TeamSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')
  if (profile.role !== 'owner' && profile.role !== 'assistant') {
    redirect('/settings/account')
  }

  const tenant = await getTenantFromRequest()
  if (!profile.tenant_id || profile.tenant_id !== tenant.id) {
    redirect('/settings/account')
  }

  const [profiles, invitations] = await Promise.all([
    prisma.profile.findMany({
      where: { tenant_id: tenant.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        created_at: true,
        onboarding_complete: true,
      },
      orderBy: { created_at: 'asc' },
    }),
    prisma.invitation.findMany({
      where: { tenant_id: tenant.id, status: 'pending' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        resend_count: true,
      },
      orderBy: { created_at: 'desc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <TeamRoster
        initialProfiles={profiles.map(p => ({
          ...p,
          created_at: p.created_at.toISOString(),
        }))}
        initialInvitations={invitations.map(i => ({
          ...i,
          created_at: i.created_at.toISOString(),
        }))}
      />
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
