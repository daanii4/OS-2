import { prisma } from '@/lib/prisma'

export type StudentAIContext = {
  student: {
    first_name: string
    last_name: string
    grade: string
    school: string
    district: string
    presenting_problem: string
    intake_date: Date
    session_format: string
    referral_source: string
    baseline_incident_count: number | null
    baseline_window_start: Date | null
    baseline_window_end: Date | null
  }
  incidents: Array<{
    incident_date: Date
    incident_type: string
    severity: string
    description: string
    reported_by: string
    suspension_days: number | null
  }>
  sessions: Array<{
    session_date: Date
    session_type: string
    attendance_status: string
    session_summary: string | null
    session_goals: unknown
    goal_completion_rate: number | null
  }>
  activePlan: {
    goal_statement: string
    target_reduction_pct: number
    focus_behaviors: string[]
    session_frequency: string
    milestones: unknown
    plan_duration_weeks: number
  } | null
  priorAnalyses: Array<{
    triggered_by: string
    problem_analysis: string
    next_session_guide: string
    created_at: Date
  }>
}

export async function getStudentContext(studentId: string): Promise<StudentAIContext> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      first_name: true,
      last_name: true,
      grade: true,
      school: true,
      district: true,
      presenting_problem: true,
      intake_date: true,
      session_format: true,
      referral_source: true,
      baseline_incident_count: true,
      baseline_window_start: true,
      baseline_window_end: true,
      // general_notes intentionally excluded -- not AI-analyzed per spec
    },
  })

  const incidents = await prisma.behavioralIncident.findMany({
    where: { student_id: studentId },
    select: {
      incident_date: true,
      incident_type: true,
      severity: true,
      description: true,
      reported_by: true,
      suspension_days: true,
    },
    orderBy: { incident_date: 'asc' },
  })

  const sessions = await prisma.session.findMany({
    where: { student_id: studentId },
    select: {
      session_date: true,
      session_type: true,
      attendance_status: true,
      session_summary: true,
      session_goals: true,
      goal_completion_rate: true,
    },
    orderBy: { session_date: 'asc' },
  })

  const activePlan = await prisma.successPlan.findFirst({
    where: { student_id: studentId, status: 'active' },
    select: {
      goal_statement: true,
      target_reduction_pct: true,
      focus_behaviors: true,
      session_frequency: true,
      milestones: true,
      plan_duration_weeks: true,
    },
  })

  const priorAnalyses = await prisma.aiAnalysis.findMany({
    where: { student_id: studentId },
    select: {
      triggered_by: true,
      problem_analysis: true,
      next_session_guide: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' },
    take: 3,
  })

  return {
    student,
    incidents,
    sessions,
    activePlan,
    priorAnalyses,
  }
}
