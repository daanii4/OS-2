'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IncidentHistoryPanel } from '@/components/incidents/IncidentHistoryPanel'
import { IncidentLogForm } from '@/components/incidents/IncidentLogForm'
import type { Incident, IncidentType, IncidentSeverity } from '@/types/incidents'

type ApiIncident = {
  id: string
  incident_date: Date | string
  incident_type: IncidentType
  severity: IncidentSeverity
  description: string | null
  reported_by: string
  suspension_days: number | null
  logged_by: string
  created_at: Date | string
}

function toViewIncident(row: ApiIncident, studentId: string): Incident {
  const d =
    typeof row.incident_date === 'string'
      ? row.incident_date.slice(0, 10)
      : row.incident_date.toISOString().slice(0, 10)
  const created =
    typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()
  return {
    id: row.id,
    student_id: studentId,
    incident_type: row.incident_type,
    incident_date: d,
    severity: row.severity,
    description: row.description,
    reported_by: row.reported_by,
    suspension_days: row.suspension_days,
    logged_by: row.logged_by,
    created_at: created,
  }
}

type Props = {
  studentId: string
  initialIncidents: ApiIncident[]
  canDeleteIncidents: boolean
}

export function IncidentsTab({ studentId, initialIncidents, canDeleteIncidents }: Props) {
  const router = useRouter()
  const [incidents, setIncidents] = useState<ApiIncident[]>(initialIncidents)
  const [showForm, setShowForm] = useState(false)

  const viewIncidents = useMemo(
    () => incidents.map(i => toViewIncident(i, studentId)),
    [incidents, studentId]
  )

  useEffect(() => {
    setIncidents(initialIncidents)
  }, [initialIncidents])

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/students/${studentId}/incidents`)
    if (!res.ok) return
    const json = (await res.json()) as {
      data: ApiIncident[]
    }
    setIncidents(json.data)
    router.refresh()
  }, [router, studentId])

  function afterSaved() {
    setShowForm(false)
    void refresh()
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-[rgba(92,107,70,0.12)] bg-[#5C6B46] px-4 py-3 font-sans text-[13px] font-semibold text-white transition-colors hover:bg-[#3d4c2c]"
        >
          <span>{showForm ? 'Hide form' : '+ Log Incident'}</span>
          <svg
            viewBox="0 0 16 16"
            className={`h-4 w-4 transition-transform duration-200 ${showForm ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {showForm ? (
          <div className="mt-2">
            <IncidentLogForm studentId={studentId} onSaved={afterSaved} />
          </div>
        ) : null}
      </div>

      <div className="hidden w-full gap-4 md:grid md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <IncidentLogForm studentId={studentId} onSaved={refresh} />
        <IncidentHistoryPanel
          studentId={studentId}
          incidents={viewIncidents}
          onRefresh={refresh}
          canDelete={canDeleteIncidents}
        />
      </div>

      <div className="md:hidden">
        <IncidentHistoryPanel
          studentId={studentId}
          incidents={viewIncidents}
          onRefresh={refresh}
          canDelete={canDeleteIncidents}
        />
      </div>
    </div>
  )
}
