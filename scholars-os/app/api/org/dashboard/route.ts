import { NextResponse } from 'next/server'
import { StudentStatus } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

type Period = 'week' | 'month' | 'year'

function parsePeriod(value: string | null): Period {
  if (value === 'week' || value === 'month' || value === 'year') return value
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

export async function GET(req: Request) {
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
  if (!profile || !profile.active || profile.role === 'counselor') {
    return NextResponse.json(
      { error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  const currentWindow = getWindow(days)
  const previousWindowEnd = new Date(currentWindow.start)
  previousWindowEnd.setDate(previousWindowEnd.getDate() - 1)
  const previousWindowStart = new Date(previousWindowEnd)
  previousWindowStart.setDate(previousWindowEnd.getDate() - (days - 1))

  const [
    activeStudents,
    currentIncidents,
    previousIncidents,
    currentSessions,
    currentNoShows,
    recentGoalRates,
    studentsByStatus,
  ] = await Promise.all([
    prisma.student.count({ where: { status: StudentStatus.active } }),
    prisma.behavioralIncident.count({
      where: {
        incident_date: {
          gte: currentWindow.start,
          lte: currentWindow.end,
        },
      },
    }),
    prisma.behavioralIncident.count({
      where: {
        incident_date: {
          gte: previousWindowStart,
          lte: previousWindowEnd,
        },
      },
    }),
    prisma.session.count({
      where: {
        session_date: {
          gte: currentWindow.start,
          lte: currentWindow.end,
        },
      },
    }),
    prisma.session.count({
      where: {
        session_date: {
          gte: currentWindow.start,
          lte: currentWindow.end,
        },
        attendance_status: 'no_show',
      },
    }),
    prisma.session.findMany({
      where: {
        session_date: {
          gte: currentWindow.start,
          lte: currentWindow.end,
        },
        goal_completion_rate: { not: null },
      },
      select: { goal_completion_rate: true },
    }),
    prisma.student.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ])

  const avgGoalCompletion =
    recentGoalRates.length > 0
      ? Number(
          (
            recentGoalRates.reduce(
              (sum, row) => sum + (row.goal_completion_rate ?? 0),
              0
            ) / recentGoalRates.length
          ).toFixed(2)
        )
      : null

  const incidentTrendPct = pctDelta(currentIncidents, previousIncidents)

  return NextResponse.json({
    data: {
      period,
      current_window: {
        start: currentWindow.start.toISOString(),
        end: currentWindow.end.toISOString(),
      },
      kpis: {
        active_students: activeStudents,
        incidents_current_period: currentIncidents,
        incidents_previous_period: previousIncidents,
        incident_trend_pct: incidentTrendPct,
        sessions_current_period: currentSessions,
        no_shows_current_period: currentNoShows,
        avg_goal_completion_rate_current_period: avgGoalCompletion,
      },
      students_by_status: studentsByStatus.map(row => ({
        status: row.status,
        count: row._count.status,
      })),
    },
  })
}
