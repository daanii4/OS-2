import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/**
 * Returns the DATABASE_URL with `connection_limit` raised to a minimum of
 * `min` when the URL targets a pgbouncer pool (`pgbouncer=true`). Without
 * this, the default `connection_limit=1` we ship in the pooler URL forces
 * every parallel Prisma query (Suspense fan-out, Promise.all, etc.) to
 * queue behind one connection until the 10s pool timeout fires (P2024).
 *
 * Direct-host URLs are returned untouched — Prisma manages those connections
 * and we don't want to silently raise the cap on the actual database.
 */
function tunedDatabaseUrl(min: number): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return raw
  }

  const isPgBouncer = url.searchParams.get('pgbouncer') === 'true'
  if (!isPgBouncer) return raw

  const current = Number(url.searchParams.get('connection_limit') ?? '0')
  if (current >= min) return raw

  url.searchParams.set('connection_limit', String(min))
  return url.toString()
}

function makePrisma(): PrismaClient {
  const url = tunedDatabaseUrl(10)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(url ? { datasourceUrl: url } : {}),
  })
}

export const prisma = globalForPrisma.prisma ?? makePrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
