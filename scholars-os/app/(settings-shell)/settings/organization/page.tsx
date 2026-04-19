import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'

export default async function OrganizationSettingsPage() {
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
    <div className="os-card">
      <h1 className="os-title">Organization</h1>
      <p className="os-body mt-2 text-[var(--text-secondary)]">
        Organization name and default district: GET/PATCH <code className="text-sm">/api/settings/organization</code>.
        Writes require owner role.
      </p>
    </div>
  )
}
