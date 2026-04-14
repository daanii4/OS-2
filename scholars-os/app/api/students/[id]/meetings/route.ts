import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMeetingDelegate } from '@/lib/meetings-db'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, ctx: RouteContext) {
  const { id: studentId } = await ctx.params

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const d = getMeetingDelegate()
  if (!d) {
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 503 }
    )
  }

  const meetings = await d.findMany({
    where: {
      tenant_id: tenant.id,
      student_id: studentId,
    },
    orderBy: { meeting_date: 'desc' },
    select: {
      id: true,
      title: true,
      meeting_date: true,
      duration_minutes: true,
      location: true,
      meeting_type: true,
      status: true,
      notes: true,
      counselor_id: true,
      counselor: { select: { id: true, name: true } },
      created_at: true,
      updated_at: true,
    },
  })

  return NextResponse.json({ data: meetings, total: meetings.length })
}
