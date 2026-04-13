import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { CreateUserForm } from './create-user-form'

export default async function UsersSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')
  if (profile.role !== 'owner' && profile.role !== 'assistant') redirect('/dashboard')

  const users = await prisma.profile.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      _count: { select: { assigned_students: true } },
    },
    orderBy: { created_at: 'asc' },
  })

  return (
    <div className="os-page">
      <div className="os-card-tight flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="os-title">Team</h1>
          <p className="os-body mt-1">Manage counselor accounts and access</p>
        </div>
        <Link href="/dashboard" className="os-btn-secondary">
          Back to dashboard
        </Link>
      </div>

      {profile.role === 'owner' && (
        <div className="os-card">
          <h2 className="os-heading mb-4">Add team member</h2>
          <CreateUserForm />
        </div>
      )}

      <div className="os-card">
        <h2 className="os-heading mb-4">Active team members</h2>
        {users.length === 0 ? (
          <p className="os-body">No team members yet.</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-md bg-[var(--surface-inner)] px-4 py-3"
              >
                <div>
                  <p className="os-subhead">{u.name}</p>
                  <p className="os-caption">{u.email}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded px-2 py-0.5 os-caption font-medium ${
                      u.role === 'owner'
                        ? 'bg-[var(--gold-100)] text-[var(--olive-800)]'
                        : u.role === 'assistant'
                          ? 'bg-[var(--olive-100)] text-[var(--olive-700)]'
                          : 'bg-[var(--surface-page)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {u.role}
                  </span>
                  <p className="os-caption mt-1">
                    {u._count.assigned_students} student
                    {u._count.assigned_students !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
