import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

const PreferencesSchema = z.object({
  default_session_duration: z.number().int().min(15).max(120).optional().nullable(),
  default_session_format: z.enum(['individual', 'group']).optional().nullable(),
  default_grade_filter_min: z.enum(['K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12']).optional().nullable(),
  default_grade_filter_max: z.enum(['K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12']).optional().nullable(),
})

export async function PATCH(req: NextRequest) {
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const parsed = PreferencesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data: Record<string, unknown> = {}
  if ('default_session_duration' in parsed.data) {
    data.default_session_duration = parsed.data.default_session_duration
  }
  if ('default_session_format' in parsed.data) {
    data.default_session_format = parsed.data.default_session_format
  }
  if (profile.role === 'owner' || profile.role === 'assistant') {
    if ('default_grade_filter_min' in parsed.data) {
      data.default_grade_filter_min = parsed.data.default_grade_filter_min
    }
    if ('default_grade_filter_max' in parsed.data) {
      data.default_grade_filter_max = parsed.data.default_grade_filter_max
    }
  }

  try {
    const updated = await prisma.profile.update({
      where: { id: user.id },
      data,
      select: {
        default_session_duration: true,
        default_session_format: true,
        default_grade_filter_min: true,
        default_grade_filter_max: true,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[settings/preferences]', err instanceof Error ? err.message : 'Unknown')
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
