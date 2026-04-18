'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { IncidentRow } from '@/components/incidents/IncidentRow'
import type { Incident, IncidentSeverity } from '@/types/incidents'

type FilterKey = 'all' | IncidentSeverity

interface IncidentHistoryPanelProps {
  studentId: string
  incidents: Incident[]
  onRefresh: () => void
  canDelete: boolean
}

const FILTER_OPTIONS: { key: FilterKey; label: string; dot?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'low', label: 'Low', dot: '#16a34a' },
  { key: 'medium', label: 'Medium', dot: '#b45309' },
  { key: 'high', label: 'High', dot: '#dc2626' },
]

export function IncidentHistoryPanel({
  studentId,
  incidents,
  onRefresh,
  canDelete,
}: IncidentHistoryPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered =
    activeFilter === 'all' ? incidents : incidents.filter(i => i.severity === activeFilter)

  function handleToggle(id: string) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  async function handleDelete(id: string) {
    if (!canDelete) {
      toast.error('Only administrators can delete incident records')
      return
    }
    if (!window.confirm('Delete this incident record? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/students/${studentId}/incidents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = (await res.json()) as { error?: string }
        throw new Error(j.error ?? 'Delete failed')
      }
      toast.success('Incident deleted')
      setExpandedId(null)
      onRefresh()
    } catch {
      toast.error('Failed to delete — try again')
    }
  }

  function handleEdit() {
    toast.info('Edit from the log form above — clear the form and re-enter, or contact support for bulk edits.')
  }

  return (
    <div
      className="
      flex flex-col overflow-hidden rounded-xl border border-[rgba(92,107,70,0.12)] bg-white
    "
    >
      <div
        className="
        flex flex-shrink-0 items-center justify-between border-b border-[rgba(92,107,70,0.08)] px-5 py-4
      "
      >
        <h2 className="font-[family-name:var(--font-dm-serif)] text-[18px] font-normal text-[#1e2517]">
          Incident History
        </h2>
        <span className="font-mono text-[11px] text-[#6e8050]">
          {filtered.length} incident{filtered.length !== 1 ? 's' : ''}
          {activeFilter !== 'all' ? <span className="text-[#8a9e69]"> filtered</span> : null}
        </span>
      </div>

      <div
        className="
        flex flex-shrink-0 flex-wrap items-center gap-1.5 border-b border-[rgba(92,107,70,0.06)] px-5 py-2.5
      "
      >
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              setActiveFilter(opt.key)
              setExpandedId(null)
            }}
            aria-pressed={activeFilter === opt.key}
            className={`
              inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5
              font-sans text-[11px] font-medium transition-all duration-[150ms]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-offset-1
              ${
                activeFilter === opt.key
                  ? 'border-[#5C6B46] bg-[#5C6B46] text-white'
                  : 'border-[rgba(92,107,70,0.18)] bg-transparent text-[#5C6B46] hover:border-[#8a9e69] hover:bg-[#f3f7e8]'
              }
            `}
          >
            {opt.dot ? (
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{
                  background: activeFilter === opt.key ? 'rgba(255,255,255,0.7)' : opt.dot,
                }}
                aria-hidden="true"
              />
            ) : null}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="max-h-[600px] flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div
              className="
              mb-4 flex h-12 w-12 items-center justify-center rounded-[0_0_9999px_0] bg-[#f3f7e8]
            "
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="#8a9e69"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3M8 10v1" />
              </svg>
            </div>
            <p className="mb-1 font-[family-name:var(--font-dm-serif)] text-[16px] font-normal text-[#1e2517]">
              No incidents recorded
            </p>
            <p className="font-sans text-[12px] text-[#6e8050]">
              {activeFilter !== 'all'
                ? `No ${activeFilter} severity incidents on record`
                : 'A clean record is worth celebrating.'}
            </p>
          </div>
        ) : (
          filtered.map(incident => (
            <IncidentRow
              key={incident.id}
              incident={incident}
              isExpanded={expandedId === incident.id}
              onToggle={() => handleToggle(incident.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showDelete={canDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
