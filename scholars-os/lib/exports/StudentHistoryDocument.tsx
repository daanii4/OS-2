import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import type { SessionType, SessionFormat } from '@prisma/client'

const OLIVE = '#5C6B46'
const SLATE_DARK = '#0f172a'
const SLATE_MID = '#475569'
const SLATE_LIGHT = '#f1f5f9'
const SLATE_BORDER = '#e2e8f0'
const WHITE = '#ffffff'

const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  intake_assessment: 'Intake assessment',
  behavioral_observation: 'Behavioral observation',
  classroom_support: 'Classroom support',
  emotional_regulation: 'Emotional regulation',
  group_behavior_support: 'Group behavior support',
  peer_conflict_mediation: 'Peer conflict mediation',
  check_in: 'Check-in',
  crisis: 'Crisis',
}

function sessionTypeLabel(t: SessionType): string {
  return SESSION_TYPE_LABEL[t] ?? t
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
  headerCard: {
    borderWidth: 1,
    borderColor: SLATE_BORDER,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    backgroundColor: SLATE_LIGHT,
  },
  studentName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: OLIVE, marginBottom: 8 },
  metaLine: { fontSize: 9, color: SLATE_MID, marginBottom: 3 },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: SLATE_LIGHT,
    borderRadius: 6,
    padding: 10,
    paddingTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: SLATE_BORDER,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: SLATE_BORDER,
    paddingHorizontal: 6,
  },
  statItemLast: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  statNumber: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: OLIVE,
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 8,
    color: SLATE_MID,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: OLIVE,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: OLIVE,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  th: { color: WHITE, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  rowEven: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_BORDER,
  },
  rowOdd: {
    flexDirection: 'row',
    backgroundColor: SLATE_LIGHT,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_BORDER,
  },
  cell: { fontSize: 7.5, color: SLATE_DARK },
  cellMuted: { fontSize: 7.5, color: SLATE_MID },
  colDate: { width: 52 },
  colType: { width: 100 },
  colFmt: { width: 42 },
  colDur: { width: 36 },
  colGoals: { width: 52 },
  colPct: { width: 38 },
  colSum: { width: 148 },
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

function truncateSummary(text: string | null, max = 120): string {
  if (!text) return ''
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export type StudentHistorySessionRow = {
  session_date: Date
  session_type: SessionType
  session_format: SessionFormat
  duration_minutes: number
  goals_met: number | null
  goals_attempted: number | null
  goal_completion_rate: number | null
  session_summary: string | null
}

export type StudentHistoryDocumentProps = {
  student: {
    first_name: string
    last_name: string
    grade: string
    school: string
    district: string | null
    intake_date: Date
  }
  sessions: StudentHistorySessionRow[]
  incidentCount: number
  dateRange: { from: string | null; to: string | null }
  tenantName: string
}

export function StudentHistoryDocument({
  student,
  sessions,
  incidentCount,
  dateRange,
  tenantName,
}: StudentHistoryDocumentProps) {
  const generatedDate = format(new Date(), 'MMMM d, yyyy')
  const rangeLabel =
    dateRange.from && dateRange.to
      ? `${dateRange.from} to ${dateRange.to}`
      : dateRange.from
        ? `From ${dateRange.from}`
        : dateRange.to
          ? `Through ${dateRange.to}`
          : 'All dates'

  const attended = sessions.length
  const rates = sessions.filter(s => s.goal_completion_rate !== null)
  const avgGoal =
    rates.length > 0
      ? rates.reduce((s, x) => s + (x.goal_completion_rate ?? 0), 0) / rates.length
      : null

  return (
    <Document
      title={`Session history — ${student.last_name}, ${student.first_name}`}
      author={tenantName}
      subject="Student session history (internal)"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerCard}>
          <Text style={styles.studentName}>
            {student.first_name} {student.last_name}
          </Text>
          <Text style={styles.metaLine}>Grade {student.grade} · {student.school}</Text>
          {student.district ? <Text style={styles.metaLine}>District: {student.district}</Text> : null}
          <Text style={styles.metaLine}>
            Intake: {format(new Date(student.intake_date), 'MMM d, yyyy')}
          </Text>
          <Text style={styles.metaLine}>Export range: {rangeLabel}</Text>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sessions (attended)</Text>
            <Text style={styles.statNumber}>{attended}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg goal completion</Text>
            <Text style={styles.statNumber}>
              {avgGoal !== null ? `${avgGoal.toFixed(0)}%` : '—'}
            </Text>
          </View>
          <View style={styles.statItemLast}>
            <Text style={styles.statLabel}>Incidents (period)</Text>
            <Text style={styles.statNumber}>{incidentCount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Session log</Text>

        <View style={{ width: '100%' }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDate]}>Date</Text>
            <Text style={[styles.th, styles.colType]}>Type</Text>
            <Text style={[styles.th, styles.colFmt]}>Format</Text>
            <Text style={[styles.th, styles.colDur]}>Min</Text>
            <Text style={[styles.th, styles.colGoals]}>Goals</Text>
            <Text style={[styles.th, styles.colPct]}>Goals %</Text>
            <Text style={[styles.th, styles.colSum]}>Summary preview</Text>
          </View>

          {sessions.map((sess, i) => {
            const row = i % 2 === 0 ? styles.rowEven : styles.rowOdd
            const goals =
              sess.goals_attempted != null && sess.goals_met != null
                ? `${sess.goals_met}/${sess.goals_attempted}`
                : '—'
            const pct =
              sess.goal_completion_rate != null ? `${sess.goal_completion_rate.toFixed(0)}%` : '—'
            const fmt = sess.session_format === 'individual' ? 'Indiv' : 'Group'

            return (
              <View key={i} style={row} wrap={false}>
                <Text style={[styles.cell, styles.colDate]}>
                  {format(new Date(sess.session_date), 'MM/dd/yy')}
                </Text>
                <Text style={[styles.cell, styles.colType]}>{sessionTypeLabel(sess.session_type)}</Text>
                <Text style={[styles.cell, styles.colFmt]}>{fmt}</Text>
                <Text style={[styles.cell, styles.colDur]}>{sess.duration_minutes}</Text>
                <Text style={[styles.cell, styles.colGoals]}>{goals}</Text>
                <Text style={[styles.cell, styles.colPct]}>{pct}</Text>
                <Text style={[styles.cellMuted, styles.colSum]}>
                  {truncateSummary(sess.session_summary)}
                </Text>
              </View>
            )
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated {generatedDate} · Confidential — internal case review only
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
