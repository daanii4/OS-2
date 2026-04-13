import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getDatabaseHost(): string {
  const url = process.env.DATABASE_URL
  if (!url) return 'missing'

  try {
    return new URL(url).hostname
  } catch {
    return 'invalid'
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Never log 'query' — queries may contain student data
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

if (process.env.NODE_ENV === 'production') {
  console.error('[prisma/init] runtime DATABASE_URL host', {
    dbHost: getDatabaseHost(),
  })
}
