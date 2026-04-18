'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HelpCircle, LogOut, Settings, SlidersHorizontal, Building2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OS_PUBLIC_CONTACT_EMAIL } from '@/lib/brand-contact'
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon'
import { cn } from '@/lib/utils'

type Props = {
  profileName: string
  profileEmail: string
  profileRole: string
  /** Owner / assistant — show org settings link */
  showOrgSettings: boolean
  /** When false, hide name column (collapsed sidebar) — still show icon button */
  expanded: boolean
}

export function SidebarUserMenu({
  profileName,
  profileEmail,
  profileRole,
  showOrgSettings,
  expanded,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }, [router])

  const roleLabel =
    profileRole === 'owner'
      ? 'Owner'
      : profileRole === 'assistant'
        ? 'Assistant'
        : profileRole === 'counselor'
          ? 'Counselor'
          : profileRole

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-1',
          !expanded && 'justify-center px-0'
        )}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#3D4A2A] font-sans text-[11px] font-semibold text-white"
          style={{ borderRadius: 6 }}
          aria-hidden
        >
          {profileName.trim().charAt(0).toUpperCase() || '?'}
        </div>

        {expanded ? (
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-[12px] font-medium leading-tight text-white">{profileName}</p>
            <p
              className="truncate font-sans text-[10px] uppercase leading-tight tracking-[0.08em]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {roleLabel}
            </p>
          </div>
        ) : null}

        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors',
              'hover:bg-white/[0.08] hover:text-[#D6A033]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033]',
              open && 'bg-white/[0.08] text-[#D6A033]'
            )}
            aria-label="Account menu"
            aria-expanded={open}
          >
            <MenuToggleIcon open={open} className="h-[18px] w-[18px]" duration={320} />
          </button>
        </DropdownMenu.Trigger>
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="end"
          sideOffset={8}
          className={cn(
            'z-[200] min-w-[240px] overflow-hidden rounded-xl border border-white/[0.08]',
            'bg-[#1e2517] py-1 shadow-xl'
          )}
        >
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <p className="truncate font-sans text-[11px] text-white/45" title={profileEmail}>
              {profileEmail}
            </p>
          </div>

          <div className="py-1">
            <DropdownMenu.Item asChild>
              <Link
                href="/settings/account"
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 font-sans text-[13px] text-white/90 outline-none hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4 shrink-0 text-white/55" aria-hidden />
                Settings
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/settings/preferences"
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 font-sans text-[13px] text-white/90 outline-none hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
                onClick={() => setOpen(false)}
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-white/55" aria-hidden />
                Preferences
              </Link>
            </DropdownMenu.Item>
            {showOrgSettings ? (
              <DropdownMenu.Item asChild>
                <Link
                  href="/settings/organization"
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 font-sans text-[13px] text-white/90 outline-none hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
                  onClick={() => setOpen(false)}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-white/55" aria-hidden />
                  Organization
                </Link>
              </DropdownMenu.Item>
            ) : null}
            <DropdownMenu.Item asChild>
              <a
                href={`mailto:${OS_PUBLIC_CONTACT_EMAIL}?subject=${encodeURIComponent('Operation Scholars OS — help')}`}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 font-sans text-[13px] text-white/90 outline-none hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
              >
                <HelpCircle className="h-4 w-4 shrink-0 text-white/55" aria-hidden />
                Get help
              </a>
            </DropdownMenu.Item>
          </div>

          <div className="border-t border-white/[0.06] py-1">
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 font-sans text-[13px] text-white/90 outline-none hover:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]"
              onSelect={e => {
                e.preventDefault()
                void handleLogout()
              }}
            >
              <LogOut className="h-4 w-4 shrink-0 text-white/55" aria-hidden />
              Log out
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
