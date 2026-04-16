import type { Grade, MentalHealthNote, Student } from '@prisma/client'

export type MentalHealthNoteWithStudent = MentalHealthNote & {
  student: Pick<Student, 'first_name' | 'last_name' | 'grade'>
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function gradeToCaseloadExport(grade: Grade): string {
  if (grade === 'K') return 'K'
  return grade.replace(/^G/, '')
}

export function formatDateSeenMmDd(d: Date): string {
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${String(m).padStart(2, '0')}/${String(day).padStart(2, '0')}`
}

export function displayMonthFromYyyyMm(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  if (!y || !m) return yyyyMm
  const dt = new Date(y, m - 1, 1)
  return dt.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

export function buildCaseloadCsv(notes: MentalHealthNoteWithStudent[], monthParam: string): string {
  const displayMonth = displayMonthFromYyyyMm(monthParam)
  const header = [
    'Student Name',
    'Grade',
    'Date Seen',
    'Session #',
    'Presenting Problem',
    'Indiv / Group',
    'Case Closed',
    'Notes',
  ].join(',')

  const rows = notes.map(n => {
    const name = `${n.student.first_name} ${n.student.last_name}`
    const present = n.presenting_problems.join(', ')
    return [
      escapeCsvCell(name),
      escapeCsvCell(gradeToCaseloadExport(n.student.grade)),
      escapeCsvCell(formatDateSeenMmDd(n.date_seen)),
      String(n.session_number),
      escapeCsvCell(present),
      n.session_format === 'individual' ? 'Indiv' : 'Group',
      n.case_closed ? 'X' : '',
      escapeCsvCell(n.notes ?? ''),
    ].join(',')
  })

  const schoolLine = `School: ${notes[0]?.school ?? ''}`
  const monthLine = `Month Of: ${displayMonth}`

  return [monthLine, schoolLine, header, ...rows].join('\n')
}
