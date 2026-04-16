/**
 * GET /api/students/[id]/ai
 * Returns the AI analyses for a student, most recent first.
 * Restricted to: assigned counselor, assistant, owner.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, ctx: RouteContext) {
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

  const analyses = await prisma.aiAnalysis.findMany({
    where: { student_id: studentId },
    select: {
      id: true,
      triggered_by: true,
      problem_analysis: true,
      next_session_guide: true,
      recommended_interventions: true,
      plan_of_action: true,
      escalation_flag: true,
      escalation_reason: true,
      counselor_action: true,
      counselor_notes: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' },
    take: 10,
  })

  return NextResponse.json({ data: analyses, total: analyses.length })
}
