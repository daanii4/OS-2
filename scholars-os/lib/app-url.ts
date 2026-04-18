/**
 * Public base URL for Supabase invite redirectTo and hrefs in transactional email.
 * Omit in Vercel: VERCEL_URL is used (works for *.vercel.app; set NEXT_PUBLIC_APP_URL for custom domain).
 * Not used for page routing — a wrong value does not make the app unreachable.
 */
export function getPublicAppUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    process.env.APP_URL?.replace(/\/$/, '')
  if (explicit) return explicit
  if (process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, '')
    return `https://${host}`
  }
  const port = process.env.PORT ?? '3000'
  return `http://127.0.0.1:${port}`
}
