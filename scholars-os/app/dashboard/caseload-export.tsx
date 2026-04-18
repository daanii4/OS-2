'use client'

import { useMemo, useState } from 'react'

type CaseloadExportProps = {
  schools: string[]
}

export function CaseloadExport({ schools }: CaseloadExportProps) {
  const defaultMonth = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [month, setMonth] = useState(defaultMonth)
  const [school, setSchool] = useState('')

  const href = `/api/exports/caseload?month=${encodeURIComponent(month)}&school=${encodeURIComponent(school)}&format=csv`

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
          Month
        </label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="rounded-lg border border-[var(--border-default)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] transition-all duration-[var(--duration-fast)] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
          School
        </label>
        <select
          value={school}
          onChange={e => setSchool(e.target.value)}
          className="rounded-lg border border-[var(--border-default)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] transition-all duration-[var(--duration-fast)] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All schools</option>
          {schools.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <a
        href={href}
        download
        className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-[var(--duration-fast)] hover:bg-teal-800 hover:shadow-[var(--shadow-primary)] hover:-translate-y-px active:scale-[0.98]"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M8 2v8M5 9l3 3 3-3M3 12h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Export District Report
      </a>
    </div>
  )
}
