import { PlanStatus, SessionFrequency, type Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { triggerAIAnalysis } from '@/lib/ai/analyze'
import { getTenantFromRequest } from '@/lib/tenant'

const MilestoneSchema = z
  .object({
    week_number: z.number().int().positive(),
    target_incident_count: z.number().int().nonnegative(),
    target_goal_completion_pct: z.number().min(0).max(100),
    specific_goals: z.array(z.string().trim().min(1)).min(1).max(3),
    counselor_strategy: z.string().trim().min(1),
    status: z.enum(['upcoming', 'in_progress', 'met', 'missed', 'adjusted']),
    actual_incident_count: z.number().int().nonnegative().optional(),
    actual_goal_completion_pct: z.number().min(0).max(100).optional(),
    notes: z.string().trim().optional(),
  })
  .strip()

const PlanCreateSchema = z
  .object({
    status: z.nativeEnum(PlanStatus).optional(),
    goal_statement: z.string().trim().min(1),
    target_reduction_pct: z.number().min(0).max(100),
    plan_duration_weeks: z.number().int().positive(),
    focus_behaviors: z.array(z.string().trim().min(1)).min(1),
    session_frequency: z.nativeEnum(SessionFrequency),
    milestones: z.array(MilestoneSchema).optional().nullable(),
    ai_counselor_guide: z.string().trim().optional().nullable(),
    plan_notes: z.string().trim().optional().nullable(),
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

  const plans = await prisma.successPlan.findMany({
    where: { tenant_id: tenant.id, student_id: studentId },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      student_id: true,
      created_by: true,
      status: true,
      goal_statement: true,
      target_reduction_pct: true,
      plan_duration_weeks: true,
      focus_behaviors: true,
      session_frequency: true,
      milestones: true,
      ai_counselor_guide: true,
      plan_notes: true,
      created_at: true,
      updated_at: true,
    },
  })

  return NextResponse.json({ data: plans, total: plans.length })
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
  const parsed = PlanCreateSchema.safeParse(body)
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

  try {
    const plan = await prisma.successPlan.create({
      data: {
        tenant_id: tenant.id,
        student_id: studentId,
        created_by: profile.id, // Always from authenticated profile
        status: parsed.data.status ?? PlanStatus.active,
        goal_statement: parsed.data.goal_statement,
        target_reduction_pct: parsed.data.target_reduction_pct,
        plan_duration_weeks: parsed.data.plan_duration_weeks,
        focus_behaviors: parsed.data.focus_behaviors,
        session_frequency: parsed.data.session_frequency,
        milestones: (parsed.data.milestones ?? null) as Prisma.InputJsonValue,
        ai_counselor_guide: parsed.data.ai_counselor_guide ?? null,
        plan_notes: parsed.data.plan_notes ?? null,
      },
      select: {
        id: true,
        student_id: true,
        created_by: true,
        status: true,
        goal_statement: true,
        target_reduction_pct: true,
        plan_duration_weeks: true,
        focus_behaviors: true,
        session_frequency: true,
        milestones: true,
        ai_counselor_guide: true,
        plan_notes: true,
        created_at: true,
        updated_at: true,
      },
    })

    // Fire AI analysis async -- never awaited, never blocks the response
    triggerAIAnalysis(studentId, 'plan_creation').catch(err => {
      console.error('[plans/POST] Background AI analysis failed', {
        studentId,
        error: err instanceof Error ? err.message : 'Unknown',
      })
    })

    return NextResponse.json({ data: plan }, { status: 201 })
  } catch (createError) {
    console.error('[students/[id]/plans/POST] Failed to create plan', {
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
