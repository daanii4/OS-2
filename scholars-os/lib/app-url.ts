/**
 * Base URL for Supabase invite redirectTo and links in transactional email.
 * Uses VERCEL_URL on Vercel (no custom env). Local dev: http://127.0.0.1:$PORT
 */
export function getPublicAppUrl(): string {
  if (process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, '')
    return `https://${host}`
  }
  const port = process.env.PORT ?? '3000'
  return `http://127.0.0.1:${port}`
}
