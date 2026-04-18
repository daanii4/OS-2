/**
 * Public site URL for links in emails and invite redirects.
 * Prefer NEXT_PUBLIC_APP_URL (brief), then APP_URL, then Vercel preview URL.
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
