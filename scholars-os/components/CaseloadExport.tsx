'use client'

import { useEffect, useState } from 'react'
import { Download, FileX, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CaseloadExportProps {
  schools: string[]
  className?: string
}

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; sessions: number; students: number }
  | { status: 'empty' }
  | { status: 'error' }

export function CaseloadExport({ schools, className }: CaseloadExportProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' })
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!selectedMonth || !selectedSchool) {
      setPreview({ status: 'idle' })
      return
    }

    setPreview({ status: 'loading' })
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          month: selectedMonth,
          school: selectedSchool,
        })
        const res = await fetch(`/api/exports/caseload/preview?${params}`)
        if (!res.ok) throw new Error('Preview failed')
        const json = (await res.json()) as { data?: { sessions: number; students: number } }
        const data = json.data
        if (!data) throw new Error('Preview failed')
        if (data.sessions === 0) {
          setPreview({ status: 'empty' })
        } else {
          setPreview({
            status: 'loaded',
            sessions: data.sessions,
            students: data.students,
          })
        }
      } catch {
        setPreview({ status: 'error' })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [selectedMonth, selectedSchool])

  const handleExport = async () => {
    if (!selectedSchool || !selectedMonth) return
    setIsExporting(true)
    try {
      const params = new URLSearchParams({
        month: selectedMonth,
        school: selectedSchool,
      })
      const res = await fetch(`/api/exports/caseload?${params}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = selectedSchool.replace(/\s+/g, '-')
      a.download = `Scholars-OS_${safeName}_${selectedMonth}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Caseload report downloaded')
    } catch {
      toast.error('Export failed — please try again')
    } finally {
      setIsExporting(false)
    }
  }

  const canExport =
    !!selectedSchool &&
    !!selectedMonth &&
    preview.status === 'loaded' &&
    !isExporting

  const isDisabled =
    !selectedSchool ||
    !selectedMonth ||
    isExporting ||
    preview.status === 'empty' ||
    preview.status === 'loading' ||
    preview.status === 'idle' ||
    preview.status === 'error'

  return (
    <div className={cn('flex min-w-0 max-w-full flex-col gap-4', className)}>
      <div className="flex min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label
            htmlFor="export-month"
            className="font-sans text-xs font-medium uppercase tracking-wide text-slate-600"
          >
            Month
          </label>
          <input
            id="export-month"
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className={cn(
              'h-9 w-full rounded-md border border-slate-200 bg-white px-3',
              'font-mono text-sm text-slate-900',
              'focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-600 focus:ring-offset-0',
              'transition-shadow duration-150'
            )}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label
            htmlFor="export-school"
            className="font-sans text-xs font-medium uppercase tracking-wide text-slate-600"
          >
            School
          </label>
          <div className="relative">
            <select
              id="export-school"
              value={selectedSchool}
              onChange={e => setSelectedSchool(e.target.value)}
              className={cn(
                'h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8',
                'font-sans text-sm',
                'focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-600 focus:ring-offset-0',
                'transition-shadow duration-150',
                selectedSchool ? 'text-slate-900' : 'text-slate-400'
              )}
            >
              <option value="" disabled>
                Select school
              </option>
              {schools.map(school => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                className="text-slate-400"
              >
                <path
                  d="M2 4L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={isDisabled}
          title={
            !selectedSchool
              ? 'Select a school to export'
              : preview.status === 'empty'
                ? 'Nothing to export for this period'
                : undefined
          }
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-4',
            'font-sans text-sm font-medium',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-600 focus-visible:ring-offset-2',
            canExport
              ? [
                  'cursor-pointer bg-olive-600 text-white',
                  'hover:bg-olive-700 hover:shadow-sm',
                  'active:scale-[0.98] active:bg-olive-800',
                ]
              : [
                  'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400',
                ]
          )}
        >
          {isExporting ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              <span>Generating PDF…</span>
            </>
          ) : (
            <>
              <Download size={14} aria-hidden="true" />
              <span>Export PDF</span>
            </>
          )}
        </button>
      </div>

      <PreviewPill preview={preview} school={selectedSchool} month={selectedMonth} />
    </div>
  )
}

function PreviewPill({
  preview,
  school,
  month,
}: {
  preview: PreviewState
  school: string
  month: string
}) {
  const monthLabel = month
    ? new Date(`${month}-01`).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  if (preview.status === 'idle') return null

  if (preview.status === 'loading') {
    return (
      <div
        className="h-5 w-48 animate-pulse rounded-full bg-slate-100"
        aria-label="Loading preview…"
      />
    )
  }

  if (preview.status === 'empty') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <FileX size={14} className="shrink-0 text-amber-500" aria-hidden="true" />
        <div className="flex flex-col">
          <span className="font-sans text-xs font-medium text-amber-700">
            No sessions recorded for {school} in {monthLabel}
          </span>
          <span className="font-sans text-xs text-amber-600/70">
            Sessions logged this month will appear here.
          </span>
        </div>
      </div>
    )
  }

  if (preview.status === 'error') {
    return (
      <span className="font-sans text-xs text-red-500">
        Could not load preview — check your connection.
      </span>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-olive-200 bg-olive-50 px-3 py-1',
        'transition-opacity duration-[220ms]'
      )}
    >
      <span className="font-mono text-xs font-medium tabular-nums text-olive-700">
        {preview.sessions}
      </span>
      <span className="font-sans text-xs text-olive-600">sessions</span>
      <span className="mx-0.5 font-sans text-xs text-olive-400">·</span>
      <span className="font-mono text-xs font-medium tabular-nums text-olive-700">
        {preview.students}
      </span>
      <span className="font-sans text-xs text-olive-600">students</span>
    </div>
  )
}

export default CaseloadExport
