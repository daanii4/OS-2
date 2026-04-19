import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  DashboardStudentListIsland,
  type DashboardStudentRow,
} from './dashboard-student-list-island'

type Props = {
  studentScope: Prisma.StudentWhereInput
  studentScopeClauses: Prisma.StudentWhereInput[]
  caseloadTotalCount: number
  periodStart: Date
  now: Date
  variant?: 'desktop' | 'mobile'
}

export async function DashboardStudentList({
  studentScope,
  studentScopeClauses,
  caseloadTotalCount,
  periodStart,
  now,
  variant = 'desktop',
}: Props) {
  const incidentScope =
    studentScopeClauses.length > 0 ? { student: studentScope } : {}

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
        ...incidentScope,
        incident_date: { gte: periodStart, lte: now },
      },
      _count: { _all: true },
    }),
  ])

  const incidentCountByStudent = incidentCountRows.reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.student_id] = row._count._all
      return acc
    },
    {}
  )

  const initialStudents: DashboardStudentRow[] = recentStudents.map(s => ({
    ...s,
  }))

  return (
    <DashboardStudentListIsland
      initialStudents={initialStudents}
      initialFilteredCount={caseloadTotalCount}
      caseloadTotalCount={caseloadTotalCount}
      incidentCountByStudent={incidentCountByStudent}
      variant={variant}
    />
  )
}
