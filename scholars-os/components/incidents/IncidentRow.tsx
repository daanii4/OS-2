'use client'

import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Incident } from '@/types/incidents'
import { INCIDENT_TYPE_LABELS, SEVERITY_CONFIG } from '@/types/incidents'

interface IncidentRowProps {
  incident: Incident
  isExpanded: boolean
  onToggle: () => void
  onEdit: (incident: Incident) => void
  onDelete: (id: string) => void
  showDelete?: boolean
}

export function IncidentRow({
  incident,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  showDelete = true,
}: IncidentRowProps) {
  const sevConfig = SEVERITY_CONFIG[incident.severity]
  const isSuspension =
    incident.incident_type === 'suspension_iss' || incident.incident_type === 'suspension_oss'

  const dateStr =
    typeof incident.incident_date === 'string' && incident.incident_date.includes('T')
      ? incident.incident_date.slice(0, 10)
      : incident.incident_date.slice(0, 10)

  const formattedDate = format(new Date(`${dateStr}T12:00:00`), 'MM/dd/yyyy')

  const descPreview =
    incident.description && incident.description !== '—' && incident.description !== 'No description provided.'
      ? incident.description
      : null

  return (
    <div
      className={`
        border-b border-[rgba(92,107,70,0.07)] last:border-b-0
        transition-colors duration-[150ms]
        ${isExpanded ? 'bg-[#f3f7e8]' : 'hover:bg-[#f3f7e8]'}
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="
          flex w-full items-start gap-2.5 px-5 py-3 text-left
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-inset
        "
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="font-sans text-[13px] font-semibold text-[#1e2517]">
              {INCIDENT_TYPE_LABELS[incident.incident_type]}
            </span>
            <span
              className="
                inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-px
                font-sans text-[9px] font-semibold uppercase tracking-[0.04em]
              "
              style={{
                background: sevConfig.badgeBg,
                borderColor: sevConfig.badgeBorder,
                color: sevConfig.badgeText,
              }}
            >
              <span
                className="h-1 w-1 flex-shrink-0 rounded-full"
                style={{ background: sevConfig.dotColor }}
                aria-hidden="true"
              />
              {sevConfig.label}
            </span>
            {isSuspension && incident.suspension_days !== null && incident.suspension_days !== undefined ? (
              <span
                className="
                inline-flex items-center rounded-[3px] border border-[rgba(214,160,51,0.25)] bg-[#fdf8ec]
                px-1.5 py-px font-mono text-[10px] text-[#7a5a10]
              "
              >
                {incident.suspension_days}d suspension
              </span>
            ) : null}
          </div>

          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[#5C6B46]">{formattedDate}</span>
            <span className="text-[rgba(92,107,70,0.3)]" aria-hidden="true">
              ·
            </span>
            <span className="font-sans text-[11px] text-[#6e8050]">{incident.reported_by}</span>
          </div>

          {descPreview ? (
            <p
              className="
              max-w-[500px] overflow-hidden text-ellipsis whitespace-nowrap
              font-sans text-[12px] leading-relaxed text-[#3d4c2c]
            "
            >
              {descPreview}
            </p>
          ) : null}
        </div>

        <ChevronRight
          size={16}
          className={`
            mt-0.5 flex-shrink-0 text-[#8a9e69]
            transition-transform duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isExpanded ? 'rotate-90' : ''}
          `}
          aria-hidden="true"
        />
      </button>

      {isExpanded ? (
        <div className="px-5 pb-4 pl-[52px]">
          <div
            className="
            grid grid-cols-2 gap-3 rounded-[8px] bg-[#eef0e8] p-3.5
          "
          >
            <DetailField label="Incident Type">{INCIDENT_TYPE_LABELS[incident.incident_type]}</DetailField>
            <DetailField label="Date">
              <span className="font-mono text-[12px]">{formattedDate}</span>
            </DetailField>
            <DetailField label="Severity">
              <span
                className="
                  inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-px
                  font-sans text-[9px] font-semibold uppercase tracking-[0.04em]
                "
                style={{
                  background: sevConfig.badgeBg,
                  borderColor: sevConfig.badgeBorder,
                  color: sevConfig.badgeText,
                }}
              >
                {sevConfig.label}
              </span>
            </DetailField>
            <DetailField label="Reported By">{incident.reported_by}</DetailField>
            {isSuspension && incident.suspension_days !== null && incident.suspension_days !== undefined ? (
              <DetailField label="Suspension Duration">
                <span className="font-mono text-[12px]">
                  {incident.suspension_days}{' '}
                  {incident.suspension_days === 0.5
                    ? 'half day'
                    : `day${incident.suspension_days !== 1 ? 's' : ''}`}
                </span>
              </DetailField>
            ) : null}
            {descPreview ? (
              <DetailField label="Full Description" fullWidth>
                {incident.description}
              </DetailField>
            ) : null}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onEdit(incident)
              }}
              className="
                inline-flex h-[30px] items-center gap-1.5 rounded-[6px] border border-[#c8d6aa] bg-[#f3f7e8] px-3
                font-sans text-[11px] font-medium text-[#3d4c2c]
                transition-all duration-[150ms] hover:border-[#8a9e69] hover:bg-[#e4eccc]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-offset-1
                active:scale-[0.98]
              "
            >
              <Pencil size={11} aria-hidden="true" />
              Edit
            </button>
            {showDelete ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onDelete(incident.id)
                }}
                className="
                inline-flex h-[30px] items-center gap-1.5 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3
                font-sans text-[11px] font-medium text-[#dc2626]
                transition-all duration-[150ms] hover:border-[#fca5a5] hover:bg-[#fee2e2]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:ring-offset-1
                active:scale-[0.98]
              "
              >
                <Trash2 size={11} aria-hidden="true" />
                Delete
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DetailField({
  label,
  fullWidth = false,
  children,
}: {
  label: string
  fullWidth?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-[#6e8050]">
        {label}
      </p>
      <p className="font-sans text-[12px] leading-relaxed text-[#2d3820]">{children}</p>
    </div>
  )
}
