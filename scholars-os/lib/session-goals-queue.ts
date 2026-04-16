const key = (studentId: string) => `os-pending-session-goals:${studentId}`

/**
 * Queue a session goal string from the AI Plan of Action panel. Consumed when
 * the Log session form mounts (Sessions tab).
 */
export function queueSessionGoal(studentId: string, goal: string): void {
  if (typeof window === 'undefined') return
  const trimmed = goal.trim()
  if (!trimmed) return
  const prev = JSON.parse(sessionStorage.getItem(key(studentId)) || '[]') as string[]
  if (prev.includes(trimmed)) return
  sessionStorage.setItem(key(studentId), JSON.stringify([...prev, trimmed]))
}

export function takeQueuedSessionGoals(studentId: string): { goal: string; met: boolean }[] {
  if (typeof window === 'undefined') return []
  const raw = sessionStorage.getItem(key(studentId))
  sessionStorage.removeItem(key(studentId))
  if (!raw) return []
  try {
    const goals = JSON.parse(raw) as string[]
    return goals.map(g => ({ goal: g, met: false }))
  } catch {
    return []
  }
}
