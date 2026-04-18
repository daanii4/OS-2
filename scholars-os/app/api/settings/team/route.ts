import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }
  if (profile.role !== 'owner' && profile.role !== 'assistant') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const tenant = await getTenantFromRequest()
  if (!profile.tenant_id || profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
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

  return NextResponse.json({ data: { profiles, invitations } })
}
