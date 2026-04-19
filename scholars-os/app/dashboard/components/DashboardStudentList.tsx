import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { StudentListIsland } from './StudentListIsland'

type Props = {
  studentScope: Prisma.StudentWhereInput
  studentScopeClauses: Prisma.StudentWhereInput[]
  caseloadTotalCount: number
  periodStart: Date
  now: Date
}

export async function DashboardStudentList({
  studentScope,
  studentScopeClauses,
  caseloadTotalCount,
  periodStart,
  now,
}: Props) {
  const scopeFilter = studentScopeClauses.length > 0 ? { student: studentScope } : {}

  const [recentStudents, incidentCountRows] = await Promise.all([
    prisma.student.findMany({
      where: studentScope,
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        grade: true,
        school: true,
        status: true,
        baseline_incident_count: true,
        escalation_active: true,
      },
    }),
    prisma.behavioralIncident.groupBy({
      by: ['student_id'],
      where: {
        ...scopeFilter,
        incident_date: { gte: periodStart, lte: now },
      },
      _count: { _all: true },
    }),
  ])

  const incidentCountByStudent = incidentCountRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.student_id] = row._count._all
    return acc
  }, {})

  return (
    <StudentListIsland
      initialStudents={recentStudents}
      initialFilteredCount={caseloadTotalCount}
      caseloadTotalCount={caseloadTotalCount}
      incidentCountByStudent={incidentCountByStudent}
    />
  )
}
