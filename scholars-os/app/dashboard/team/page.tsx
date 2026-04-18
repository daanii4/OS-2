import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { InviteTeamMemberForm } from '@/components/settings/invite-team-member-form'

export default async function DashboardTeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')
  if (profile.role !== 'owner' && profile.role !== 'assistant') {
    redirect('/dashboard')
  }

  return (
    <div className="os-page">
      <div className="os-card-tight mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="os-btn-secondary">
          Back to dashboard
        </Link>
        <Link href="/settings/team" className="os-btn-secondary">
          Open in OS Settings
        </Link>
      </div>
      <div className="space-y-6">
        <div className="os-card space-y-4">
          <h1 className="os-title">Team</h1>
          <p className="os-body text-[var(--text-secondary)]">
            Send an email invite. The teammate sets their password from the link. Full account
            management for counselors and assistants is in OS Settings.
          </p>
          <InviteTeamMemberForm />
        </div>
      </div>
    </div>
  )
}
