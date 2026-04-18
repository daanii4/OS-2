'use client'

import type { IncidentSeverity } from '@/types/incidents'
import { SEVERITY_CONFIG } from '@/types/incidents'

interface SeveritySegmentProps {
  value: IncidentSeverity
  onChange: (value: IncidentSeverity) => void
}

const SEVERITIES: IncidentSeverity[] = ['low', 'medium', 'high']

export function SeveritySegment({ value, onChange }: SeveritySegmentProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Incident severity">
      {SEVERITIES.map(sev => {
        const config = SEVERITY_CONFIG[sev]
        const isActive = value === sev

        return (
          <label key={sev} className="relative cursor-pointer">
            <input
              type="radio"
              name="severity"
              value={sev}
              checked={isActive}
              onChange={() => onChange(sev)}
              className="sr-only"
            />
            <span
              className="
                flex h-9 select-none items-center justify-center gap-1.5 rounded-[7px] border
                font-sans text-[12px] font-medium
                transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]
              "
              style={
                isActive
                  ? {
                      background: config.labelBg,
                      borderColor: config.labelBorder,
                      color: config.labelText,
                    }
                  : {
                      background: '#eef0e8',
                      borderColor: 'rgba(92,107,70,0.20)',
                      color: '#5C6B46',
                    }
              }
            >
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ background: isActive ? config.dotColor : '#8a9e69' }}
                aria-hidden="true"
              />
              {config.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}
