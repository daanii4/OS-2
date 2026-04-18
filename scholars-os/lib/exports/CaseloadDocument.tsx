import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import type { Grade } from '@prisma/client'

const OLIVE = '#5C6B46'
const SLATE_DARK = '#0f172a'
const SLATE_MID = '#475569'
const SLATE_LIGHT = '#f1f5f9'
const SLATE_BORDER = '#e2e8f0'
const WHITE = '#ffffff'

function gradeDisplay(g: Grade | string): string {
  if (g === 'K') return 'K'
  return String(g).replace(/^G/, '')
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: SLATE_DARK,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: OLIVE,
  },
  headerLeft: { flexDirection: 'column' },
  orgName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: OLIVE,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reportTitle: { fontSize: 10, color: SLATE_MID, marginTop: 2 },
  headerRight: { flexDirection: 'column', alignItems: 'flex-end' },
  metaBadge: {
    backgroundColor: OLIVE,
    color: WHITE,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  metaSchool: { fontSize: 9, color: SLATE_MID, textAlign: 'right', marginTop: 4 },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: SLATE_LIGHT,
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: SLATE_BORDER,
    paddingHorizontal: 8,
  },
  statItemLast: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  statNumber: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: OLIVE },
  statLabel: {
    fontSize: 7,
    color: SLATE_MID,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: OLIVE,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    color: WHITE,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRowEven: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_BORDER,
    minHeight: 20,
  },
  tableRowOdd: {
    flexDirection: 'row',
    backgroundColor: SLATE_LIGHT,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_BORDER,
    minHeight: 20,
  },
  tableCell: { fontSize: 8, color: SLATE_DARK },
  tableCellMuted: { fontSize: 8, color: SLATE_MID },
  colName: { width: 110 },
  colGrade: { width: 30 },
  colDate: { width: 45 },
  colSession: { width: 45 },
  colProblem: { width: 155 },
  colFormat: { width: 45 },
  colClosed: { width: 40 },
  colNotes: { width: 110 },
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: OLIVE,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  totalsCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: WHITE },
  signatureSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: SLATE_BORDER,
  },
  signatureTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: SLATE_MID,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  signatureRow: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  signatureField: { flex: 1 },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: SLATE_DARK,
    marginBottom: 4,
    height: 24,
  },
  signatureLabel: { fontSize: 7, color: SLATE_MID },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: SLATE_BORDER,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: SLATE_MID },
  footerBrand: { fontSize: 7, color: OLIVE, fontFamily: 'Helvetica-Bold' },
})

const COLUMNS = [
  { label: 'Student Name', style: styles.colName },
  { label: 'Gr.', style: styles.colGrade },
  { label: 'Date', style: styles.colDate },
  { label: 'Session #', style: styles.colSession },
  { label: 'Presenting Problem', style: styles.colProblem },
  { label: 'Format', style: styles.colFormat },
  { label: 'Closed', style: styles.colClosed },
  { label: 'Notes', style: styles.colNotes },
] as const

export type CaseloadNoteRow = {
  id: string
  student_id: string
  student: { first_name: string; last_name: string; grade: Grade }
  date_seen: Date
  session_number: number
  presenting_problems: string[]
  session_format: string
  case_closed: boolean
  notes: string | null
}

export type CaseloadDocumentProps = {
  month: string
  school: string
  tenantName: string
  notes: CaseloadNoteRow[]
  summary: {
    totalStudents: number
    totalSessions: number
    totalIndivSessions: number
    totalGroupSessions: number
  }
}

export function CaseloadDocument({ month, school, tenantName, notes, summary }: CaseloadDocumentProps) {
  const generatedDate = format(new Date(), 'MMMM d, yyyy')
  const currentYear = new Date().getFullYear()

  return (
    <Document
      title={`${tenantName} Caseload Report — ${school} — ${month}`}
      author={tenantName}
      subject="Mental Health Student Caseload Report"
    >
      <Page size="LETTER" style={styles.page} orientation="landscape">
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.orgName}>{tenantName}</Text>
            <Text style={styles.reportTitle}>
              Mental Health Student Caseloads — {currentYear - 1}/{currentYear}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.metaBadge}>{month}</Text>
            <Text style={styles.metaSchool}>{school}</Text>
          </View>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summary.totalStudents}</Text>
            <Text style={styles.statLabel}>Students Seen</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summary.totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summary.totalIndivSessions}</Text>
            <Text style={styles.statLabel}>Individual</Text>
          </View>
          <View style={styles.statItemLast}>
            <Text style={styles.statNumber}>{summary.totalGroupSessions}</Text>
            <Text style={styles.statLabel}>Group</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            {COLUMNS.map(col => (
              <Text key={col.label} style={[styles.tableHeaderCell, col.style]}>
                {col.label}
              </Text>
            ))}
          </View>

          {notes.map((note, i) => {
            const rowStyle = i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
            const dateDisplay = format(new Date(note.date_seen), 'MM/dd')
            const problems = note.presenting_problems.join(', ')
            const formatDisplay = note.session_format === 'individual' ? 'Indiv' : 'Group'

            return (
              <View key={note.id} style={rowStyle} wrap={false}>
                <Text style={[styles.tableCell, styles.colName]}>
                  {note.student.last_name}, {note.student.first_name}
                </Text>
                <Text style={[styles.tableCell, styles.colGrade]}>
                  {gradeDisplay(note.student.grade)}
                </Text>
                <Text style={[styles.tableCell, styles.colDate]}>{dateDisplay}</Text>
                <Text style={[styles.tableCell, styles.colSession]}>{note.session_number}</Text>
                <Text style={[styles.tableCell, styles.colProblem]}>{problems}</Text>
                <Text style={[styles.tableCell, styles.colFormat]}>{formatDisplay}</Text>
                <Text style={[styles.tableCell, styles.colClosed]}>{note.case_closed ? 'Y' : ''}</Text>
                <Text style={[styles.tableCellMuted, styles.colNotes]}>{note.notes ?? ''}</Text>
              </View>
            )
          })}

          <View style={styles.totalsRow}>
            <Text style={[styles.totalsCell, styles.colName]}>TOTAL</Text>
            <Text style={[styles.totalsCell, styles.colGrade]} />
            <Text style={[styles.totalsCell, styles.colDate]} />
            <Text style={[styles.totalsCell, styles.colSession]}>{summary.totalSessions}</Text>
            <Text style={[styles.totalsCell, styles.colProblem]}>
              {summary.totalStudents} students seen this month
            </Text>
            <Text style={[styles.totalsCell, styles.colFormat]}>
              {summary.totalIndivSessions}I / {summary.totalGroupSessions}G
            </Text>
            <Text style={[styles.totalsCell, styles.colClosed]} />
            <Text style={[styles.totalsCell, styles.colNotes]} />
          </View>
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.signatureTitle}>Submission & Authorization</Text>
          <View style={styles.signatureRow}>
            {['Behaviorist Signature', 'Date Submitted', 'District Representative', 'Date Approved'].map(
              label => (
                <View key={label} style={styles.signatureField}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureLabel}>{label}</Text>
                </View>
              )
            )}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated {generatedDate} · Confidential — For District Use Only
          </Text>
          <Text style={styles.footerBrand}>{tenantName} · Operation Scholars OS</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
