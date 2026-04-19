import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'

export default async function DangerSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')
  if (profile.role !== 'owner') {
    redirect('/settings/account')
  }

  return (
    <div className="os-card border-red-200">
      <h1 className="os-title">Danger zone</h1>
      <p className="os-body mt-2 text-[var(--text-secondary)]">
        Deactivate organization is not self-serve. Contact support to perform this action.
      </p>
      <button type="button" className="os-btn-secondary mt-4" disabled title="Contact support">
        Deactivate organization
      </button>
    </div>
  )
}
