'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SidebarAccountMenu } from '@/components/layout/sidebar-account-menu'
import {
  StudentsHeader,
  type StudentFilterKey,
} from '@/components/students/students-header'
import { EmptyState } from '@/components/ui/empty-state'
import { StudentAvatar } from '@/components/ui/student-avatar'
const DashboardIncidentChart = dynamic(
  () => import('./dashboard-incident-chart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
    ),
  }
)

type RecentStudent = {
  id: string
  first_name: string
  last_name: string
  grade: string
  school: string
  status: string
  baseline_incident_count: number | null
  escalation_active: boolean
}

type DashboardShellProps = {
  profileName: string
  profileRole: string
  /** Show Analytics + Team nav (owner / assistant). Counselors are redirected if they hit those URLs. */
  showOrgNav: boolean
  activeStudents: number
  incidentsCurrent: number
  incidentTrendPct: number | null
  sessionsCurrent: number
  noShowsCurrent: number
  avgGoalCompletion: number | null
  recentStudents: RecentStudent[]
  incidentCountByStudent: Record<string, number>
  escalatedStudentName: string | null
  topOffset: number
  caseloadExport?: ReactNode
}

function reductionPct(
  baseline: number | null,
  currentIncidents: number
): number | null {
  if (baseline === null || baseline <= 0) return null
  return Number((((baseline - currentIncidents) / baseline) * 100).toFixed(0))
}

/** Worsening vs baseline; matches caseload filter (≥ 25%). */
function regressionDeltaPct(
  baseline: number | null,
  currentIncidents: number
): number | null {
  const r = reductionPct(baseline, currentIncidents)
  if (r === null) return null
  return -r
}

function splitProfileName(name: string): { first: string; last: string } {
  const parts = name
    .split(' ')
    .map(part => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0]!, last: '' }
  return { first: parts[0]!, last: parts[parts.length - 1]! }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-[var(--olive-100)] text-[var(--olive-800)] border border-[var(--olive-200)]'
    case 'graduated':
      return 'bg-[var(--gold-100)] text-[#7A5A10] border border-[var(--gold-200)]'
    case 'transferred':
      return 'bg-gray-100 text-gray-600 border border-gray-200'
    case 'escalated':
      return 'bg-[#FEF2F2] text-[var(--color-escalation)] border border-[#FECACA]'
    default:
      return 'bg-gray-50 text-gray-400 border border-gray-100'
  }
}

const NAV_SECTIONS = ['Main', 'Reports', 'Settings'] as const

type NavLinkItem = {
  href: string
  label: string
  abbr: string
  section: (typeof NAV_SECTIONS)[number]
  /** If true, only shown when showOrgNav (owner / assistant). */
  orgOnly?: boolean
}

const NAV_LINKS: NavLinkItem[] = [
  { href: '/dashboard', label: 'Your Students', abbr: 'D', section: 'Main' },
  { href: '/dashboard/students', label: 'Student Caseload', abbr: 'S', section: 'Main' },
  { href: '/dashboard/analytics', label: 'Impact Overview', abbr: 'A', section: 'Reports', orgOnly: true },
  {
    href: '/dashboard/team',
    label: 'Team',
    abbr: 'T',
    section: 'Settings',
    orgOnly: true,
  },
]

/** Incident trend pill — only regression uses `badge-regression` pulse (uienhance §1.3). */
function trendMeta(reductionPct: number | null): { label: string; className: string } | null {
  if (reductionPct === null) return null
  if (reductionPct > 0) {
    return {
      label: `↓ Improving · ${Math.abs(reductionPct)}%`,
      className:
        'inline-flex max-w-[12rem] justify-end rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700',
    }
  }
  if (reductionPct < 0) {
    return {
      label: `↑ Needs attention · ${Math.abs(reductionPct)}%`,
      className:
        'inline-flex max-w-[12rem] justify-end rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 badge-regression',
    }
  }
  return {
    label: '→ Stable',
    className:
      'inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600',
  }
}

