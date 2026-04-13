import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

const BaselineUpdateSchema = z
  .object({
    baseline_incident_count: z.number().int().nonnegative(),
    baseline_window_start: z.string().datetime(),
    baseline_window_end: z.string().datetime(),
  })
  .strip()

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, ctx: RouteContext) {
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
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  if (profile.role === 'counselor') {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const parsed = BaselineUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const startDate = new Date(parsed.data.baseline_window_start)
  const endDate = new Date(parsed.data.baseline_window_end)
  if (endDate < startDate) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: {
          baseline_window_end: ['baseline_window_end must be on or after start'],
        },
      },
      { status: 400 }
    )
  }

  try {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        baseline_incident_count: parsed.data.baseline_incident_count,
        baseline_window_start: startDate,
        baseline_window_end: endDate,
      },
    })
    const student = await prisma.student.findFirst({
      where: { id: studentId, tenant_id: tenant.id },
      select: {
        id: true,
        baseline_incident_count: true,
        baseline_window_start: true,
        baseline_window_end: true,
        updated_at: true,
      },
    })
    if (!student) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    return NextResponse.json({ data: student })
  } catch (updateError) {
    console.error('[students/[id]/baseline/PATCH] Failed to update baseline', {
      requesterId: profile.id,
      role: profile.role,
      studentId,
      error: updateError instanceof Error ? updateError.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
