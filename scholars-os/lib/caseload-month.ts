/**
 * Caseload report month is always `YYYY-MM` (calendar month).
 * Avoid `new Date('YYYY-MM-01')` — it parses as UTC midnight and shifts to the
 * previous calendar month in US timezones when formatted locally.
 */
export function parseCaseloadMonthToLocalDate(yyyyMm: string): Date {
  const [y, m] = yyyyMm.split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) {
    return new Date(NaN)
  }
  return new Date(y, m - 1, 1)
}

export function formatCaseloadMonthLabel(
  yyyyMm: string,
  locale: string = 'en-US'
): string {
  const d = parseCaseloadMonthToLocalDate(yyyyMm)
  if (Number.isNaN(d.getTime())) return yyyyMm
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

/**
 * Month bucket for the district sheet row — use UTC calendar month so the
 * session's stored `session_date` (ISO) matches the selected month in the export UI.
 */
export function reportMonthFromSessionDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * Inclusive UTC range for all instants that fall in calendar month `YYYY-MM`
 * (matches `reportMonthFromSessionDate` bucketing).
 */
export function caseloadMonthUtcRange(yyyyMm: string): { start: Date; end: Date } | null {
  const parts = yyyyMm.split('-')
  if (parts.length !== 2) return null
  const y = Number(parts[0])
  const m = Number(parts[1])
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null
  const monthIndex = m - 1
  const start = new Date(Date.UTC(y, monthIndex, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(y, monthIndex + 1, 0, 23, 59, 59, 999))
  return { start, end }
}
