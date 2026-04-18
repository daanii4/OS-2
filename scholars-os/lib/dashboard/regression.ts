import type { Prisma } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'

/** Worsening vs baseline; matches caseload filter (≥ 25%). */
export function regressionDeltaPct(
  baseline: number | null,
  currentIncidents: number
): number | null {
  if (baseline === null || baseline <= 0) return null
  const reduction = Number((((baseline - currentIncidents) / baseline) * 100).toFixed(0))
  return -reduction
}

/**
 * Counts students in scope whose 30d incident trend vs baseline qualifies as regression (delta ≥ 25).
 */
export async function countRegressionStudents(
  prisma: PrismaClient,
  params: {
    tenantId: string
    studentWhere: Prisma.StudentWhereInput
    periodStart: Date
    now: Date
  }
): Promise<number> {
  const { tenantId, studentWhere, periodStart, now } = params

  const candidates = await prisma.student.findMany({
    where: studentWhere,
    select: { id: true, baseline_incident_count: true },
  })
  if (candidates.length === 0) return 0

  const ids = candidates.map(c => c.id)
  const groups = await prisma.behavioralIncident.groupBy({
    by: ['student_id'],
    where: {
      tenant_id: tenantId,
      student_id: { in: ids },
      incident_date: { gte: periodStart, lte: now },
    },
    _count: { _all: true },
  })

  const countMap = new Map<string, number>()
  for (const g of groups) {
    countMap.set(g.student_id, g._count._all)
  }

  let n = 0
  for (const c of candidates) {
    const current = countMap.get(c.id) ?? 0
    const delta = regressionDeltaPct(c.baseline_incident_count, current)
    if (delta !== null && delta >= 25) n += 1
  }
  return n
}
