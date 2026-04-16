import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

const UpdateStudentSchema = z.object({
  assigned_counselor_id: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'graduated', 'transferred', 'inactive']).optional(),
  school: z.string().min(1).max(200).optional(),
  district: z.string().min(1).max(200).optional(),
  grade: z.enum(['K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12']).optional(),
  date_of_birth: z.string().datetime().nullable().optional(),
  session_format: z.enum(['individual', 'group']).optional(),
  referral_source: z.string().min(1).max(200).optional(),
  general_notes: z.string().max(5000).optional(),
})

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

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenant_id: tenant.id },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      date_of_birth: true,
      grade: true,
      school: true,
      district: true,
      assigned_counselor_id: true,
      referral_source: true,
      presenting_problem: true,
      intake_date: true,
      status: true,
      session_format: true,
      baseline_incident_count: true,
      baseline_window_start: true,
      baseline_window_end: true,
      general_notes: true,
      escalation_active: true,
      created_at: true,
      updated_at: true,
    },
  })

  if (!student) {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: student })
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id: studentId } = await ctx.params

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

  // Counselors cannot update student records (only owner/assistant)
  if (profile.role === 'counselor') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = UpdateStudentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // If assigning a counselor, verify the target profile exists and is active
  if (parsed.data.assigned_counselor_id) {
    const targetProfile = await prisma.profile.findUnique({
      where: { id: parsed.data.assigned_counselor_id },
      select: { id: true, active: true, role: true, tenant_id: true },
    })
    if (
      !targetProfile ||
      !targetProfile.active ||
      targetProfile.tenant_id !== tenant.id
    ) {
      return NextResponse.json(
        { error: 'Invalid counselor ID', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }
  }

  try {
    const { date_of_birth, ...rest } = parsed.data
    await prisma.student.update({
      where: { id: studentId },
      data: {
        ...rest,
        ...(date_of_birth !== undefined && {
          date_of_birth: date_of_birth === null ? null : new Date(date_of_birth),
        }),
      },
    })
    const updated = await prisma.student.findFirst({
      where: { id: studentId, tenant_id: tenant.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        assigned_counselor_id: true,
        status: true,
        updated_at: true,
      },
    })
    if (!updated) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[students/PATCH]', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
