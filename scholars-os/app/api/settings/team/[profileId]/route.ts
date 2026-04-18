import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

const TeamUpdateSchema = z.object({
  active: z.boolean(),
})

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await ctx.params

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
  if (profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const tenant = await getTenantFromRequest()
  if (!profile.tenant_id || profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const parsed = TeamUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  if (profileId === profile.id) {
    return NextResponse.json(
      { error: 'Cannot deactivate your own account', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  if (!parsed.data.active) {
    const assignedCount = await prisma.student.count({
      where: {
        assigned_counselor_id: profileId,
        tenant_id: tenant.id,
        status: 'active',
      },
    })
    if (assignedCount > 0) {
      return NextResponse.json(
        {
          error: `This counselor has ${assignedCount} active students. Reassign them before deactivating.`,
          code: 'VALIDATION_ERROR',
          detail: { assignedCount },
        },
        { status: 400 }
      )
    }
  }

  try {
    const updated = await prisma.profile.update({
      where: { id: profileId, tenant_id: tenant.id },
      data: { active: parsed.data.active },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    })
    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }
}