function normalizePath(pathname: string | null): string {
  if (!pathname) return ''
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function isNavActive(pathname: string | null, href: string): boolean {
  const p = normalizePath(pathname)
  if (!p) return false
  if (href === '/dashboard') return p === '/dashboard'
  return p === href || p.startsWith(`${href}/`)
}

function NavLinks({
  collapsed,
  onLinkClick,
  showOrgNav,
}: {
  collapsed: boolean
  onLinkClick: () => void
  /** Owner / assistant only — Analytics + Team redirect counselors away */
  showOrgNav: boolean
}) {
  const pathname = usePathname()
  const visibleLinks = NAV_LINKS.filter(l => !l.orgOnly || showOrgNav)

  return (
    <>
      {NAV_SECTIONS.map(section => {
        const sectionLinks = visibleLinks.filter(l => l.section === section)
        if (sectionLinks.length === 0) return null
        return (
        <div key={section} className="mb-1">
          <p
            className={`mb-1.5 mt-4 px-3 text-[8px] font-medium uppercase tracking-[0.08em] transition-opacity duration-75 ${
              collapsed ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            {section}
          </p>
          {sectionLinks.map(link => {
            const active = isNavActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onLinkClick}
                className={`relative mb-0.5 flex h-9 items-center gap-3 rounded-lg px-3 transition-all duration-[var(--duration-fast)] ${
                  active
                    ? 'bg-white/[0.12] text-white'
                    : 'text-white/45 hover:bg-white/[0.06] hover:text-white/90'
                }`}
              >
                {active && (
                  <span
                    className="nav-active-indicator absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-teal-400"
                    aria-hidden
                  />
                )}
                <span
                  className={`text-[12px] font-[500] transition-opacity duration-75 ${
                    active ? 'pl-0.5' : ''
                  }`}
                  style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                >
                  {collapsed ? link.abbr : link.label}
                </span>
              </Link>
            )
          })}
        </div>
        )
      })}
    </>
  )
}

export function DashboardShell({
  profileName,
  profileRole,
  showOrgNav,
  activeStudents,
  incidentsCurrent,
  incidentTrendPct,
  sessionsCurrent,
  noShowsCurrent,
  avgGoalCompletion,
  recentStudents,
  incidentCountByStudent,
  escalatedStudentName,
  topOffset,
  caseloadExport,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = window.localStorage.getItem('os2.sidebar.open')
    if (saved === '0') return false
    if (saved === '1') return true
    return true
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Always default true (SSR-safe). useEffect corrects to actual viewport post-hydration.
  const [isDesktop, setIsDesktop] = useState(true)

  const [studentSearch, setStudentSearch] = useState('')
  const [studentFilter, setStudentFilter] = useState<StudentFilterKey>('all')
  const [escalationAcknowledged, setEscalationAcknowledged] = useState(false)

  type ChartPeriod = 'week' | 'month' | 'year'
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('month')
  const [chartData, setChartData] = useState<{ label: string; incidents: number }[]>([])
  const [chartMax, setChartMax] = useState(1)
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)

  const fetchIncidentChart = useCallback(async (p: ChartPeriod) => {
    setChartLoading(true)
    setChartError(null)
    try {
      const res = await fetch(`/api/dashboard/incident-frequency?period=${p}`)
      if (!res.ok) throw new Error('Failed to load chart')
      const json = (await res.json()) as {
        data: { labels: string[]; incidents: number[]; chartMax: number }
      }
      const d = json.data
      setChartData(
        d.labels.map((label, i) => ({
          label,
          incidents: d.incidents[i] ?? 0,
        }))
      )
      setChartMax(d.chartMax ?? 1)
    } catch {
      setChartError('Could not load incident chart')
    } finally {
      setChartLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIncidentChart(chartPeriod)
  }, [chartPeriod, fetchIncidentChart])

  useEffect(() => {
    window.localStorage.setItem('os2.sidebar.open', sidebarOpen ? '1' : '0')
  }, [sidebarOpen])

  // Close mobile menu on route change / resize to desktop
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
      if (window.innerWidth >= 1024) setMobileMenuOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()
    return recentStudents.filter(student => {
      const currentCount = incidentCountByStudent[student.id] ?? 0
      const baseline = student.baseline_incident_count
      const delta = regressionDeltaPct(baseline, currentCount)

      const matchesQuery =
        !query ||
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(query) ||
        student.school.toLowerCase().includes(query) ||
        student.grade.toLowerCase().includes(query)

      if (!matchesQuery) return false
      if (studentFilter === 'regression') return delta !== null && delta >= 25
      if (studentFilter === 'escalated') return student.escalation_active
      return true
    })
  }, [incidentCountByStudent, recentStudents, studentFilter, studentSearch])

  // Sidebar metrics derived data
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of recentStudents) {
      counts[s.status] = (counts[s.status] ?? 0) + 1
    }
    return counts
  }, [recentStudents])

  const regressionCount = useMemo(
    () =>
      recentStudents.filter(s => {
        const current = incidentCountByStudent[s.id] ?? 0
        const delta = regressionDeltaPct(s.baseline_incident_count, current)
        return delta !== null && delta >= 25
      }).length,
    [recentStudents, incidentCountByStudent]
  )

  const ownerWelcomeGreeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const [showOwnerDayGreeting, setShowOwnerDayGreeting] = useState(false)
  useEffect(() => {
    if (profileRole !== 'owner' && profileRole !== 'assistant') {
      setShowOwnerDayGreeting(false)
      return
    }
    const key = `os2.dashboard.greeting.${new Date().toDateString()}`
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(key)) {
      setShowOwnerDayGreeting(false)
      return
    }
    sessionStorage.setItem(key, '1')
    setShowOwnerDayGreeting(true)
  }, [profileRole])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const chartPeriodToggle = (
    <div
      className="flex items-center rounded-full p-1"
      style={{ background: 'var(--surface-inner)' }}
      role="group"
      aria-label="Incident chart time range"
    >
      {(['week', 'month', 'year'] as ChartPeriod[]).map(p => (
        <button
          key={p}
          type="button"
          onClick={() => setChartPeriod(p)}
          className={`rounded-full px-3 py-1 text-[10px] transition-colors ${
            chartPeriod === p ? 'font-semibold' : 'font-medium'
          }`}
          style={
            chartPeriod === p
              ? { background: 'var(--surface-card)' }
              : { background: 'transparent' }
          }
        >
          {p === 'week' ? 'Wk' : p === 'month' ? 'Mo' : 'Yr'}
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      {/* ── Mobile top bar (lg:hidden) ── */}
      {!isDesktop && (
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="os-btn-icon"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <path fillRule="evenodd" d="M3 5h14a1 1 0 000-2H3a1 1 0 000 2zm0 6h14a1 1 0 000-2H3a1 1 0 000 2zm0 6h14a1 1 0 000-2H3a1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="os-motif flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden bg-[var(--gold-500)]">
              <img
                src="/logo-mark.png"
                alt="Operation Scholars"
                className="h-[22px] w-[22px] object-contain"
              />
            </div>
            <span className="os-subhead text-[var(--text-primary)]">Operation Scholars</span>
          </div>
        </div>
        <Link href="/dashboard/students" className="os-btn-primary text-sm">
          + Log Session
        </Link>
        </div>
      )}

      {/* ── Mobile drawer overlay ── */}
      {!isDesktop && mobileMenuOpen && (
        <div className="fixed inset-0 z-50" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="absolute left-0 top-0 flex h-full w-[260px] flex-col bg-[var(--olive-800)] transition-transform duration-100"
            style={{ transform: 'translateX(0)' }}
          >
            <div className="border-b border-white/[0.08] px-4 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="os-motif flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden bg-[var(--gold-500)]">
                    <img
                      src="/logo-mark.png"
                      alt="Operation Scholars"
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                  <div>
                    <p
                      className="text-[15px] font-normal leading-tight tracking-[-0.01em] text-white"
                      style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                    >
                      Operation Scholars
                    </p>
                    <p
                      className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      Behavioral Intelligence
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="os-btn-icon"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2">
              <NavLinks collapsed={false} onLinkClick={closeMobileMenu} showOrgNav={showOrgNav} />
            </nav>
            <div className="border-t border-white/10 px-4 py-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const { first, last } = splitProfileName(profileName)
                  return <StudentAvatar firstName={first} lastName={last} size="sm" />
                })()}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">{profileName}</p>
                  <p className="os-label truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {profileRole}
                  </p>
                </div>
                <SidebarAccountMenu />
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── Desktop shell — viewport-height row so sidebar scroll is independent of main ── */}
      {isDesktop && (
        <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className={`flex h-full min-h-0 shrink-0 flex-col border-r border-white/[0.06] bg-[var(--olive-800)] transition-[width] duration-100 ease-out ${
            sidebarOpen ? 'w-[260px]' : 'w-[76px]'
          }`}
        >
          <div className="shrink-0 border-b border-white/[0.08] px-3 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="os-motif flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden bg-[var(--gold-500)]">
                  <img
                    src="/logo-mark.png"
                    alt="Operation Scholars"
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div
                  className={`min-w-0 overflow-hidden transition-all duration-100 ${
                    sidebarOpen ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'
                  }`}
                >
                  <p
                    className="text-[15px] font-normal leading-tight tracking-[-0.01em] text-white"
                    style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                  >
                    Operation Scholars
                  </p>
                  <p
                    className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    Behavioral Intelligence
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(open => !open)}
                className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-white/35 transition-colors hover:bg-white/[0.08] hover:text-white/70"
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <svg
                  viewBox="0 0 16 16"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  {sidebarOpen ? (
                    <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-2">
            <NavLinks
              collapsed={!sidebarOpen}
              onLinkClick={closeMobileMenu}
              showOrgNav={showOrgNav}
            />
          </nav>

          <div className="shrink-0 border-t border-white/10 px-4 py-4">
            <div className="flex items-center gap-2">
              {(() => {
                const { first, last } = splitProfileName(profileName)
                return <StudentAvatar firstName={first} lastName={last} size="md" />
              })()}
              <div
                className={`min-w-0 flex-1 overflow-hidden transition-all duration-100 ${
                  sidebarOpen ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'
                }`}
              >
                <p className="truncate text-[13px] font-medium text-white">{profileName}</p>
                <p className="os-label truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {profileRole}
                </p>
              </div>
              <div className="flex-shrink-0">
                <SidebarAccountMenu />
              </div>
            </div>
          </div>
        </aside>

        {/* Desktop main content — only this column scrolls with long dashboard content */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
          {/* Escalation banner §3.8 */}
          {escalatedStudentName && !escalationAcknowledged && (
            <div
              className="flex w-full items-center justify-between gap-4 px-6 py-3"
              style={{ background: '#DC2626', borderRadius: 0 }}
            >
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-[13px] font-medium text-white">
                  Escalation Required — {escalatedStudentName} · AI flagged a safety concern requiring licensed clinician referral
                </p>
              </div>
                <button
                  className="flex-shrink-0 rounded px-4 py-2 text-[13px] font-semibold transition-colors"
                  style={{ background: '#FFFFFF', color: '#DC2626', minHeight: 36 }}
                  onClick={() => setEscalationAcknowledged(true)}
                >
                  Acknowledge & Take Action
                </button>
            </div>
          )}

          {/* Topbar */}
          <div className="sticky top-0 z-10 border-b border-[var(--border-default)] bg-[var(--surface-card)] px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(open => !open)}
                  className="os-btn-icon text-[var(--text-secondary)]"
                  aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  <svg
                    viewBox="0 0 16 16"
                    className={`h-4 w-4 transition-transform duration-100 ${sidebarOpen ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path d="M10.5 3.5L6 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div>
                  <h1 className="os-title">Your Students</h1>
                  {(profileRole === 'owner' || profileRole === 'assistant') &&
                    showOwnerDayGreeting && (
                      <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                        {ownerWelcomeGreeting}, {splitProfileName(profileName).first || profileName}.{' '}
                        {activeStudents} students active today.
                      </p>
                    )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="os-btn-secondary">Export District Report</button>
                <Link href="/dashboard/students" className="os-btn-primary">
                  + Log Session
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 pb-6" style={{ paddingTop: `${topOffset}px` }}>
            {/* KPI row */}
            <section className="os-kpi-grid">
              {/* Active students — gold top border */}
              <div
                className="os-card-tight"
                style={{ borderTop: '3px solid var(--gold-500)', paddingTop: 17 }}
              >
                <p className="os-label">Active students</p>
                <p className="os-data-hero mt-2">{activeStudents}</p>
                <p className="os-caption mt-1">no change this week</p>
              </div>

              {/* Incidents — semantic top border */}
              <div
                className="os-card-tight"
                style={{
                  borderTop: `3px solid ${
                    incidentTrendPct !== null && incidentTrendPct > 0
                      ? 'var(--color-regression)'
                      : 'var(--color-success)'
                  }`,
                  paddingTop: 17,
                }}
              >
                <p className="os-label">Incidents (30d)</p>
                <p className="os-data-hero mt-2">{incidentsCurrent}</p>
                <p className="os-caption mt-1">
                  <span
                    className={
                      incidentTrendPct !== null && incidentTrendPct > 0
                        ? 'text-[var(--color-regression)]'
                        : 'text-[var(--color-success)]'
                    }
                  >
                    {incidentTrendPct !== null && incidentTrendPct <= 0 ? '↓ ' : '↑ '}
                    {Math.abs(Number((incidentTrendPct ?? 0).toFixed(0)))}%
                  </span>{' '}
                  vs prior period
                </p>
              </div>

              {/* Avg goal — success top border */}
              <div
                className="os-card-tight"
                style={{ borderTop: '3px solid var(--color-success)', paddingTop: 17 }}
              >
                <p className="os-label">Avg goal completion</p>
                <p className="os-data-hero mt-2">
                  {avgGoalCompletion !== null
                    ? `${Number(avgGoalCompletion.toFixed(0))}%`
                    : 'n/a'}
                </p>
                <p className="os-caption mt-1">
                  <span className="text-[var(--color-success)]">
                    ↑{' '}
                    {avgGoalCompletion !== null
                      ? Math.max(1, Math.round(avgGoalCompletion / 10))
                      : 0}
                    pts
                  </span>{' '}
                  last 4 sessions
                </p>
              </div>

              {/* Sessions — neutral top border */}
              <div
                className="os-card-tight"
                style={{ borderTop: '3px solid var(--olive-200)', paddingTop: 17 }}
              >
                <p className="os-label">Sessions this week</p>
                <p className="os-data-hero mt-2">{sessionsCurrent}</p>
                <p className="os-caption mt-1">
                  <span className="text-[var(--color-regression)]">
                    {noShowsCurrent} no-shows
                  </span>{' '}
                  need follow-up
                </p>
              </div>
            </section>

            {caseloadExport && (
              <div className="relative overflow-hidden rounded-xl bg-[var(--olive-800)] p-5">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 70% 80% at 85% 50%, rgba(214, 160, 51, 0.15) 0%, transparent 65%)',
                  }}
                  aria-hidden
                />
                <div
                  className="absolute left-0 top-0 h-full w-1 bg-[var(--gold-500)]"
                  aria-hidden
                />
                <div className="relative z-10">{caseloadExport}</div>
              </div>
            )}

            {/* Primary 2-col grid: charts left, sidebar metrics right */}
            <div className="grid gap-[14px] lg:grid-cols-[1fr_320px]">
              {/* Left — incident frequency chart */}
              <section className="os-card">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="os-heading">Incident Frequency — All Students</h2>
                    <p className="os-body">Office referrals, suspensions, and behavioral incidents</p>
                  </div>
                  {chartPeriodToggle}
                </div>

                <div className="h-[240px] w-full min-w-0 rounded-md bg-[var(--surface-inner)] p-3">
                  {chartError ? (
                    <p className="os-body text-[var(--color-regression)]">{chartError}</p>
                  ) : chartLoading ? (
                    <div className="h-full w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
                  ) : (
                    <DashboardIncidentChart data={chartData} chartMax={chartMax} />
                  )}
                </div>
              </section>

              {/* Right — sidebar metrics panel */}
              <div className="flex flex-col gap-[14px]">
                {/* Status mix */}
                <div className="os-card">
                  <h3 className="os-subhead mb-3">Student status mix</h3>
                  <div className="space-y-2">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span
                          className={`rounded-[var(--radius-sm)] px-2 py-0.5 os-caption font-medium uppercase tracking-[0.07em] ${getStatusBadgeClass(status)}`}
                        >
                          {status}
                        </span>
                        <span className="os-data text-[var(--text-primary)]">{count}</span>
                      </div>
                    ))}
                    {Object.keys(statusCounts).length === 0 && (
                      <EmptyState
                        icon={
                          <img
                            src="/logo-mark.png"
                            alt=""
                            className="h-10 w-10 object-contain opacity-40"
                          />
                        }
                        title="No students assigned yet"
                        body="Every student here is someone worth showing up for."
                      />
                    )}
                  </div>
                </div>

                {/* Sessions + no-shows */}
                <div className="os-card">
                  <h3 className="os-subhead mb-3">This week</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="os-caption">Sessions completed</span>
                      <span className="os-data">{sessionsCurrent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="os-caption text-[var(--color-regression)]">No-shows</span>
                      <span className="os-data text-[var(--color-regression)]">{noShowsCurrent}</span>
                    </div>
                  </div>
                </div>

                {/* Regression alert */}
                {regressionCount > 0 && (
                  <div
                    className="os-card"
                    style={{ borderTop: '3px solid var(--color-regression)', paddingTop: 17 }}
                  >
                    <h3 className="os-subhead mb-1 text-[var(--color-regression)]">
                      Regression alerts
                    </h3>
                    <p className="os-data-hero text-[var(--color-regression)]">{regressionCount}</p>
                    <p className="os-caption mt-1">
                      {regressionCount === 1 ? 'student' : 'students'} above baseline
                    </p>
                    <p className="os-caption mt-2 max-w-[14rem] text-[var(--text-tertiary)]">
                      A setback isn&apos;t the story — it&apos;s a chapter.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Students section */}
            <section className="os-card">
              <div className="px-4 pt-4 md:px-5">
                <StudentsHeader
                  totalCount={recentStudents.length}
                  filteredCount={filteredStudents.length}
                  activeFilter={studentFilter}
                  onFilterChange={setStudentFilter}
                  onSearchChange={setStudentSearch}
                />
              </div>

              {filteredStudents.length === 0 ? (
                recentStudents.length === 0 ? (
                  <EmptyState
                    icon={
                      <img
                        src="/logo-mark.png"
                        alt=""
                        className="h-10 w-10 object-contain opacity-40"
                      />
                    }
                    title="No students assigned yet"
                    body="Every student here is someone worth showing up for."
                  />
                ) : (
                  <p className="os-body">No students match this filter/search.</p>
                )
              ) : (
                <ul className="space-y-2">
                  {filteredStudents.map((student, i) => {
                    const currentCount = incidentCountByStudent[student.id] ?? 0
                    const baseline = student.baseline_incident_count
                    const reductionPct =
                      baseline && baseline > 0
                        ? Number((((baseline - currentCount) / baseline) * 100).toFixed(0))
                        : null
                    const trend = trendMeta(reductionPct)

                    return (
                      <li key={student.id}>
                        <Link
                          href={`/dashboard/students/${student.id}`}
                          className="card-enter os-student-card"
                          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                        >
                          <svg
                            className="os-student-card__chevron"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            aria-hidden
                          >
                            <path
                              d="M6 4l4 4-4 4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <StudentAvatar
                                firstName={student.first_name}
                                lastName={student.last_name}
                                size="md"
                              />
                              <div className="min-w-0">
                              <p className="os-heading">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="os-caption">
                                Grade {student.grade} · {student.school}
                              </p>
                              </div>
                            </div>
                            <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-3 text-right">
                              <span
                                className={`rounded-[var(--radius-sm)] px-2 py-0.5 os-caption font-medium uppercase tracking-[0.07em] ${getStatusBadgeClass(student.status)}`}
                              >
                                {student.status}
                              </span>
                              <div>
                                <p className="os-caption">Incidents (30d)</p>
                                <p className="os-data text-right">{currentCount}</p>
                              </div>
                              <div className="min-w-[7rem] text-right">
                                <p className="os-caption">vs baseline</p>
                                {trend ? (
                                  <span className={`${trend.className} mt-0.5 inline-flex max-w-[12rem] justify-end`}>
                                    {trend.label}
                                  </span>
                                ) : (
                                  <p className="os-data">—</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
      )}

      {/* ── Mobile main content (below mobile topbar) ── */}
      {!isDesktop && <div>
        {/* Escalation banner on mobile too */}
        {escalatedStudentName && !escalationAcknowledged && (
          <div
            className="flex w-full items-center justify-between gap-3 px-4 py-3"
            style={{ background: '#DC2626', borderRadius: 0 }}
          >
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-[12px] font-medium text-white">
                Escalation — {escalatedStudentName}
              </p>
            </div>
            <button
              className="flex-shrink-0 rounded px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: '#FFFFFF', color: '#DC2626', minHeight: 32 }}
              onClick={() => setEscalationAcknowledged(true)}
            >
              Acknowledge & Take Action
            </button>
          </div>
        )}

        <div className="space-y-3 px-4 py-4">
          {/* KPI grid */}
          <section className="os-kpi-grid">
            <div
              className="os-card-tight"
              style={{ borderTop: '3px solid var(--gold-500)', paddingTop: 13 }}
            >
              <p className="os-label">Active students</p>
              <p className="os-data-hero mt-1">{activeStudents}</p>
            </div>
            <div
              className="os-card-tight"
              style={{
                borderTop: `3px solid ${incidentTrendPct !== null && incidentTrendPct > 0 ? 'var(--color-regression)' : 'var(--color-success)'}`,
                paddingTop: 13,
              }}
            >
              <p className="os-label">Incidents (30d)</p>
              <p className="os-data-hero mt-1">{incidentsCurrent}</p>
            </div>
            <div
              className="os-card-tight"
              style={{ borderTop: '3px solid var(--color-success)', paddingTop: 13 }}
            >
              <p className="os-label">Avg goal</p>
              <p className="os-data-hero mt-1">
                {avgGoalCompletion !== null ? `${Number(avgGoalCompletion.toFixed(0))}%` : 'n/a'}
              </p>
            </div>
            <div
              className="os-card-tight"
              style={{ borderTop: '3px solid var(--olive-200)', paddingTop: 13 }}
            >
              <p className="os-label">Sessions</p>
              <p className="os-data-hero mt-1">{sessionsCurrent}</p>
            </div>
          </section>


          {/* Chart */}
          <section className="os-card">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <h2 className="os-subhead">Incident Frequency</h2>
              {chartPeriodToggle}
            </div>
            <div className="h-[200px] w-full min-w-0 rounded-md bg-[var(--surface-inner)] p-2">
              {chartError ? (
                <p className="os-body text-[var(--color-regression)]">{chartError}</p>
              ) : chartLoading ? (
                <div className="h-full w-full animate-pulse rounded-sm bg-[var(--surface-page)]" />
              ) : (
                <DashboardIncidentChart data={chartData} chartMax={chartMax} />
              )}
            </div>
          </section>

          {/* Students list */}
          <section className="os-card">
            <div className="px-1 pt-1">
              <StudentsHeader
                totalCount={recentStudents.length}
                filteredCount={filteredStudents.length}
                activeFilter={studentFilter}
                onFilterChange={setStudentFilter}
                onSearchChange={setStudentSearch}
              />
            </div>
            {filteredStudents.length === 0 ? (
              recentStudents.length === 0 ? (
                <EmptyState
                  icon={
                    <img
                      src="/logo-mark.png"
                      alt=""
                      className="h-10 w-10 object-contain opacity-40"
                    />
                  }
                  title="No students assigned yet"
                  body="Every student here is someone worth showing up for."
                />
              ) : (
                <p className="os-body">No students match this search.</p>
              )
            ) : (
              <ul className="space-y-2">
                {filteredStudents.map((student, i) => {
                  const currentCount = incidentCountByStudent[student.id] ?? 0
                  const baseline = student.baseline_incident_count
                  const reductionPct =
                    baseline && baseline > 0
                      ? Number((((baseline - currentCount) / baseline) * 100).toFixed(0))
                      : null
                  const trend = trendMeta(reductionPct)
                  return (
                    <li key={student.id}>
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="card-enter os-student-card"
                        style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                      >
                        <svg
                          className="os-student-card__chevron"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          aria-hidden
                        >
                          <path
                            d="M6 4l4 4-4 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex items-start gap-3">
                          <StudentAvatar
                            firstName={student.first_name}
                            lastName={student.last_name}
                            size="sm"
                          />
                          <div>
                        <p className="os-heading">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="os-caption">
                          Gr {student.grade} · {student.school}
                        </p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-[var(--radius-sm)] px-2 py-0.5 os-caption font-medium uppercase tracking-[0.07em] ${getStatusBadgeClass(student.status)}`}
                          >
                            {student.status}
                          </span>
                          <span className="os-caption">
                            {currentCount} inc. (30d)
                            {trend && (
                              <span className={`ml-2 ${trend.className}`}>{trend.label}</span>
                            )}
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>}
    </div>
  )
}
