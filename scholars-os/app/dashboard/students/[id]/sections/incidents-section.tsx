import { prisma } from '@/lib/prisma'
import { IncidentsTab } from '@/components/incidents/IncidentsTab'

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
  canDelete: boolean
}

export async function IncidentsSection({
  studentId,
  tenantId,
  canDelete,
}: Props) {
  const incidents = await prisma.behavioralIncident.findMany({
    where: { student_id: studentId, tenant_id: tenantId },
    orderBy: { incident_date: 'desc' },
    select: incidentListSelect,
  })

  return (
    <IncidentsTab
      studentId={studentId}
      initialIncidents={incidents}
      canDeleteIncidents={canDelete}
    />
  )
}

export function IncidentsSectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="os-card animate-pulse h-32" aria-hidden />
      <div className="os-card animate-pulse h-48" aria-hidden />
    </div>
  )
}
