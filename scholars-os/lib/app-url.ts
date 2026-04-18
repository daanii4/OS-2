/**
 * Base URL for invite emails and transactional links.
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL or APP_URL — set this in Vercel to your **production** or **preview**
 *    canonical hostname. Without it, Vercel sets
 *    VERCEL_URL to an internal *.vercel.app host, which is what users see in emails.
 * 2. VERCEL_URL — deployment host (often *.vercel.app)
 * 3. Local dev — http://127.0.0.1:$PORT
 */
export function getPublicAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  if (explicit?.trim()) {
    const u = explicit.trim().replace(/\/$/, '')
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `https://${u}`
  }
  if (process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, '')
    return `https://${host}`
  }
  const port = process.env.PORT ?? '3000'
  return `http://127.0.0.1:${port}`
}
