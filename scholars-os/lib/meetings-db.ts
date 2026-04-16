import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// meetings table — UI removed per client request April 2026, table retained for data safety
export type MeetingDelegate = PrismaClient['meeting']

/**
 * Dev / deploy safety: if `prisma generate` was not run after adding the Meeting model,
 * `prisma.meeting` is undefined and would throw. Callers must handle `null`.
 */
export function getMeetingDelegate(): MeetingDelegate | null {
  const m = (prisma as unknown as { meeting?: MeetingDelegate }).meeting
  return m ?? null
}

export async function safeMeetingFindMany<T extends Prisma.MeetingFindManyArgs>(
  args: T
): Promise<Prisma.MeetingGetPayload<T>[]> {
  const d = getMeetingDelegate()
  if (!d) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[meetings-db] Missing `meeting` delegate — run: npx prisma generate && npx prisma migrate deploy'
      )
    }
    return []
  }
  return d.findMany(args) as Promise<Prisma.MeetingGetPayload<T>[]>
}

export async function safeMeetingFindFirst<T extends Prisma.MeetingFindFirstArgs>(
  args: T
): Promise<Prisma.MeetingGetPayload<T> | null> {
  const d = getMeetingDelegate()
  if (!d) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[meetings-db] Missing `meeting` delegate — run: npx prisma generate && npx prisma migrate deploy'
      )
    }
    return null
  }
  return d.findFirst(args) as Promise<Prisma.MeetingGetPayload<T> | null>
}
