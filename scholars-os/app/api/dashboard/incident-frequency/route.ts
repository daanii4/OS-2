import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'

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

function formatDayLabel(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatMonthLabel(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Matches `/api/students/[id]/charts` bucket logic for consistent Wk / Mo / Yr views. */
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
      label: formatMonthLabel(start),
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

  const isOrgView = profile.role === 'owner' || profile.role === 'assistant'

  const studentScopeClauses: Prisma.StudentWhereInput[] = [{ tenant_id: tenant.id }]
  if (!isOrgView) {
    studentScopeClauses.push({ assigned_counselor_id: profile.id })
  }
  const studentScope: Prisma.StudentWhereInput =
    studentScopeClauses.length > 0 ? { AND: studentScopeClauses } : {}

  const buckets = buildBuckets(period)
  const rangeStart = buckets[0].start
  const rangeEnd = buckets[buckets.length - 1].end

  const incidents = await prisma.behavioralIncident.findMany({
    where: {
      student: studentScope,
      incident_date: { gte: rangeStart, lte: rangeEnd },
    },
    select: { incident_date: true },
    orderBy: { incident_date: 'asc' },
  })

  const counts = buckets.map(bucket => {
    let n = 0
    for (const row of incidents) {
      if (row.incident_date >= bucket.start && row.incident_date <= bucket.end) {
        n += 1
      }
    }
    return n
  })

  const chartMax = Math.max(...counts, 1)

  return NextResponse.json({
    data: {
      period,
      labels: buckets.map(b => b.label),
      incidents: counts,
      chartMax,
    },
  })
}
