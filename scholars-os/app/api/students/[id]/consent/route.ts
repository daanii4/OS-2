import { NextResponse } from 'next/server'
import { ConsentStatus } from '@prisma/client'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

const ConsentCreateSchema = z
  .object({
    school_year: z.string().regex(/^\d{4}-\d{4}$/),
    parent_guardian_name: z.string().trim().min(1),
    consent_date: z.string().datetime(),
    district: z.string().trim().min(1),
    school: z.string().trim().min(1),
    behaviorist_name: z.string().trim().min(1),
    status: z.nativeEnum(ConsentStatus).optional(),
    signed_copy_url: z.string().url().optional().nullable(),
  })
  .strip()

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

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const consent = await prisma.consentRecord.findMany({
    where: { tenant_id: tenant.id, student_id: studentId },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ data: consent, total: consent.length })
}

export async function POST(req: Request, ctx: RouteContext) {
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

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = ConsentCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const consent = await prisma.consentRecord.create({
      data: {
        tenant_id: tenant.id,
        student_id: studentId,
        school_year: parsed.data.school_year,
        parent_guardian_name: parsed.data.parent_guardian_name,
        consent_date: new Date(parsed.data.consent_date),
        district: parsed.data.district,
        school: parsed.data.school,
        behaviorist_name: parsed.data.behaviorist_name,
        status: parsed.data.status ?? ConsentStatus.active,
        signed_copy_url: parsed.data.signed_copy_url ?? null,
        created_by: profile.id,
      },
    })
    return NextResponse.json({ data: consent }, { status: 201 })
  } catch (error) {
    console.error('[students/[id]/consent/POST]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
