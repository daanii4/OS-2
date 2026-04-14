import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getProfile } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'
import { getTenantFromRequest } from '@/lib/tenant'
import { StudentsPageClient } from './students-page-client'

export default async function StudentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    redirect('/login')
  }

  const students = await prisma.student.findMany({
    where:
      profile.role === 'counselor'
        ? { tenant_id: tenant.id, assigned_counselor_id: profile.id }
        : { tenant_id: tenant.id },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      grade: true,
      school: true,
      district: true,
      status: true,
      intake_date: true,
    },
  })

  const canCreateStudents = profile.role === 'owner' || profile.role === 'assistant'

  const counselors = canCreateStudents
    ? await prisma.profile.findMany({
        where: {
          tenant_id: tenant.id,
          active: true,
          role: { in: ['counselor', 'assistant', 'owner'] },
        },
        select: { id: true, name: true, role: true },
        orderBy: { name: 'asc' },
      })
    : []

  return (
    <div className="os-page">
      <StudentsPageClient
        students={students}
        canCreateStudents={canCreateStudents}
        counselors={counselors}
        profileName={profile.name}
        profileRole={profile.role}
      />
    </div>
  )
}
