'use client'

import { useCallback, useState } from 'react'

function readSidebarOpen(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === 'true') return true
    if (raw === 'false') return false
    if (key === 'scholars-sidebar') {
      const legacy = window.localStorage.getItem('os2.sidebar.open')
      if (legacy === '0') return false
      if (legacy === '1') return true
    }
  } catch {
    /* ignore */
  }
  return defaultValue
}

/**
 * Persisted boolean for sidebar open state (`scholars-sidebar` key per brief).
 */
export function useLocalStorageBoolean(
  key: string,
  defaultValue: boolean
): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] {
  const [state, setState] = useState(() => readSidebarOpen(key, defaultValue))

  const setValue = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setState(prev => {
        const next = typeof value === 'function' ? value(prev) : value
        try {
          window.localStorage.setItem(key, next ? 'true' : 'false')
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [key]
  )

  return [state, setValue]
}
