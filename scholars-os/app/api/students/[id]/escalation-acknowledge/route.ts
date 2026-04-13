/**
 * POST /api/students/[id]/escalation-acknowledge
 * Counselor acknowledges an escalation flag on a student.
 * Requires a note describing what action was taken.
 * Clears students.escalation_active.
 * Saves counselor_notes on the most recent escalated analysis.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

const AcknowledgeSchema = z.object({
  counselor_notes: z.string().trim().min(10).max(2000),
})

type RouteContext = {
  params: Promise<{ id: string }>
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

  const authorized = await canAccessStudent(profile.id, profile.role, studentId)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = AcknowledgeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    // Find the most recent escalated analysis to attach the counselor note to
    const escalatedAnalysis = await prisma.aiAnalysis.findFirst({
      where: { student_id: studentId, escalation_flag: true },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    })

    await prisma.$transaction(async tx => {
      // Clear escalation flag on the student
      await tx.student.update({
        where: { id: studentId },
        data: { escalation_active: false },
      })

      // Save counselor note + mark reviewed on the analysis
      if (escalatedAnalysis) {
        await tx.aiAnalysis.update({
          where: { id: escalatedAnalysis.id },
          data: {
            counselor_action: 'reviewed',
            counselor_notes: parsed.data.counselor_notes,
          },
        })
      }
    })

    return NextResponse.json({ data: { acknowledged: true } })
  } catch (err) {
    console.error('[escalation-acknowledge/POST] Failed', {
      studentId,
      counselorId: profile.id,
      error: err instanceof Error ? err.message : 'Unknown',
    })
    return NextResponse.json({ error: 'Server error', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
