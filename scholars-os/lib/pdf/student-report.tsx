import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

// ─── Colour tokens (mirrors globals.css design system) ────────────────────────
const OLIVE_800 = '#2a3221'
const OLIVE_600 = '#4a543f'
const OLIVE_300 = '#8fa37a'
const GOLD_500  = '#c9913d'
const GRAY_100  = '#f5f5f0'
const GRAY_300  = '#ddddd5'
const WHITE     = '#ffffff'
const RED       = '#c94a4a'
const GREEN     = '#3a7d44'

// Register a monospace family so numeric data renders consistently
Font.registerHyphenationCallback(word => [word])

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: WHITE,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 9,
    color: OLIVE_800,
    lineHeight: 1.5,
  },
  // ── header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: OLIVE_300,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: GOLD_500,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: OLIVE_800, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  orgName:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: OLIVE_800, marginTop: 4 },
  orgSub:   { fontSize: 8, color: OLIVE_600, marginTop: 1 },
  reportTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: OLIVE_800, textAlign: 'right' },
  reportMeta:  { fontSize: 8, color: OLIVE_600, textAlign: 'right', marginTop: 2 },
  // ── headline KPI row ──
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  /** Gold accent as a solid strip — avoid borderLeft (some PDF viewers draw it as a vertical streak across breaks). */
  kpiCardOuter: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: GRAY_100,
    borderRadius: 6,
    overflow: 'hidden',
  },
  kpiCardAccent: {
    width: 4,
    backgroundColor: GOLD_500,
  },
  kpiCardInner: {
    flex: 1,
    padding: 10,
  },
  kpiCardPlain: {
    flex: 1,
    backgroundColor: GRAY_100,
    borderRadius: 6,
    padding: 10,
  },
  kpiLabel: { fontSize: 7, color: OLIVE_600, textTransform: 'uppercase', letterSpacing: 0.6 },
  /** Explicit lineHeight + margin so large digits never collide with the trend line below (Yoga stacks Text tightly). */
  kpiValue: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: OLIVE_800,
    marginTop: 3,
    lineHeight: 26,
    marginBottom: 2,
  },
  kpiSub:   { fontSize: 7.5, color: OLIVE_600, marginTop: 2 },
  kpiGreen: { fontSize: 8, color: GREEN, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  kpiRed:   { fontSize: 8, color: RED, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  // ── section ──
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: OLIVE_800,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
    lineHeight: 1.35,
  },
  // ── inline bar chart ──
  /** minHeight must exceed value row + max bar + axis labels or Yoga overlays children (was height: 60 with bars up to 56px). */
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    minHeight: 92,
    marginBottom: 6,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 88,
  },
  chartBarValueSlot: {
    minHeight: 12,
    marginBottom: 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  /** Fixed width + min height — percentage widths collapse to hairlines at small counts in react-pdf. */
  chartBar: {
    width: 14,
    minHeight: 14,
    backgroundColor: OLIVE_300,
    borderRadius: 2,
    alignSelf: 'center',
  },
  chartBarLabel: {
    fontSize: 7.5,
    color: OLIVE_800,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  chartBarValue: { fontSize: 7, color: OLIVE_800, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  // ── two-column grid ──
  twoCol: { flexDirection: 'row', gap: 16 },
  col:    { flex: 1, paddingHorizontal: 2 },
  // ── table ──
  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: OLIVE_800,
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: GRAY_100,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
  },
  thText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: WHITE },
  tdText: { fontSize: 8, color: OLIVE_800 },
  tdMono: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: OLIVE_800 },
  // ── text utilities ──
  label:    { fontSize: 7, color: OLIVE_600, textTransform: 'uppercase', letterSpacing: 0.5 },
  body:     { fontSize: 8.5, color: OLIVE_800, lineHeight: 1.6 },
  bodyMed:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: OLIVE_800 },
  caption:  { fontSize: 7.5, color: OLIVE_600 },
  pill: {
    fontSize: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    color: GREEN,
    backgroundColor: '#e8f5eb',
  },
  pillRed: {
    fontSize: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    color: RED,
    backgroundColor: '#fdeaea',
  },
  // ── divider ──
  divider: { borderBottomWidth: 1, borderBottomColor: GRAY_300, marginVertical: 12 },
  // ── footer ──
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: GRAY_300,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: OLIVE_600 },
})

// ─── Types ───────────────────────────────────────────────────────────────────
export type Intervention = {
  intervention: string
  rationale: string
  source: { name: string; url: string }
}

