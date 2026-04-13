import { IncidentType } from '@prisma/client'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

type RouteContext = {
  params: Promise<{ id: string }>
}

type Period = 'week' | 'month' | 'year'
type Bucket = {
  key: string
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

function formatDayLabel(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatMonthLabel(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function buildBuckets(period: Period): Bucket[] {
  const now = new Date()

  if (period === 'week') {
    const buckets: Bucket[] = []
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      const start = startOfDay(day)
      const end = new Date(start)
      end.setHours(23, 59, 59, 999)
      buckets.push({
        key: formatDayLabel(start),
        label: formatDayLabel(start),
        start,
        end,
      })
    }
    return buckets
  }

  if (period === 'month') {
    const buckets: Bucket[] = []
    for (let i = 29; i >= 0; i -= 1) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      const start = startOfDay(day)
      const end = new Date(start)
      end.setHours(23, 59, 59, 999)
      buckets.push({
        key: formatDayLabel(start),
        label: formatDayLabel(start),
        start,
        end,
      })
    }
    return buckets
  }

  const buckets: Bucket[] = []
  for (let i = 11; i >= 0; i -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(monthDate)
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    buckets.push({
      key: formatMonthLabel(start),
      label: formatMonthLabel(start),
      start,
      end,
    })
  }
  return buckets
}

export async function GET(req: Request, ctx: RouteContext) {
  const { id: studentId } = await ctx.params
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

  const buckets = buildBuckets(period)
  const firstBucketStart = buckets[0].start
  const lastBucketEnd = buckets[buckets.length - 1].end

  const [incidents, sessions] = await Promise.all([
    prisma.behavioralIncident.findMany({
      where: {
        tenant_id: tenant.id,
        student_id: studentId,
        incident_date: {
          gte: firstBucketStart,
          lte: lastBucketEnd,
        },
      },
      select: {
        incident_date: true,
        incident_type: true,
        suspension_days: true,
      },
      orderBy: { incident_date: 'asc' },
    }),
    prisma.session.findMany({
      where: {
        tenant_id: tenant.id,
        student_id: studentId,
        session_date: {
          gte: firstBucketStart,
          lte: lastBucketEnd,
        },
      },
      select: {
        session_date: true,
        goal_completion_rate: true,
      },
      orderBy: { session_date: 'asc' },
    }),
  ])

  const chartRows = buckets.map(bucket => {
    const typeCounts: Record<IncidentType, number> = {
      office_referral: 0,
      suspension_iss: 0,
      suspension_oss: 0,
      teacher_referral: 0,
      behavioral_incident: 0,
      other: 0,
    }
    let incidentCount = 0
    let suspensionDays = 0
    let goalRateTotal = 0
    let goalRateCount = 0

    for (const incident of incidents) {
      if (incident.incident_date >= bucket.start && incident.incident_date <= bucket.end) {
        incidentCount += 1
        typeCounts[incident.incident_type] += 1
        suspensionDays += incident.suspension_days ?? 0
      }
    }

    for (const session of sessions) {
      if (
        session.session_date >= bucket.start &&
        session.session_date <= bucket.end &&
        session.goal_completion_rate !== null
      ) {
        goalRateTotal += session.goal_completion_rate
        goalRateCount += 1
      }
    }

    return {
      label: bucket.label,
      start: bucket.start.toISOString(),
      end: bucket.end.toISOString(),
      incident_count: incidentCount,
      office_referral: typeCounts.office_referral,
      suspension_iss: typeCounts.suspension_iss,
      suspension_oss: typeCounts.suspension_oss,
      teacher_referral: typeCounts.teacher_referral,
      behavioral_incident: typeCounts.behavioral_incident,
      other: typeCounts.other,
      suspension_days: Number(suspensionDays.toFixed(2)),
      avg_goal_completion_rate:
        goalRateCount > 0
          ? Number((goalRateTotal / goalRateCount).toFixed(2))
          : null,
      sessions_with_goal_rate: goalRateCount,
    }
  })

  return NextResponse.json({
    data: {
      period,
      buckets: chartRows,
      incident_frequency: chartRows.map(row => ({
        label: row.label,
        incident_count: row.incident_count,
      })),
      incident_type_breakdown: chartRows.map(row => ({
        label: row.label,
        office_referral: row.office_referral,
        suspension_iss: row.suspension_iss,
        suspension_oss: row.suspension_oss,
        teacher_referral: row.teacher_referral,
        behavioral_incident: row.behavioral_incident,
        other: row.other,
      })),
      goal_completion: chartRows.map(row => ({
        label: row.label,
        avg_goal_completion_rate: row.avg_goal_completion_rate,
        sessions_with_goal_rate: row.sessions_with_goal_rate,
      })),
      suspension_days: chartRows.map(row => ({
        label: row.label,
        suspension_days: row.suspension_days,
      })),
    },
  })
}
