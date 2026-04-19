import { prisma } from '@/lib/prisma'
import { IncidentsTab } from '@/components/incidents/IncidentsTab'
import type { IncidentType, Severity } from '@prisma/client'

const incidentListSelect = {
  id: true,
  incident_date: true,
  incident_type: true,
  severity: true,
  suspension_days: true,
  reported_by: true,
  description: true,
  logged_by: true,
  created_at: true,
} as const

type Props = {
  studentId: string
  tenantId: string
  canDeleteIncidents: boolean
}

export async function IncidentsTabWrapper({ studentId, tenantId, canDeleteIncidents }: Props) {
  const studentScope = { student_id: studentId, tenant_id: tenantId }
  const incidents = await prisma.behavioralIncident.findMany({
    where: studentScope,
    orderBy: { incident_date: 'desc' },
    select: incidentListSelect,
  })

  type IncidentRow = {
    id: string
    incident_date: Date
    incident_type: IncidentType
    severity: Severity
    suspension_days: number | null
    reported_by: string
    description: string | null
    logged_by: string
    created_at: Date
  }

  return (
    <IncidentsTab
      studentId={studentId}
      initialIncidents={incidents as IncidentRow[]}
      canDeleteIncidents={canDeleteIncidents}
    />
  )
}
