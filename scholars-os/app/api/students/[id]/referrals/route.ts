import { NextResponse } from 'next/server'
import { SessionType } from '@prisma/client'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

const ReferralCreateSchema = z
  .object({
    referral_date: z.string().datetime(),
    referred_by: z.string().trim().min(1),
    brief_description: z.string().trim().optional().nullable(),
    intervention_types: z.array(z.nativeEnum(SessionType)).min(1),
    assigned_to: z.string().uuid().optional().nullable(),
    linked_consent_id: z.string().uuid().optional().nullable(),
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

  const referrals = await prisma.referral.findMany({
    where: { tenant_id: tenant.id, student_id: studentId },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ data: referrals, total: referrals.length })
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
  const parsed = ReferralCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const referral = await prisma.referral.create({
      data: {
        tenant_id: tenant.id,
        student_id: studentId,
        referral_date: new Date(parsed.data.referral_date),
        referred_by: parsed.data.referred_by,
        brief_description: parsed.data.brief_description ?? null,
        intervention_types: parsed.data.intervention_types,
        assigned_to: parsed.data.assigned_to ?? null,
        linked_consent_id: parsed.data.linked_consent_id ?? null,
        created_by: profile.id,
      },
    })
    return NextResponse.json({ data: referral }, { status: 201 })
  } catch (error) {
    console.error('[students/[id]/referrals/POST]', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
