/**
 * PATCH /api/mental-health-notes/[id]
 * Update district notes or case-closed flag for a caseload row.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

const PatchSchema = z
  .object({
    notes: z.string().trim().max(4000).optional().nullable(),
    case_closed: z.boolean().optional(),
  })
  .strict()

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id: noteId } = await ctx.params

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

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  if (parsed.data.notes === undefined && parsed.data.case_closed === undefined) {
    return NextResponse.json(
      { error: 'No fields to update', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const existing = await prisma.mentalHealthNote.findFirst({
    where: { id: noteId, tenant_id: tenant.id },
    select: { id: true, student_id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  const authorized = await canAccessStudent(
    profile.id,
    profile.role,
    existing.student_id,
    tenant.id
  )
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const data: { notes?: string | null; case_closed?: boolean } = {}
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes
  if (parsed.data.case_closed !== undefined) data.case_closed = parsed.data.case_closed

  const updated = await prisma.mentalHealthNote.update({
    where: { id: noteId },
    data,
    select: {
      id: true,
      notes: true,
      case_closed: true,
      report_month: true,
      student_id: true,
    },
  })

  return NextResponse.json({ data: updated })
}
