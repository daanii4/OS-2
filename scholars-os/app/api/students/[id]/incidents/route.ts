import { IncidentType, Severity } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { triggerAIAnalysis } from '@/lib/ai/analyze'
import { getTenantFromRequest } from '@/lib/tenant'

function parseIncidentDateInput(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00`)
  }
  return new Date(s)
}

const IncidentCreateSchema = z
  .object({
    incident_date: z.string().min(1),
    incident_type: z.nativeEnum(IncidentType),
    suspension_days: z.number().nonnegative().optional().nullable(),
    severity: z.nativeEnum(Severity),
    description: z.string().trim().max(50000).optional().nullable(),
    reported_by: z.string().trim().min(1),
    linked_session_id: z.string().uuid().optional().nullable(),
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

  const incidents = await prisma.behavioralIncident.findMany({
    where: { tenant_id: tenant.id, student_id: studentId },
    orderBy: { incident_date: 'desc' },
    select: {
      id: true,
      incident_date: true,
      incident_type: true,
      suspension_days: true,
      severity: true,
      description: true,
      reported_by: true,
      logged_by: true,
      linked_session_id: true,
      created_at: true,
    },
  })

  return NextResponse.json({ data: incidents, total: incidents.length })
}

export async function POST(req: Request, ctx: RouteContext) {
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

  const body = await req.json()
  const parsed = IncidentCreateSchema.safeParse(body)
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

  const isSuspension =
    parsed.data.incident_type === IncidentType.suspension_iss ||
    parsed.data.incident_type === IncidentType.suspension_oss

  if (
    isSuspension &&
    (parsed.data.suspension_days === null || parsed.data.suspension_days === undefined)
  ) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: {
          suspension_days: ['Required for suspension incident types'],
        },
      },
      { status: 400 }
    )
  }

  if (!isSuspension && parsed.data.suspension_days) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: {
          suspension_days: ['Only allowed for suspension incident types'],
        },
      },
      { status: 400 }
    )
  }

  const descriptionText =
    parsed.data.description?.trim() && parsed.data.description.trim().length > 0
      ? parsed.data.description.trim()
      : 'No description provided.'

  try {
    const incident = await prisma.behavioralIncident.create({
      data: {
        tenant_id: tenant.id,
        student_id: studentId,
        incident_date: parseIncidentDateInput(parsed.data.incident_date),
        incident_type: parsed.data.incident_type,
        suspension_days: isSuspension ? (parsed.data.suspension_days ?? null) : null,
        severity: parsed.data.severity,
        description: descriptionText,
        reported_by: parsed.data.reported_by,
        logged_by: profile.id,
        linked_session_id: parsed.data.linked_session_id ?? null,
      },
      select: {
        id: true,
        incident_date: true,
        incident_type: true,
        suspension_days: true,
        severity: true,
        description: true,
        reported_by: true,
        logged_by: true,
        linked_session_id: true,
        created_at: true,
      },
    })

    // Fire AI analysis async -- never awaited, never blocks the response
    triggerAIAnalysis(studentId, 'new_incident').catch(err => {
      console.error('[incidents/POST] Background AI analysis failed', {
        studentId,
        error: err instanceof Error ? err.message : 'Unknown',
      })
    })

    return NextResponse.json({ data: incident }, { status: 201 })
  } catch (createError) {
    console.error('[students/[id]/incidents/POST] Failed to log incident', {
      requesterId: profile.id,
      role: profile.role,
      studentId,
      error: createError instanceof Error ? createError.message : 'Unknown',
    })
    return NextResponse.json(
      { error: 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
