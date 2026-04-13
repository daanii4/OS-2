'use client'

import { useEffect, useState } from 'react'

const TABS = ['Overview', 'Charts', 'AI', 'Incidents', 'Sessions', 'Plans'] as const

type Props = {
  overview: React.ReactNode
  charts: React.ReactNode
  ai: React.ReactNode
  incidents: React.ReactNode
  sessions: React.ReactNode
  plans: React.ReactNode
}

export function StudentSectionsClient({ overview, charts, ai, incidents, sessions, plans }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  // Always default true (SSR-safe). useEffect corrects to actual viewport post-hydration.
  const [isDesktop, setIsDesktop] = useState(true)

  const sections = [overview, charts, ai, incidents, sessions, plans]

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      {/* Mobile-only tab strip — hidden on lg+ */}
      <div
        className="sticky z-10 flex gap-1 overflow-x-auto py-2 px-4 lg:hidden"
        style={{
          top: 57,
          background: 'var(--surface-page)',
          borderBottom: '1px solid var(--border-default)',
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveIdx(i)}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={
              activeIdx === i
                ? { background: 'var(--olive-800)', color: '#fff' }
                : { background: 'transparent', color: 'var(--text-secondary)' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Mount exactly one branch to prevent hidden chart 0x0 renders */}
      {isDesktop ? (
        <div>
          {sections.map((section, i) => (
            <div key={i}>{section}</div>
          ))}
        </div>
      ) : (
        <div>{sections[activeIdx]}</div>
      )}
    </>
  )
}
