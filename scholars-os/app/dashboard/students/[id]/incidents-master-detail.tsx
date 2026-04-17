'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AddIncidentForm } from './add-incident-form'

type IncidentItem = {
  id: string
  incident_date: Date | string
  incident_type: string
  severity: 'low' | 'medium' | 'high'
  suspension_days: number | null
  reported_by: string
  description: string
  created_at: Date | string
}

type IncidentsMasterDetailProps = {
  studentId: string
  incidents: IncidentItem[]
}

const HIDDEN_FIELDS = new Set([
  'incident_type',
  'severity',
  'incident_date',
  'reported_by',
  'description',
  'suspension_days',
])

function toLabel(input: string): string {
  return input
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function toIncidentTypeLabel(incidentType: string): string {
  return incidentType.replace(/_/g, ' ')
}

function toSeverityClass(severity: IncidentItem['severity']): string {
  if (severity === 'high') {
    return 'border border-red-200 bg-red-50 text-[var(--color-error)]'
  }
  if (severity === 'medium') {
    return 'border border-amber-200 bg-amber-50 text-[var(--color-regression)]'
  }
  return 'border border-emerald-200 bg-emerald-50 text-[var(--color-success)]'
}

function toDisplayValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—'

  if (typeof value === 'string') {
    if (key.endsWith('_date') || key.endsWith('_at')) {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString()
      }
    }
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function IncidentsMasterDetail({ studentId, incidents }: IncidentsMasterDetailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null)
  const [desktopContainerHeight, setDesktopContainerHeight] = useState<number | null>(null)

  const measureContainerHeight = useCallback(() => {
    if (typeof window === 'undefined' || !containerRef.current) return
    const isDesktop = window.innerWidth >= 768
    if (!isDesktop) {
      setDesktopContainerHeight(null)
      return
    }
    const containerTop = containerRef.current.getBoundingClientRect().top
    const nextHeight = Math.max(360, Math.floor(window.innerHeight - containerTop - 16))
    setDesktopContainerHeight(nextHeight)
  }, [])

  useEffect(() => {
    measureContainerHeight()
    window.addEventListener('resize', measureContainerHeight)
    window.addEventListener('scroll', measureContainerHeight, { passive: true })
    return () => {
      window.removeEventListener('resize', measureContainerHeight)
      window.removeEventListener('scroll', measureContainerHeight)
    }
  }, [measureContainerHeight])

  useEffect(() => {
    if (!selectedIncident) return

    const activeBeforeOpen = document.activeElement as HTMLElement | null
    modalRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedIncident(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      activeBeforeOpen?.focus?.()
    }
  }, [selectedIncident])

  const additionalEntries = useMemo(() => {
    if (!selectedIncident) return []
    return Object.entries(selectedIncident).filter(([key, value]) => {
      if (HIDDEN_FIELDS.has(key)) return false
      return value !== null && value !== undefined
    })
  }, [selectedIncident])

  return (
    <>
      <div
        ref={containerRef}
        className="grid gap-4 md:grid-cols-2 md:overflow-hidden"
        style={desktopContainerHeight ? { height: `${desktopContainerHeight}px` } : undefined}
      >
        <div className="md:sticky md:top-0 md:h-full md:overflow-y-auto md:[-webkit-overflow-scrolling:touch]">
          <AddIncidentForm studentId={studentId} />
        </div>

        <div className="os-card md:h-full md:overflow-y-auto md:[-webkit-overflow-scrolling:touch]">
          <h3 className="os-heading mb-3">Incident history</h3>
          {incidents.length === 0 ? (
            <p className="os-body">No incidents logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {incidents.map(incident => (
                <li key={incident.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedIncident(incident)}
                    className="w-full cursor-pointer rounded-md border border-transparent bg-[var(--surface-inner)] p-3 text-left transition-colors hover:bg-[var(--surface-page)] hover:border-[var(--border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(20_184_166_/_0.35)]"
                  >
                    <p className="os-subhead capitalize">
                      {toIncidentTypeLabel(incident.incident_type)} ·{' '}
                      <span
                        className={
                          incident.severity === 'high'
                            ? 'text-[var(--color-error)]'
                            : incident.severity === 'medium'
                              ? 'text-[var(--color-regression)]'
                              : 'text-[var(--color-success)]'
                        }
                      >
                        {incident.severity}
                      </span>
                    </p>
                    <p className="os-caption">
                      <span className="os-data-sm">
                        {new Date(incident.incident_date).toLocaleDateString()}
                      </span>{' '}
                      · {incident.reported_by}
                    </p>
                    {incident.suspension_days !== null && (
                      <p className="os-caption">
                        Suspension: <span className="os-data-sm">{incident.suspension_days}d</span>
                      </p>
                    )}
                    <p className="os-body mt-1">{incident.description}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedIncident && (
        <div
          className="fixed inset-0 z-[90] flex items-end bg-black/50 p-4 md:items-center md:justify-center"
          onClick={event => {
            if (event.target === event.currentTarget) {
              setSelectedIncident(null)
            }
          }}
          aria-hidden="true"
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-modal-title"
            className="w-full max-h-[85vh] overflow-y-auto rounded-t-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-lg)] md:w-[min(512px,calc(100%-32px))] md:rounded-lg md:[-webkit-overflow-scrolling:touch]"
          >
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-[var(--border-default)] md:hidden" />

            <div className="p-4 md:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 id="incident-modal-title" className="os-heading capitalize">
                    {toIncidentTypeLabel(selectedIncident.incident_type)}
                  </h3>
                  <p className="os-caption mt-1">
                    {new Date(selectedIncident.incident_date).toLocaleDateString()} ·{' '}
                    {selectedIncident.reported_by}
                  </p>
                </div>
                <button
                  type="button"
                  className="os-btn-icon text-[var(--text-tertiary)]"
                  onClick={() => setSelectedIncident(null)}
                  aria-label="Close incident details"
                >
                  <span aria-hidden>×</span>
                </button>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${toSeverityClass(selectedIncident.severity)}`}
                >
                  {selectedIncident.severity}
                </span>
                {selectedIncident.suspension_days !== null && (
                  <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-inner)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                    Suspension: {selectedIncident.suspension_days}d
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="os-label">Incident description</p>
                  <p className="os-body mt-1 whitespace-pre-wrap">{selectedIncident.description}</p>
                </div>

                <div>
                  <p className="os-label">Reported by</p>
                  <p className="os-body mt-1">{selectedIncident.reported_by}</p>
                </div>

                <div>
                  <p className="os-label">Incident date</p>
                  <p className="os-body mt-1">
                    {new Date(selectedIncident.incident_date).toLocaleDateString()}
                  </p>
                </div>

                {selectedIncident.suspension_days !== null && (
                  <div>
                    <p className="os-label">Suspension duration</p>
                    <p className="os-body mt-1">{selectedIncident.suspension_days} day(s)</p>
                  </div>
                )}

                {additionalEntries.map(([key, value]) => (
                  <div key={key}>
                    <p className="os-label">{toLabel(key)}</p>
                    <p className="os-body mt-1 whitespace-pre-wrap">{toDisplayValue(key, value)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  className="os-btn-secondary"
                  onClick={() => setSelectedIncident(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
