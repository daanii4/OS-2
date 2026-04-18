'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import {
  LayoutDashboard,
  LineChart,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TabConfig = {
  id: string
  label: string
  icon: LucideIcon
  header: string
  description: string
}

const TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    header: 'Behavioral intelligence',
    description: 'District-wide incident trend and session cadence at a glance.',
  },
  {
    id: 'caseload',
    label: 'Caseload',
    icon: Users,
    header: 'Student roster',
    description: 'Open Student Caseload for search, filters, and full detail.',
  },
  {
    id: 'impact',
    label: 'Impact',
    icon: LineChart,
    header: 'Evidence-based progress',
    description: 'Reduction from individual baseline drives headline metrics.',
  },
]

export type BentoCardProps = {
  className?: string
  activeStudents: number
  incidents30d: number
  sessionsThisPeriod: number
}

/**
 * Compact bento-style panel (reference UI). Uses OS tokens and Lucide icons.
 * Hover on the outer shell matches dashboard card lift behavior.
 */
export function BentoCard({
  className,
  activeStudents,
  incidents30d,
  sessionsThisPeriod,
}: BentoCardProps) {
  const [active, setActive] = useState(TABS[0]!)
  const reduceMotion = useReducedMotion()

  const body = useMemo(() => {
    switch (active.id) {
      case 'overview':
        return (
          <div className="grid grid-cols-3 gap-2">
            <MetricPill label="Active" value={activeStudents} accent="var(--gold-500)" />
            <MetricPill label="Incidents (30d)" value={incidents30d} accent="var(--olive-600)" />
            <MetricPill label="Sessions" value={sessionsThisPeriod} accent="var(--olive-400)" />
          </div>
        )
      case 'caseload':
        return (
          <p className="font-sans text-[11px] leading-relaxed text-[var(--text-secondary)]">
            Use the caseload page for the full roster, exports, and per-student history. The dashboard
            below shows a preview only.
          </p>
        )
      case 'impact':
        return (
          <p className="font-sans text-[11px] leading-relaxed text-[var(--text-secondary)]">
            Charts and KPIs use office referrals, suspensions, and logged behavioral incidents, not
            session rubric scores.
          </p>
        )
      default:
        return null
    }
  }, [active.id, activeStudents, incidents30d, sessionsThisPeriod])

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm',
        !reduceMotion &&
          'transition-[transform,box-shadow] duration-[var(--duration-normal)] ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]',
        className
      )}
    >
      <div className="border-b border-[var(--border-default)] px-3 py-2.5">
        <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
          Operation Scholars OS
        </p>
        <p className="mt-0.5 font-[family-name:var(--font-dm-serif)] text-base leading-snug text-[var(--text-primary)]">
          {active.header}
        </p>
        <p className="mt-0.5 font-sans text-[11px] text-[var(--text-tertiary)]">{active.description}</p>
      </div>

      <div className="flex min-h-[112px] gap-0">
        <div className="w-[7.25rem] shrink-0 border-r border-[var(--border-default)] bg-[var(--surface-inner)]/80 p-1.5">
          <LayoutGroup>
            {TABS.map(tab => {
              const Icon = tab.icon
              const isOn = active.id === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab)}
                  className={cn(
                    'relative mb-0.5 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left font-sans text-[10px] font-medium transition-colors',
                    isOn ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  {isOn && (
                    <motion.span
                      layoutId="bento-pill"
                      className="absolute inset-0 rounded-lg bg-[var(--surface-card)] shadow-sm ring-1 ring-[var(--border-default)]"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', bounce: 0.2, duration: 0.45 }
                      }
                    />
                  )}
                  <Icon className="relative z-[1] h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="relative z-[1] truncate">{tab.label}</span>
                </button>
              )
            })}
          </LayoutGroup>
        </div>

        <div className="min-w-0 flex-1 p-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
              }
            >
              {body}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function MetricPill({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div
      className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-inner)] px-2 py-1.5"
      style={{ boxShadow: `inset 0 2px 0 0 ${accent}` }}
    >
      <p className="font-sans text-[8px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-lg font-medium tabular-nums text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  )
}

export default BentoCard
