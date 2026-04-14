import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { StudentStatus } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

const PatchBodySchema = z.object({
  status: z.nativeEnum(StudentStatus),
  note: z.string().trim().max(2000).optional().nullable(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
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

  if (profile.role !== 'owner' && profile.role !== 'assistant') {
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

  const body = await req.json()
  const parsed = PatchBodySchema.safeParse(body)
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

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenant_id: tenant.id },
    select: { id: true, status: true },
  })

  if (!student) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  if (student.status === parsed.data.status) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: { status: ['Status is unchanged'] },
      },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.$transaction(async tx => {
      await tx.studentStatusLog.create({
        data: {
          tenant_id: tenant.id,
          student_id: studentId,
          changed_by: profile.id,
          old_status: student.status,
          new_status: parsed.data.status,
          note: parsed.data.note ?? null,
        },
      })

      return tx.student.update({
        where: { id: studentId },
        data: { status: parsed.data.status },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          grade: true,
          school: true,
          district: true,
          status: true,
          intake_date: true,
          assigned_counselor_id: true,
          updated_at: true,
        },
      })
    })

    return NextResponse.json({ data: updated })
  } catch (e) {
    console.error('[students/id/status PATCH]', {
      studentId,
      requesterId: profile.id,
      error: e instanceof Error ? e.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
