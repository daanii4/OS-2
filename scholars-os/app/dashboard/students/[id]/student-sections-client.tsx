'use client'

import { useEffect, useState } from 'react'

/** Order: Sessions → Incidents → Overview → Charts → AI → Plans (last). */
const TABS = ['Sessions', 'Incidents', 'Overview', 'Charts', 'AI', 'Plans'] as const

type Props = {
  sessions: React.ReactNode
  incidents: React.ReactNode
  overview: React.ReactNode
  charts: React.ReactNode
  ai: React.ReactNode
  plans: React.ReactNode
}

export function StudentSectionsClient({
  sessions,
  incidents,
  overview,
  charts,
  ai,
  plans,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isDesktop, setIsDesktop] = useState(true)

  const sections = [sessions, incidents, overview, charts, ai, plans]

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
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
            type="button"
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
