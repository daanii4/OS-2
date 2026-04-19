'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  BarChart3,
  LayoutList,
  PanelLeftClose,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { AnimatedMenuButton } from '@/components/ui/button'
import { SidebarUserMenu } from '@/components/layout/sidebar-user-menu'
import { EscalationReviewModal } from '@/components/ui/escalation-review-modal'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useLocalStorageBoolean } from '@/hooks/use-local-storage'
import { cn } from '@/lib/utils'

type Props = {
  profileName: string
  profileEmail: string
  profileRole: string
  showOrgNav: boolean
  escalatedStudentId: string | null
  escalatedStudentName: string | null
  escalationReason: string | null
  /** Desktop main column content (rendered inside the scrollable main).  */
  desktopChildren: ReactNode
  /** Mobile main column content (rendered below the mobile top bar). */
  mobileChildren: ReactNode
  /** Optional greeting line below the desktop title. */
  greetingChildren?: ReactNode
}

const NAV_SECTIONS = ['Main', 'Reports', 'Settings'] as const

type NavLinkItem = {
  href: string
  label: string
  icon: LucideIcon
  section: (typeof NAV_SECTIONS)[number]
  orgOnly?: boolean
}

const NAV_LINKS: NavLinkItem[] = [
  { href: '/dashboard', label: 'Your Students', icon: Users, section: 'Main' },
  {
    href: '/dashboard/students',
    label: 'Student Caseload',
    icon: LayoutList,
    section: 'Main',
  },
  {
    href: '/dashboard/analytics',
    label: 'Impact Overview',
    icon: BarChart3,
    section: 'Reports',
    orgOnly: true,
  },
  {
    href: '/settings/team',
    label: 'Team',
    icon: UsersRound,
    section: 'Settings',
    orgOnly: true,
  },
]

function normalizePath(pathname: string | null): string {
  if (!pathname) return ''
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname
}

function isNavActive(pathname: string | null, href: string): boolean {
  const p = normalizePath(pathname)
  if (!p) return false
  if (href === '/dashboard') return p === '/dashboard'
  return p === href || p.startsWith(`${href}/`)
}

function NavLinks({
  open,
  onLinkClick,
  showOrgNav,
  tooltipProvider = true,
}: {
  open: boolean
  onLinkClick: () => void
  showOrgNav: boolean
  tooltipProvider?: boolean
}) {
  const pathname = usePathname()
  const visibleLinks = NAV_LINKS.filter(l => !l.orgOnly || showOrgNav)
  let staggerIndex = 0

  const linkInner = (link: NavLinkItem, active: boolean, index: number) => {
    const Icon = link.icon
    return (
      <>
        <Icon
          size={15}
          aria-hidden
          className={cn('shrink-0', active ? 'opacity-100' : 'opacity-60')}
        />
        <span
          className={cn(
            'font-sans text-[12px] font-medium leading-none whitespace-nowrap',
            'transition-all duration-200 ease-out',
            open
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none w-0 -translate-x-2 overflow-hidden opacity-0'
          )}
          style={{ transitionDelay: open ? `${index * 30}ms` : '0ms' }}
        >
          {link.label}
        </span>
      </>
    )
  }

  const wrapLink = (link: NavLinkItem, active: boolean, index: number) => {
    const body = (
      <Link
        href={link.href}
        onClick={onLinkClick}
        className={cn(
          'mx-2 flex h-9 items-center gap-3 rounded-lg px-2.5 transition-all duration-150 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033] focus-visible:ring-offset-0 focus-visible:ring-offset-transparent',
          active
            ? 'bg-white/10 text-white'
            : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80',
          !open && 'mx-auto w-10 justify-center px-0'
        )}
      >
        {linkInner(link, active, index)}
      </Link>
    )

    if (!open && tooltipProvider) {
      return (
        <Tooltip key={link.href} delayDuration={200}>
          <TooltipTrigger asChild>{body}</TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            className="border-white/10"
          >
            {link.label}
          </TooltipContent>
        </Tooltip>
      )
    }
    return (
      <div key={link.href} className="contents">
        {body}
      </div>
    )
  }

  return (
    <>
      {NAV_SECTIONS.map(section => {
        const sectionLinks = visibleLinks.filter(l => l.section === section)
        if (sectionLinks.length === 0) return null
        return (
          <div key={section} className="mb-1">
            <p
              className={cn(
                'mb-1.5 mt-4 px-3 pb-1 pt-5 text-[8px] font-medium uppercase tracking-[0.08em] transition-opacity duration-200',
                open
                  ? 'opacity-100'
                  : 'pointer-events-none h-0 overflow-hidden opacity-0'
              )}
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              {section}
            </p>
            {sectionLinks.map(link => {
              const active = isNavActive(pathname, link.href)
              const idx = staggerIndex++
              return wrapLink(link, active, idx)
            })}
          </div>
        )
      })}
    </>
  )
}

