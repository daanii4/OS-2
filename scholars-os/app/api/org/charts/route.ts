import { IncidentType } from '@prisma/client'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

type Period = 'week' | 'month' | 'year'
type Bucket = {
  label: string
  start: Date
  end: Date
}

function parsePeriod(value: string | null): Period {
  if (value === 'week' || value === 'month' || value === 'year') return value
  return 'month'
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function buildBuckets(period: Period): Bucket[] {
  const now = new Date()

  if (period === 'year') {
    const buckets: Bucket[] = []
    for (let i = 11; i >= 0; i -= 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)
      buckets.push({
        label: formatMonth(monthStart),
        start: monthStart,
        end: monthEnd,
      })
    }
    return buckets
  }

  const days = period === 'week' ? 7 : 30
  const buckets: Bucket[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    const start = startOfDay(day)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)
    buckets.push({
      label: formatDay(start),
      start,
      end,
    })
  }
  return buckets
}

export async function GET(req: Request) {
  const period = parsePeriod(new URL(req.url).searchParams.get('period'))

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

  const buckets = buildBuckets(period)
  const start = buckets[0].start
  const end = buckets[buckets.length - 1].end

  const [incidents, sessions] = await Promise.all([
    prisma.behavioralIncident.findMany({
      where: {
        incident_date: { gte: start, lte: end },
      },
      select: {
        incident_date: true,
        incident_type: true,
      },
      orderBy: { incident_date: 'asc' },
    }),
    prisma.session.findMany({
      where: {
        session_date: { gte: start, lte: end },
        goal_completion_rate: { not: null },
      },
      select: {
        session_date: true,
        goal_completion_rate: true,
      },
      orderBy: { session_date: 'asc' },
    }),
  ])

  const rows = buckets.map(bucket => {
    const incidentTypes: Record<IncidentType, number> = {
      office_referral: 0,
      suspension_iss: 0,
      suspension_oss: 0,
      teacher_referral: 0,
      behavioral_incident: 0,
      other: 0,
    }
    let incidentCount = 0
    let goalTotal = 0
    let goalCount = 0

    for (const incident of incidents) {
      if (incident.incident_date >= bucket.start && incident.incident_date <= bucket.end) {
        incidentCount += 1
        incidentTypes[incident.incident_type] += 1
      }
    }

    for (const session of sessions) {
      if (session.session_date >= bucket.start && session.session_date <= bucket.end) {
        goalTotal += session.goal_completion_rate ?? 0
        goalCount += 1
      }
    }

    return {
      label: bucket.label,
      incident_count: incidentCount,
      office_referral: incidentTypes.office_referral,
      suspension_iss: incidentTypes.suspension_iss,
      suspension_oss: incidentTypes.suspension_oss,
      teacher_referral: incidentTypes.teacher_referral,
      behavioral_incident: incidentTypes.behavioral_incident,
      other: incidentTypes.other,
      avg_goal_completion_rate:
        goalCount > 0 ? Number((goalTotal / goalCount).toFixed(2)) : null,
      sessions_with_goal_rate: goalCount,
    }
  })

  return NextResponse.json({
    data: {
      period,
      buckets: rows,
      incident_frequency: rows.map(row => ({
        label: row.label,
        incident_count: row.incident_count,
      })),
      incident_type_breakdown: rows.map(row => ({
        label: row.label,
        office_referral: row.office_referral,
        suspension_iss: row.suspension_iss,
        suspension_oss: row.suspension_oss,
        teacher_referral: row.teacher_referral,
        behavioral_incident: row.behavioral_incident,
        other: row.other,
      })),
      goal_completion: rows.map(row => ({
        label: row.label,
        avg_goal_completion_rate: row.avg_goal_completion_rate,
        sessions_with_goal_rate: row.sessions_with_goal_rate,
      })),
    },
  })
}
