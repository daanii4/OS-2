/**
 * Remove duplicate demo students (same first + last name, same tenant) after accidental
 * double seed. Keeps the oldest row (first created_at) per name pair.
 *
 * Run: npx tsx prisma/dedupe-duplicate-students.ts
 *
 * Dev only — review before running on production.
 */
import 'dotenv/config'

import { PrismaClient, type Prisma } from '@prisma/client'

const prisma = new PrismaClient()
const TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? 'demarieya'

async function deleteStudentAndRelations(tx: Prisma.TransactionClient, studentId: string) {
  await tx.behavioralIncident.deleteMany({ where: { student_id: studentId } })
  await tx.aiAnalysis.deleteMany({ where: { student_id: studentId } })
  await tx.successPlan.deleteMany({ where: { student_id: studentId } })
  await tx.referral.deleteMany({ where: { student_id: studentId } })
  await tx.consentRecord.deleteMany({ where: { student_id: studentId } })
  await tx.studentStatusLog.deleteMany({ where: { student_id: studentId } })
  await tx.meeting.deleteMany({ where: { student_id: studentId } })
  await tx.mentalHealthNote.deleteMany({ where: { student_id: studentId } })
  await tx.session.deleteMany({ where: { student_id: studentId } })
  await tx.student.delete({ where: { id: studentId } })
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } })
  if (!tenant) {
    throw new Error(`No tenant with slug "${TENANT_SLUG}"`)
  }

  const students = await prisma.student.findMany({
    where: { tenant_id: tenant.id },
    orderBy: { created_at: 'asc' },
    select: { id: true, first_name: true, last_name: true, created_at: true },
  })

  const byName = new Map<string, typeof students>()
  for (const s of students) {
    const key = `${s.first_name}\n${s.last_name}`
    if (!byName.has(key)) byName.set(key, [])
    byName.get(key)!.push(s)
  }

  let removed = 0
  for (const [, rows] of byName) {
    if (rows.length <= 1) continue
    const duplicates = rows.slice(1)
    for (const dup of duplicates) {
      await prisma.$transaction(async tx => {
        await deleteStudentAndRelations(tx, dup.id)
      })
      removed += 1
      console.log(`Removed duplicate: ${dup.first_name} ${dup.last_name} (${dup.id})`)
    }
  }

  const remaining = await prisma.student.count({ where: { tenant_id: tenant.id } })
  console.log(`\nDone. Removed ${removed} duplicate(s). Students for tenant: ${remaining}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