export function DashboardLayout({
  profileName,
  profileEmail,
  profileRole,
  showOrgNav,
  escalatedStudentId,
  escalatedStudentName,
  escalationReason,
  desktopChildren,
  mobileChildren,
  greetingChildren,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useLocalStorageBoolean(
    'scholars-sidebar',
    true
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [escalationAcknowledged, setEscalationAcknowledged] = useState(false)
  const [showEscalationModal, setShowEscalationModal] = useState(false)

  // Close mobile menu when transitioning to desktop width.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const escalationBannerDesktop = escalatedStudentName &&
    !escalationAcknowledged ? (
    <div
      className="flex w-full min-w-0 shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
      style={{ background: '#DC2626', borderRadius: 0 }}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 flex-shrink-0 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <p className="min-w-0 text-[12px] font-medium leading-snug text-white sm:text-[13px]">
          Escalation Required — {escalatedStudentName} · AI flagged a safety
          concern requiring licensed clinician referral
        </p>
      </div>
      <button
        className="flex-shrink-0 rounded px-4 py-2 text-[12px] font-semibold transition-colors sm:text-[13px]"
        style={{ background: '#FFFFFF', color: '#DC2626', minHeight: 36 }}
        onClick={() => setShowEscalationModal(true)}
      >
        Acknowledge & Take Action
      </button>
    </div>
  ) : null

  const escalationBannerMobile = escalatedStudentName &&
    !escalationAcknowledged ? (
    <div
      className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3"
      style={{ background: '#DC2626', borderRadius: 0 }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 flex-shrink-0 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <p className="min-w-0 text-[12px] font-medium leading-snug text-white">
          Escalation — {escalatedStudentName}
        </p>
      </div>
      <button
        className="flex-shrink-0 rounded px-3 py-1.5 text-[12px] font-semibold"
        style={{ background: '#FFFFFF', color: '#DC2626', minHeight: 32 }}
        onClick={() => setShowEscalationModal(true)}
      >
        Acknowledge & Take Action
      </button>
    </div>
  ) : null

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[var(--surface-page)]">
      {/* ── Mobile top bar ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <AnimatedMenuButton
            open={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          />
          <div className="flex items-center gap-2">
            <div className="os-motif flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden bg-[var(--gold-500)]">
              <img
                src="/logo-mark.png"
                alt="Operation Scholars"
                className="h-[22px] w-[22px] object-contain"
              />
            </div>
            <span className="os-subhead text-[var(--text-primary)]">
              Operation Scholars
            </span>
          </div>
        </div>
        <Link href="/dashboard/students" className="os-btn-primary text-sm">
          + Log Session
        </Link>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
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
                      style={{
                        fontFamily: 'var(--font-dm-serif), Georgia, serif',
                      }}
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
                  <svg
                    viewBox="0 0 16 16"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto overflow-x-visible px-3 py-2">
              <NavLinks
                open
                onLinkClick={closeMobileMenu}
                showOrgNav={showOrgNav}
                tooltipProvider={false}
              />
            </nav>
            <div className="border-t border-white/[0.06] px-2 py-3">
              <SidebarUserMenu
                profileName={profileName}
                profileEmail={profileEmail}
                profileRole={profileRole}
                showOrgSettings={showOrgNav}
                expanded
              />
            </div>
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar (lg+) ── */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-white/[0.06] bg-[#2D3820] lg:flex',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          sidebarOpen ? 'w-60' : 'w-14'
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-white/[0.08] px-4',
            sidebarOpen ? 'justify-start gap-3' : 'justify-center px-2'
          )}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#D6A033]"
            style={{ minWidth: 36, minHeight: 36 }}
          >
            <img
              src="/logo-mark.png"
              alt=""
              className="h-7 w-7 object-contain"
            />
          </div>
          <div
            className={cn(
              'min-w-0 overflow-hidden transition-all duration-200 ease-out',
              sidebarOpen
                ? 'max-w-[180px] translate-x-0 opacity-100'
                : 'max-w-0 -translate-x-2 opacity-0'
            )}
          >
            <p
              className="text-[14px] font-normal leading-tight text-white"
              style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
            >
              Operation Scholars
            </p>
            <p
              className="mt-0.5 text-[8px] uppercase tracking-[0.1em]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Behavioral Intelligence
            </p>
          </div>
        </div>

        <TooltipProvider delayDuration={200}>
          <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-visible overscroll-y-contain px-0 py-2">
            <NavLinks
              open={sidebarOpen}
              onLinkClick={closeMobileMenu}
              showOrgNav={showOrgNav}
            />
          </nav>
        </TooltipProvider>

        <div className="flex shrink-0 flex-col gap-1 border-t border-white/[0.06] px-2 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className={cn(
              'flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-white/40 transition-all duration-150',
              'hover:bg-white/[0.06] hover:text-white/70',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033]',
              !sidebarOpen && 'mx-auto w-10 justify-center px-0'
            )}
          >
            <PanelLeftClose
              size={15}
              className={cn(
                'shrink-0 transition-transform duration-300',
                !sidebarOpen && 'rotate-180'
              )}
              aria-hidden
            />
            <span
              className={cn(
                'font-sans text-[12px] font-medium whitespace-nowrap transition-all duration-200',
                sidebarOpen
                  ? 'opacity-100'
                  : 'pointer-events-none w-0 overflow-hidden opacity-0'
              )}
            >
              Collapse
            </span>
          </button>

          <SidebarUserMenu
            profileName={profileName}
            profileEmail={profileEmail}
            profileRole={profileRole}
            showOrgSettings={showOrgNav}
            expanded={sidebarOpen}
          />
        </div>
      </aside>

      {/* ── Desktop main column ── */}
      <main
        className={cn(
          'hidden h-[100dvh] min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:flex',
          'w-full transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          sidebarOpen ? 'pl-60' : 'pl-14'
        )}
      >
        {escalationBannerDesktop}

        <div className="sticky top-0 z-10 min-w-0 shrink-0 border-b border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <h1 className="os-title">Your Students</h1>
                {greetingChildren}
              </div>
            </div>
            <div className="flex min-w-0 flex-shrink-0 flex-wrap items-center justify-end gap-2">
              <button className="os-btn-secondary">
                Export District Report
              </button>
              <Link href="/dashboard/students" className="os-btn-primary">
                + Log Session
              </Link>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4 px-4 pb-6 pt-6 sm:px-6">
          {desktopChildren}
        </div>
      </main>

      {/* ── Mobile main column ── */}
      <div className="min-w-0 overflow-x-hidden lg:hidden">
        {escalationBannerMobile}
        <div className="space-y-3 px-4 py-4">{mobileChildren}</div>
      </div>

      {escalatedStudentId && escalatedStudentName ? (
        <EscalationReviewModal
          open={showEscalationModal}
          studentId={escalatedStudentId}
          studentName={escalatedStudentName}
          escalationReason={escalationReason}
          onClose={() => setShowEscalationModal(false)}
          onEscalationResolved={() => {
            setEscalationAcknowledged(true)
          }}
        />
      ) : null}
    </div>
  )
}

/** Optional greeting line for owner/assistant — shown once per day per session. */
export function OwnerGreeting({
  profileName,
  profileRole,
  activeStudents,
}: {
  profileName: string
  profileRole: string
  activeStudents: number
}) {
  const ownerWelcomeGreeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const [show, setShow] = useState(false)
  useEffect(() => {
    if (profileRole !== 'owner' && profileRole !== 'assistant') return
    if (typeof window === 'undefined') return
    const key = `os2.dashboard.greeting.${new Date().toDateString()}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    // Defer setState past the effect's synchronous body — keeps lint clean
    // and avoids cascading renders flagged by react-hooks/set-state-in-effect.
    const id = window.setTimeout(() => setShow(true), 0)
    return () => window.clearTimeout(id)
  }, [profileRole])

  if (!show) return null
  const first = profileName.trim().split(' ').filter(Boolean)[0] ?? profileName

  return (
    <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
      {ownerWelcomeGreeting}, {first}. {activeStudents} students active today.
    </p>
  )
}
