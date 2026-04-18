'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { SeveritySegment } from '@/components/incidents/SeveritySegment'
import type { IncidentType, IncidentSeverity } from '@/types/incidents'
import { INCIDENT_TYPE_LABELS } from '@/types/incidents'

interface IncidentLogFormProps {
  studentId: string
  onSaved: () => void
}

const SUSPENSION_TYPES: IncidentType[] = ['suspension_iss', 'suspension_oss']

const EMPTY_FORM = {
  incident_type: '' as IncidentType | '',
  severity: 'medium' as IncidentSeverity,
  incident_date: '',
  reported_by: '',
  suspension_days: '',
  description: '',
}

export function IncidentLogForm({ studentId, onSaved }: IncidentLogFormProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({})
  const [isPending, startTransition] = useTransition()

  const isSuspension = SUSPENSION_TYPES.includes(form.incident_type as IncidentType)

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.incident_type) newErrors.incident_type = 'Select an incident type'
    if (!form.incident_date) newErrors.incident_date = 'Date is required'
    if (!form.reported_by.trim()) newErrors.reported_by = 'Enter who reported this'
    if (isSuspension) {
      const n = parseFloat(form.suspension_days)
      if (form.suspension_days === '' || Number.isNaN(n) || n < 0.5) {
        newErrors.suspension_days = 'Enter suspension duration (min 0.5)'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return

    startTransition(async () => {
      try {
        const incidentDateIso = /^\d{4}-\d{2}-\d{2}$/.test(form.incident_date)
          ? new Date(`${form.incident_date}T12:00:00`).toISOString()
          : new Date(form.incident_date).toISOString()

        const body: Record<string, unknown> = {
          incident_date: incidentDateIso,
          incident_type: form.incident_type,
          severity: form.severity,
          reported_by: form.reported_by.trim(),
          description: form.description.trim() || null,
        }
        if (isSuspension) {
          body.suspension_days = parseFloat(form.suspension_days)
        }

        const res = await fetch(`/api/students/${studentId}/incidents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const j = (await res.json()) as { error?: string }
          throw new Error(j.error ?? 'Failed to save')
        }

        toast.success('Incident saved')
        setForm(EMPTY_FORM)
        setErrors({})
        onSaved()
      } catch {
        toast.error('Failed to save incident — try again')
      }
    })
  }

  function handleClear() {
    setForm(EMPTY_FORM)
    setErrors({})
  }

  return (
    <div
      className="
      sticky top-5 self-start overflow-hidden rounded-xl border border-[rgba(92,107,70,0.12)] bg-white
    "
      style={{ width: '100%', maxWidth: '360px' }}
    >
      <div className="border-b border-[rgba(92,107,70,0.08)] px-5 py-4">
        <h2 className="font-[family-name:var(--font-dm-serif)] text-[18px] font-normal text-[#1e2517]">
          Log Incident
        </h2>
        <p className="mt-0.5 font-sans text-[11px] text-[#6e8050]">
          All fields except description are required
        </p>
      </div>

      <div className="flex flex-col gap-3.5 px-5 py-4">
        <FieldWrapper label="Incident Type" hint="Category from the school or district record" error={errors.incident_type}>
          <select
            value={form.incident_type}
            onChange={e => setField('incident_type', e.target.value as IncidentType)}
            className={selectClass(!!errors.incident_type)}
            aria-invalid={!!errors.incident_type}
          >
            <option value="">Select type…</option>
            {(Object.entries(INCIDENT_TYPE_LABELS) as [IncidentType, string][]).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {errors.incident_type ? <ErrorMsg>{errors.incident_type}</ErrorMsg> : null}
        </FieldWrapper>

        {isSuspension ? (
          <div
            className="
            rounded-[7px] border border-[rgba(214,160,51,0.22)] bg-[#fdf8ec] p-3
          "
          >
            <FieldWrapper
              label="Suspension Duration"
              labelColor="#7a5a10"
              hint="Number of days (0.5 = half day)"
              error={errors.suspension_days}
            >
              <input
                type="number"
                value={form.suspension_days}
                onChange={e => setField('suspension_days', e.target.value)}
                placeholder="e.g. 2"
                min={0.5}
                step={0.5}
                className={inputClass(!!errors.suspension_days)}
                style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', fontSize: '13px' }}
                aria-invalid={!!errors.suspension_days}
              />
              {errors.suspension_days ? <ErrorMsg>{errors.suspension_days}</ErrorMsg> : null}
            </FieldWrapper>
          </div>
        ) : null}

        <FieldWrapper label="Severity" hint="How serious the incident was for progress tracking">
          <SeveritySegment value={form.severity} onChange={val => setField('severity', val)} />
        </FieldWrapper>

        <FieldWrapper
          label="Incident Date"
          hint="When the school recorded or observed this incident"
          error={errors.incident_date}
        >
          <input
            type="date"
            value={form.incident_date}
            onChange={e => setField('incident_date', e.target.value)}
            className={inputClass(!!errors.incident_date)}
            style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', fontSize: '12px' }}
            aria-invalid={!!errors.incident_date}
          />
          {errors.incident_date ? <ErrorMsg>{errors.incident_date}</ErrorMsg> : null}
        </FieldWrapper>

        <FieldWrapper
          label="Reported By"
          hint="Staff name or role who reported the incident"
          error={errors.reported_by}
        >
          <input
            type="text"
            value={form.reported_by}
            onChange={e => setField('reported_by', e.target.value)}
            placeholder="e.g. Ms. Chen, 6th grade"
            className={inputClass(!!errors.reported_by)}
            aria-invalid={!!errors.reported_by}
          />
          {errors.reported_by ? <ErrorMsg>{errors.reported_by}</ErrorMsg> : null}
        </FieldWrapper>

        <FieldWrapper
          label="Incident Description"
          labelSuffix="optional"
          hint="Factual summary for the file — what happened, context"
        >
          <textarea
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            placeholder="Describe what happened. Include context, staff involved, and any relevant background..."
            rows={4}
            className="
              min-h-[90px] w-full resize-y rounded-[7px] border border-[rgba(92,107,70,0.20)] bg-[#eef0e8] px-3 py-2.5
              font-sans text-[13px] leading-relaxed text-[#1e2517] placeholder:text-[#8a9e69]
              outline-none transition-[border-color,box-shadow,background] duration-[150ms]
              hover:border-[rgba(92,107,70,0.35)] focus:border-[#5C6B46] focus:bg-white
              focus:shadow-[0_0_0_3px_rgba(92,107,70,0.11)]
            "
          />
        </FieldWrapper>
      </div>

      <div
        className="
        flex items-center gap-2 border-t border-[rgba(92,107,70,0.08)] px-5 py-3.5
      "
      >
        <button
          type="button"
          onClick={handleClear}
          disabled={isPending}
          className="
            h-10 rounded-lg border border-[rgba(92,107,70,0.22)] bg-transparent px-4
            font-sans text-[13px] font-medium text-[#5C6B46]
            transition-all duration-[150ms] hover:bg-[#f3f7e8] active:scale-[0.99]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-offset-1
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="
            flex h-10 flex-1 items-center justify-center rounded-lg bg-[#5C6B46] font-sans text-[13px] font-semibold
            text-white transition-all duration-[150ms] hover:bg-[#3d4c2c] active:scale-[0.99] active:bg-[#2d3820]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-3.5 w-3.5 animate-spin"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M8 2a6 6 0 0 1 0 12" strokeLinecap="round" />
              </svg>
              Saving…
            </span>
          ) : (
            'Save Incident'
          )}
        </button>
      </div>
    </div>
  )
}

function FieldWrapper({
  label,
  labelSuffix,
  labelColor,
  hint,
  children,
}: {
  label: string
  labelSuffix?: string
  labelColor?: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-sans text-[10px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: labelColor ?? '#3d4c2c' }}
        >
          {label}
        </span>
        {labelSuffix ? (
          <span className="font-sans text-[10px] font-normal normal-case tracking-normal text-[#8a9e69]">
            — {labelSuffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="-mt-0.5 font-sans text-[11px] text-[#6e8050]">{hint}</p> : null}
      {children}
    </div>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1 font-sans text-[11px] text-[#dc2626]" role="alert">
      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
      {children}
    </p>
  )
}

function inputClass(hasError: boolean) {
  return `
    w-full rounded-[7px] border px-3 py-2.5
    bg-[#eef0e8] font-sans text-[13px] text-[#1e2517]
    placeholder:text-[#8a9e69] outline-none
    transition-[border-color,box-shadow,background] duration-[150ms]
    hover:border-[rgba(92,107,70,0.35)]
    focus:border-[#5C6B46] focus:bg-white focus:shadow-[0_0_0_3px_rgba(92,107,70,0.11)] focus-visible:outline-none
    ${
      hasError
        ? 'border-[#dc2626] focus:border-[#dc2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10)]'
        : 'border-[rgba(92,107,70,0.20)]'
    }
  `
}

function selectClass(hasError: boolean) {
  return `
    w-full cursor-pointer appearance-none rounded-[7px] border bg-[#eef0e8] bg-[url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238a9e69' stroke-width='1.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E")] bg-[right_10px_center] bg-no-repeat px-3 py-2.5 pr-8
    font-sans text-[13px] text-[#1e2517] outline-none
    transition-[border-color,box-shadow,background] duration-[150ms]
    hover:border-[rgba(92,107,70,0.35)]
    focus:border-[#5C6B46] focus:bg-white focus:shadow-[0_0_0_3px_rgba(92,107,70,0.11)]
    ${
      hasError
        ? 'border-[#dc2626]'
        : 'border-[rgba(92,107,70,0.20)]'
    }
  `
}
