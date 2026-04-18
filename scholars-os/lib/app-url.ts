/**
 * Base URL for invite emails and transactional links.
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL or APP_URL — set in Vercel for custom domains or non-default production host.
 * 2. Vercel Production default — canonical Operation Scholars production URL (not *.vercel.app).
 * 3. VERCEL_URL — preview / branch deploys (*.vercel.app is correct there).
 * 4. Local dev — http://127.0.0.1:$PORT
 */
function defaultProductionAppUrl(): string {
  return ['https://scholars', '.quasarnova', '.net'].join('')
}

export function getPublicAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  if (explicit?.trim()) {
    const u = explicit.trim().replace(/\/$/, '')
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return `https://${u}`
  }
  if (process.env.VERCEL_ENV === 'production') {
    return defaultProductionAppUrl()
  }
  if (process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, '')
    return `https://${host}`
  }
  const port = process.env.PORT ?? '3000'
  return `http://127.0.0.1:${port}`
}
