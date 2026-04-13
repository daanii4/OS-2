import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

type RouteContext = {
  params: Promise<{ id: string }>
}

type Period = 'week' | 'month' | 'year'

function parsePeriod(value: string | null): Period {
  if (value === 'week' || value === 'month' || value === 'year') {
    return value
  }
  return 'month'
}

function daysForPeriod(period: Period): number {
  if (period === 'week') return 7
  if (period === 'year') return 365
  return 30
}

function getWindow(days: number): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - (days - 1))
  return { start, end }
}

function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Number((((current - previous) / previous) * 100).toFixed(2))
}

function pctReductionFromBaseline(
  baseline: number | null,
  currentCount: number
): number | null {
  if (baseline === null || baseline <= 0) return null
  return Number((((baseline - currentCount) / baseline) * 100).toFixed(2))
}

export async function GET(req: Request, ctx: RouteContext) {
  const { id: studentId } = await ctx.params
  const period = parsePeriod(new URL(req.url).searchParams.get('period'))
  const days = daysForPeriod(period)

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

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenant_id: tenant.id },
    select: {
      id: true,
      baseline_incident_count: true,
      baseline_window_start: true,
      baseline_window_end: true,
    },
  })

  if (!student) {
    return NextResponse.json(
      { error: 'Not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const currentWindow = getWindow(days)
  const previousWindowEnd = new Date(currentWindow.start)
  previousWindowEnd.setDate(previousWindowEnd.getDate() - 1)
  const previousWindowStart = new Date(previousWindowEnd)
  previousWindowStart.setDate(previousWindowEnd.getDate() - (days - 1))

  const [currentIncidentCount, previousIncidentCount] = await Promise.all([
    prisma.behavioralIncident.count({
      where: {
        tenant_id: tenant.id,
        student_id: studentId,
        incident_date: {
          gte: currentWindow.start,
          lte: currentWindow.end,
        },
      },
    }),
    prisma.behavioralIncident.count({
      where: {
        tenant_id: tenant.id,
        student_id: studentId,
        incident_date: {
          gte: previousWindowStart,
          lte: previousWindowEnd,
        },
      },
    }),
  ])

  const trendChangePct = pctDelta(currentIncidentCount, previousIncidentCount)
  const reductionFromBaselinePct = pctReductionFromBaseline(
    student.baseline_incident_count,
    currentIncidentCount
  )

  const regressionAlert =
    trendChangePct !== null && Number(trendChangePct.toFixed(2)) >= 25

  const recentWindows = await Promise.all([
    prisma.behavioralIncident.count({
      where: {
        tenant_id: tenant.id,
        student_id: studentId,
        incident_date: {
          gte: new Date(previousWindowStart),
          lte: previousWindowEnd,
        },
      },
    }),
    prisma.behavioralIncident.count({
      where: {
        tenant_id: tenant.id,
        student_id: studentId,
        incident_date: {
          gte: currentWindow.start,
          lte: currentWindow.end,
        },
      },
    }),
  ])

  // Scaffolding: plateau if no improvement between previous and current windows.
  const plateauFlag = recentWindows[1] >= recentWindows[0]

  return NextResponse.json({
    data: {
      period,
      current_window: {
        start: currentWindow.start.toISOString(),
        end: currentWindow.end.toISOString(),
        incident_count: currentIncidentCount,
      },
      previous_window: {
        start: previousWindowStart.toISOString(),
        end: previousWindowEnd.toISOString(),
        incident_count: previousIncidentCount,
      },
      baseline: {
        incident_count: student.baseline_incident_count,
        window_start: student.baseline_window_start?.toISOString() ?? null,
        window_end: student.baseline_window_end?.toISOString() ?? null,
      },
      reduction_from_baseline_pct: reductionFromBaselinePct,
      trend_change_pct: trendChangePct,
      regression_alert: regressionAlert,
      plateau_flag: plateauFlag,
    },
  })
}