export type StudentReportData = {
  student: {
    first_name: string
    last_name: string
    grade: string
    school: string
    district: string
    referral_source: string
    intake_date: Date
    session_format: string
    presenting_problem: string
    baseline_incident_count: number | null
    baseline_window_start: Date | null
    baseline_window_end: Date | null
  }
  currentIncidentCount: number        // last 30 days
  reductionPct: number | null         // vs baseline
  totalSessions: number
  attendedSessions: number
  avgGoalCompletionRate: number | null
  monthlyIncidents: { label: string; count: number }[]
  recentIncidents: {
    incident_date: Date
    incident_type: string
    severity: string
    reported_by: string
    suspension_days: number | null
  }[]
  activePlan: {
    goal_statement: string
    target_reduction_pct: number
    plan_duration_weeks: number
    focus_behaviors: string[]
    session_frequency: string
    status: string
  } | null
  latestAnalysis: {
    problem_analysis: string
    next_session_guide: string
    recommended_interventions: Intervention[]
    created_at: Date
  } | null
  generatedAt: Date
  generatedBy: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtType(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Inline bar chart (SVG-free, pure View/height) ───────────────────────────
function InlineBarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const barMaxH = 48
  return (
    <View style={styles.chartRow} wrap={false}>
      {data.map((d, i) => {
        const rawH = Math.round((d.count / max) * barMaxH)
        const barH = Math.max(14, rawH)
        return (
          <View key={i} style={styles.chartBarWrap}>
            <View style={styles.chartBarValueSlot}>
              <Text style={styles.chartBarValue}>{d.count}</Text>
            </View>
            <View style={[styles.chartBar, { height: barH }]} />
            <Text style={styles.chartBarLabel}>{d.label}</Text>
          </View>
        )
      })}
    </View>
  )
}

// ─── Document ────────────────────────────────────────────────────────────────
export function StudentReportDocument({ data }: { data: StudentReportData }) {
  const { student } = data

  return (
    <Document
      title={`Progress Report — ${student.first_name} ${student.last_name}`}
      author="Operation Scholars OS"
    >
      <Page size="LETTER" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>OS</Text>
              </View>
              <View>
                <Text style={styles.orgName}>Operation Scholars</Text>
                <Text style={styles.orgSub}>Behavioral Intelligence Platform</Text>
              </View>
            </View>
          </View>
          <View>
            <Text style={styles.reportTitle}>
              {student.first_name} {student.last_name}
            </Text>
            <Text style={styles.reportMeta}>
              Progress Report  ·  {fmtDate(data.generatedAt)}
            </Text>
            <Text style={styles.reportMeta}>
              Grade {student.grade}  ·  {student.school}  ·  {student.district}
            </Text>
            <Text style={styles.reportMeta}>Generated by {data.generatedBy}</Text>
          </View>
        </View>

        {/* ── Headline KPIs ── */}
        <View style={styles.kpiRow} wrap={false}>
          <View style={styles.kpiCardOuter}>
            <View style={styles.kpiCardAccent} />
            <View style={styles.kpiCardInner}>
              <Text style={styles.kpiLabel}>Baseline incidents</Text>
              <Text style={styles.kpiValue}>{student.baseline_incident_count ?? '—'}</Text>
              <Text style={styles.kpiSub}>
                {student.baseline_window_start && student.baseline_window_end
                  ? `${fmtDate(student.baseline_window_start)} – ${fmtDate(student.baseline_window_end)}`
                  : 'Baseline window not set'}
              </Text>
            </View>
          </View>

          <View style={styles.kpiCardPlain}>
            <Text style={styles.kpiLabel}>Current (30d)</Text>
            <Text style={styles.kpiValue}>{data.currentIncidentCount}</Text>
            {data.reductionPct !== null && (
              <Text style={data.reductionPct >= 0 ? styles.kpiGreen : styles.kpiRed}>
                {data.reductionPct >= 0
                  ? `↓ ${data.reductionPct}% reduction`
                  : `↑ ${Math.abs(data.reductionPct)}% increase`}
              </Text>
            )}
          </View>

          <View style={styles.kpiCardPlain}>
            <Text style={styles.kpiLabel}>Sessions</Text>
            <Text style={styles.kpiValue}>{data.totalSessions}</Text>
            <Text style={styles.kpiSub}>{data.attendedSessions} attended</Text>
          </View>

          <View style={styles.kpiCardPlain}>
            <Text style={styles.kpiLabel}>Avg goal rate</Text>
            <Text style={styles.kpiValue}>
              {data.avgGoalCompletionRate !== null
                ? `${Math.round(data.avgGoalCompletionRate)}%`
                : '—'}
            </Text>
            <Text style={styles.kpiSub}>Last 5 sessions</Text>
          </View>
        </View>

        {/* ── Incident frequency chart ── */}
        {data.monthlyIncidents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incident Frequency — Monthly</Text>
            <InlineBarChart data={data.monthlyIncidents} />
          </View>
        )}

        {/* ── Student profile + Presenting problem ── */}
        <View style={[styles.twoCol, { marginBottom: 18 }]}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Student Profile</Text>
            <View style={{ gap: 4 }}>
              {[
                ['Referral source', student.referral_source],
                ['Session format', fmtType(student.session_format)],
                ['Intake date', fmtDate(student.intake_date)],
              ].map(([label, value]) => (
                <View key={label} style={{ flexDirection: 'row', gap: 4 }}>
                  <Text style={[styles.caption, { width: 80 }]}>{label}</Text>
                  <Text style={styles.body}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Presenting Problem</Text>
            <Text style={styles.body}>{student.presenting_problem}</Text>
          </View>
        </View>

        {/* ── Active success plan ── */}
        {data.activePlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Success Plan</Text>
            <Text style={styles.body}>{data.activePlan.goal_statement}</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
              <Text style={styles.caption}>
                Target: <Text style={styles.bodyMed}>{data.activePlan.target_reduction_pct}% reduction</Text>
              </Text>
              <Text style={styles.caption}>
                Duration: <Text style={styles.bodyMed}>{data.activePlan.plan_duration_weeks} weeks</Text>
              </Text>
              <Text style={styles.caption}>
                Frequency: <Text style={styles.bodyMed}>{fmtType(data.activePlan.session_frequency)}</Text>
              </Text>
            </View>
            {data.activePlan.focus_behaviors.length > 0 && (
              <Text style={[styles.caption, { marginTop: 4 }]}>
                Focus: {data.activePlan.focus_behaviors.join(', ')}
              </Text>
            )}
          </View>
        )}

        {/* ── Recent incidents table ── */}
        {data.recentIncidents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Recent Incidents (last {data.recentIncidents.length})
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.thText, { flex: 1.2 }]}>Date</Text>
                <Text style={[styles.thText, { flex: 2 }]}>Type</Text>
                <Text style={[styles.thText, { flex: 1 }]}>Severity</Text>
                <Text style={[styles.thText, { flex: 1.5 }]}>Reported by</Text>
              </View>
              {data.recentIncidents.map((inc, i) => (
                <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                  <Text style={[styles.tdText, { flex: 1.2 }]}>{fmtDate(inc.incident_date)}</Text>
                  <Text style={[styles.tdText, { flex: 2 }]}>{fmtType(inc.incident_type)}</Text>
                  <Text style={[styles.tdMono, { flex: 1 }]}>{inc.severity}</Text>
                  <Text style={[styles.tdText, { flex: 1.5 }]}>{inc.reported_by}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── AI Analysis ── */}
        {data.latestAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              AI Analysis — {fmtDate(data.latestAnalysis.created_at)}
            </Text>

            <Text style={[styles.label, { marginBottom: 4 }]}>Problem analysis</Text>
            <Text style={styles.body}>{data.latestAnalysis.problem_analysis}</Text>

            <View style={styles.divider} />

            <Text style={[styles.label, { marginBottom: 4 }]}>Next session guide</Text>
            <Text style={styles.body}>{data.latestAnalysis.next_session_guide}</Text>

            {data.latestAnalysis.recommended_interventions?.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.label, { marginBottom: 6 }]}>Recommended interventions</Text>
                {data.latestAnalysis.recommended_interventions.slice(0, 3).map((item, i) => (
                  <View key={i} style={{ marginBottom: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: GOLD_500 }}>
                    <Text style={styles.bodyMed}>{item.intervention}</Text>
                    <Text style={[styles.body, { marginTop: 2 }]}>{item.rationale}</Text>
                    <Text style={[styles.caption, { marginTop: 2 }]}>
                      Source: {item.source.name}  ·  {item.source.url}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Operation Scholars OS  ·  CONFIDENTIAL — FERPA Protected Student Record
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  )
}
