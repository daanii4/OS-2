import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { InviteTeamMemberForm } from '@/components/settings/invite-team-member-form'

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

  return (
    <div className="space-y-6">
      <div className="os-card space-y-4">
        <h1 className="os-title">Team</h1>
        <p className="os-body text-[var(--text-secondary)]">
          Send an email invite. The teammate sets their password from the link.
        </p>
        <InviteTeamMemberForm />
      </div>
    </div>
  )
}
