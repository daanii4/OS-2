import {
  AttendanceStatus,
  SessionFormat,
  SessionType,
  type Prisma,
} from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { triggerAIAnalysis } from '@/lib/ai/analyze'
import { getTenantFromRequest } from '@/lib/tenant'

const SessionGoalSchema = z.object({
  goal: z.string().trim().min(1),
  met: z.boolean(),
})

const SessionCreateSchema = z
  .object({
    session_date: z.string().datetime(),
    session_type: z.nativeEnum(SessionType).optional(),
    session_format: z.nativeEnum(SessionFormat).optional(),
    duration_minutes: z.number().int().positive().max(240).optional(),
    attendance_status: z.nativeEnum(AttendanceStatus),
    session_summary: z.string().trim().optional().nullable(),
    session_goals: z.array(SessionGoalSchema).optional().nullable(),
    linked_incident_ids: z.array(z.string().uuid()).optional().nullable(),
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

  const sessions = await prisma.session.findMany({
    where: { tenant_id: tenant.id, student_id: studentId },
    orderBy: { session_date: 'desc' },
    select: {
      id: true,
      student_id: true,
      counselor_id: true,
      session_date: true,
      session_type: true,
      session_format: true,
      duration_minutes: true,
      attendance_status: true,
      goals_attempted: true,
      goals_met: true,
      goal_completion_rate: true,
      created_at: true,
      updated_at: true,
      // session_summary intentionally excluded from list endpoint
    },
  })

  return NextResponse.json({ data: sessions, total: sessions.length })
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
  const parsed = SessionCreateSchema.safeParse(body)
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

  const summary = parsed.data.session_summary?.trim() || null
  if (parsed.data.attendance_status === AttendanceStatus.attended && !summary) {
    return NextResponse.json(
      {
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        detail: {
          session_summary: ['Session summary is required for attended sessions'],
        },
      },
      { status: 400 }
    )
  }

  const goals = (parsed.data.session_goals ?? null) as
    | Array<{ goal: string; met: boolean }>
    | null
  const goalsAttempted = goals?.length ?? 0
  const goalsMet = goals?.filter(goal => goal.met).length ?? 0

  const computedGoals =
    goalsAttempted > 0
      ? {
          goals_attempted: goalsAttempted,
          goals_met: goalsMet,
          goal_completion_rate: Number(
            ((goalsMet / goalsAttempted) * 100).toFixed(2)
          ),
        }
      : {
          goals_attempted: null,
          goals_met: null,
          goal_completion_rate: null,
        }

  const linkedIncidentIds = parsed.data.linked_incident_ids ?? []
  if (linkedIncidentIds.length > 0) {
    const linkedIncidentCount = await prisma.behavioralIncident.count({
      where: {
        tenant_id: tenant.id,
        id: { in: linkedIncidentIds },
        student_id: studentId,
      },
    })

    if (linkedIncidentCount !== linkedIncidentIds.length) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          detail: {
            linked_incident_ids: ['One or more linked incidents are invalid'],
          },
        },
        { status: 400 }
      )
    }
  }

  try {
    const session = await prisma.$transaction(async tx => {
      const createdSession = await tx.session.create({
        data: {
          tenant_id: tenant.id,
          student_id: studentId,
          counselor_id: profile.id, // Always from authenticated profile
          session_date: new Date(parsed.data.session_date),
          session_type: parsed.data.session_type ?? SessionType.check_in,
          session_format: parsed.data.session_format ?? SessionFormat.individual,
          duration_minutes: parsed.data.duration_minutes ?? 30,
          attendance_status: parsed.data.attendance_status,
          session_summary: summary,
          session_goals: goals as Prisma.InputJsonValue,
          ...computedGoals, // Computed server-side; never trust client values
        },
        select: {
          id: true,
          student_id: true,
          counselor_id: true,
          session_date: true,
          session_type: true,
          session_format: true,
          duration_minutes: true,
          attendance_status: true,
          session_summary: true,
          session_goals: true,
          goals_attempted: true,
          goals_met: true,
          goal_completion_rate: true,
          created_at: true,
          updated_at: true,
        },
      })

      if (linkedIncidentIds.length > 0) {
        await tx.behavioralIncident.updateMany({
          where: {
            tenant_id: tenant.id,
            id: { in: linkedIncidentIds },
            student_id: studentId,
          },
          data: { linked_session_id: createdSession.id },
        })
      }

      return createdSession
    })

    // Fire AI analysis async -- never awaited, never blocks the response
    triggerAIAnalysis(studentId, 'new_session', session.id).catch(err => {
      console.error('[sessions/POST] Background AI analysis failed', {
        studentId,
        sessionId: session.id,
        error: err instanceof Error ? err.message : 'Unknown',
      })
    })

    return NextResponse.json({ data: session }, { status: 201 })
  } catch (createError) {
    console.error('[students/[id]/sessions/POST] Failed to create session', {
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
