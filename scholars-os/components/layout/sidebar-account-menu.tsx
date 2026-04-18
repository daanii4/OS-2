'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { OS_PUBLIC_CONTACT_EMAIL } from '@/lib/brand-contact'

export function SidebarAccountMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div ref={wrapRef} className="relative flex flex-shrink-0 items-center">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="os-btn-icon rounded-md text-white/50 hover:bg-white/[0.08] hover:text-white"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute bottom-full right-0 z-[60] mb-2 min-w-[200px] rounded-lg border border-white/10 bg-[var(--olive-700)] py-1 shadow-lg"
          role="menu"
        >
          <Link
            href="/settings/account"
            role="menuitem"
            className="block px-3 py-2 text-[13px] text-white/90 hover:bg-white/[0.08]"
            onClick={() => setOpen(false)}
          >
            OS Settings
          </Link>
          <a
            href={`mailto:${OS_PUBLIC_CONTACT_EMAIL}?subject=Operation%20Scholars%20OS`}
            role="menuitem"
            className="block px-3 py-2 text-[13px] text-white/90 hover:bg-white/[0.08]"
            onClick={() => setOpen(false)}
          >
            Contact us
          </a>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-[13px] text-white/90 hover:bg-white/[0.08]"
            onClick={() => {
              setOpen(false)
              void handleLogout()
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
