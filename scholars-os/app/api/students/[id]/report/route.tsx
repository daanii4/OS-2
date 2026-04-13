/**
 * GET /api/students/[id]/report
 * Generates and streams a PDF progress report for a single student.
 * Access: assigned counselor, assistant, owner.
 */
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { StudentReportDocument, type Intervention } from '@/lib/pdf/student-report'

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

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Compute monthly windows for the last 6 months
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: d.toLocaleString('en-US', { month: 'short' }),
      start: d,
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    }
  })

  const [student, recentIncidents, sessions, activePlan, latestAnalysis, monthlyCountsRaw] =
    await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        select: {
          first_name: true,
          last_name: true,
          grade: true,
          school: true,
          district: true,
          referral_source: true,
          intake_date: true,
          session_format: true,
          presenting_problem: true,
          baseline_incident_count: true,
          baseline_window_start: true,
          baseline_window_end: true,
        },
      }),
      prisma.behavioralIncident.findMany({
        where: { student_id: studentId },
        orderBy: { incident_date: 'desc' },
        take: 10,
        select: {
          incident_date: true,
          incident_type: true,
          severity: true,
          reported_by: true,
          suspension_days: true,
        },
      }),
      prisma.session.findMany({
        where: { student_id: studentId },
        select: {
          attendance_status: true,
          goal_completion_rate: true,
        },
      }),
      prisma.successPlan.findFirst({
        where: { student_id: studentId, status: 'active' },
        select: {
          goal_statement: true,
          target_reduction_pct: true,
          plan_duration_weeks: true,
          focus_behaviors: true,
          session_frequency: true,
          status: true,
        },
      }),
      prisma.aiAnalysis.findFirst({
        where: { student_id: studentId },
        orderBy: { created_at: 'desc' },
        select: {
          problem_analysis: true,
          next_session_guide: true,
          recommended_interventions: true,
          created_at: true,
        },
      }),
      Promise.all(
        months.map(m =>
          prisma.behavioralIncident.count({
            where: {
              student_id: studentId,
              incident_date: { gte: m.start, lte: m.end },
            },
          })
        )
      ),
    ])

  if (!student) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  const currentIncidentCount = await prisma.behavioralIncident.count({
    where: { student_id: studentId, incident_date: { gte: thirtyDaysAgo } },
  })

  const baseline = student.baseline_incident_count
  const reductionPct =
    baseline && baseline > 0
      ? Number((((baseline - currentIncidentCount) / baseline) * 100).toFixed(0))
      : null

  const attendedSessions = sessions.filter(s => s.attendance_status === 'attended').length
  const ratesWithData = sessions
    .filter(s => s.goal_completion_rate !== null)
    .slice(-5)
  const avgGoalCompletionRate =
    ratesWithData.length > 0
      ? ratesWithData.reduce((sum, s) => sum + (s.goal_completion_rate ?? 0), 0) /
        ratesWithData.length
      : null

  const monthlyIncidents = months.map((m, i) => ({
    label: m.label,
    count: monthlyCountsRaw[i],
  }))

  const interventions = (latestAnalysis?.recommended_interventions ?? []) as Intervention[]

  try {
    const buffer = await renderToBuffer(
      <StudentReportDocument
        data={{
          student,
          currentIncidentCount,
          reductionPct,
          totalSessions: sessions.length,
          attendedSessions,
          avgGoalCompletionRate,
          monthlyIncidents,
          recentIncidents,
          activePlan: activePlan ?? null,
          latestAnalysis: latestAnalysis
            ? {
                problem_analysis: latestAnalysis.problem_analysis,
                next_session_guide: latestAnalysis.next_session_guide,
                recommended_interventions: interventions,
                created_at: latestAnalysis.created_at,
              }
            : null,
          generatedAt: now,
          generatedBy: profile.name,
        }}
      />
    )

    const filename = `os-report-${student.last_name.toLowerCase()}-${student.first_name.toLowerCase()}-${now.toISOString().slice(0, 10)}.pdf`

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
      },
    })
  } catch (err) {
    console.error('[report/GET] PDF generation failed', {
      studentId,
      error: err instanceof Error ? err.message : 'Unknown',
    })
    return NextResponse.json({ error: 'Report generation failed', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
