'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type CaseloadExportProps = {
  schools: string[]
}

type PreviewData = { sessions: number; students: number }

export function CaseloadExport({ schools }: CaseloadExportProps) {
  const defaultMonth = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [month, setMonth] = useState(defaultMonth)
  const [school, setSchool] = useState('')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const exportUrl = `/api/exports/caseload?month=${encodeURIComponent(month)}&school=${encodeURIComponent(school)}`
  const canExport = school.length > 0

  useEffect(() => {
    if (!school) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPreviewLoading(true)
      const q = new URLSearchParams({ month, school })
      fetch(`/api/exports/caseload/preview?${q.toString()}`)
        .then(res => {
          if (!res.ok) throw new Error('preview failed')
          return res.json() as Promise<{ data: PreviewData }>
        })
        .then(json => setPreview(json.data))
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false))
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [month, school])

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
            Month
          </label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="rounded-lg border border-[var(--border-default)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] transition-all duration-[var(--duration-fast)] focus:border-[var(--olive-600)] focus:outline-none focus:ring-2 focus:ring-[var(--olive-600)]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
            School <span className="text-[var(--color-error)]">*</span>
          </label>
          <select
            value={school}
            onChange={e => {
              const v = e.target.value
              setSchool(v)
              if (!v) setPreview(null)
            }}
            required
            className="min-w-[200px] rounded-lg border border-[var(--border-default)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] transition-all duration-[var(--duration-fast)] focus:border-[var(--olive-600)] focus:outline-none focus:ring-2 focus:ring-[var(--olive-600)]/20"
          >
            <option value="">Select a school</option>
            {schools.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <a
          href={canExport ? exportUrl : undefined}
          download
          onClick={e => {
            if (!canExport) e.preventDefault()
          }}
          aria-disabled={!canExport}
          className={
            canExport
              ? 'inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[var(--olive-600)] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-[var(--duration-fast)] hover:bg-[var(--olive-700)] hover:shadow-[var(--shadow-primary)] hover:-translate-y-px active:scale-[0.98]'
              : 'pointer-events-none inline-flex min-w-[140px] cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[var(--olive-600)] px-4 py-2.5 text-sm font-semibold text-white opacity-40'
          }
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M8 2v8M5 9l3 3 3-3M3 12h10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export PDF
        </a>
      </div>
      {school ? (
        <p className="text-sm text-[var(--text-tertiary)]">
          {previewLoading
            ? 'Loading preview…'
            : preview
              ? `${preview.sessions} sessions · ${preview.students} students`
              : ''}
        </p>
      ) : null}
    </div>
  )
}
