import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getTenantFromRequest } from '@/lib/tenant'
import { regressionDeltaPct } from '@/lib/dashboard/regression'

const QuerySchema = z.object({
  q: z.string().max(200).optional(),
  filter: z.enum(['all', 'regression', 'escalated']).default('all'),
})

export async function GET(req: NextRequest) {
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

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    filter: searchParams.get('filter') ?? 'all',
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid params', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { q, filter } = parsed.data
  const query = q?.trim().toLowerCase() ?? ''

  const isOrgView = profile.role === 'owner' || profile.role === 'assistant'

  const studentWhereBase = {
    tenant_id: tenant.id,
    ...(isOrgView ? {} : { assigned_counselor_id: profile.id }),
  }

  const now = new Date()
  const periodStart = new Date(now)
  periodStart.setDate(now.getDate() - 29)

  const nameFilter: Prisma.StudentWhereInput | undefined =
    query.length > 0
      ? {
          OR: [
            { first_name: { contains: query, mode: 'insensitive' as const } },
            { last_name: { contains: query, mode: 'insensitive' as const } },
            { school: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : undefined

  const baseWhere: Prisma.StudentWhereInput = {
    ...studentWhereBase,
    ...(nameFilter ? nameFilter : {}),
  }

  async function countRegressionForWhere(scope: Prisma.StudentWhereInput): Promise<number> {
    const rows = await prisma.student.findMany({
      where: scope,
      select: { id: true, baseline_incident_count: true },
    })
    if (rows.length === 0) return 0
    const ids = rows.map(r => r.id)
    const groups = await prisma.behavioralIncident.groupBy({
      by: ['student_id'],
      where: {
        tenant_id: tenant.id,
        student_id: { in: ids },
        incident_date: { gte: periodStart, lte: now },
      },
      _count: { _all: true },
    })
    const map = new Map<string, number>()
    for (const g of groups) map.set(g.student_id, g._count._all)
    let n = 0
    for (const r of rows) {
      const current = map.get(r.id) ?? 0
      const delta = regressionDeltaPct(r.baseline_incident_count, current)
      if (delta !== null && delta >= 25) n += 1
    }
    return n
  }

  let listWhere: Prisma.StudentWhereInput = { ...baseWhere }
  if (filter === 'escalated') {
    listWhere = { ...baseWhere, escalation_active: true }
  }

  const [totalForFilter, students] = await Promise.all([
    filter === 'regression'
      ? countRegressionForWhere(baseWhere)
      : filter === 'escalated'
        ? prisma.student.count({ where: listWhere })
        : prisma.student.count({ where: baseWhere }),
    filter === 'regression'
      ? prisma.student.findMany({
          where: baseWhere,
          orderBy: { created_at: 'desc' },
          take: 500,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            grade: true,
            school: true,
            status: true,
            baseline_incident_count: true,
            escalation_active: true,
            created_at: true,
          },
        })
      : prisma.student.findMany({
          where: listWhere,
          orderBy: { created_at: 'desc' },
          take: 80,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            grade: true,
            school: true,
            status: true,
            baseline_incident_count: true,
            escalation_active: true,
            created_at: true,
          },
        }),
  ])

  const ids = students.map(s => s.id)
  const incidentGroups =
    ids.length > 0
      ? await prisma.behavioralIncident.groupBy({
          by: ['student_id'],
          where: {
            tenant_id: tenant.id,
            student_id: { in: ids },
            incident_date: { gte: periodStart, lte: now },
          },
          _count: { _all: true },
        })
      : []

  const incidentCountByStudent: Record<string, number> = {}
  for (const g of incidentGroups) {
    incidentCountByStudent[g.student_id] = g._count._all
  }

  let filteredList = students
  if (filter === 'regression') {
    filteredList = students.filter(s => {
      const current = incidentCountByStudent[s.id] ?? 0
      const delta = regressionDeltaPct(s.baseline_incident_count, current)
      return delta !== null && delta >= 25
    })
    filteredList.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  const filteredCount = totalForFilter

  const studentsPayload = filteredList.slice(0, 25).map(s => ({
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    grade: s.grade,
    school: s.school,
    status: s.status,
    baseline_incident_count: s.baseline_incident_count,
    escalation_active: s.escalation_active,
    incidents_30d: incidentCountByStudent[s.id] ?? 0,
  }))

  return NextResponse.json({
    data: {
      filteredCount,
      students: studentsPayload,
    },
  })
}
