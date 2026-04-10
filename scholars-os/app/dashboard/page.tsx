import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  return (
    <div>
      <p>Signed in as {profile.name} — {profile.role}</p>
    </div>
  )
}
