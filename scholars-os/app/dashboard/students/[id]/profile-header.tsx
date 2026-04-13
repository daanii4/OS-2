import type { CSSProperties } from 'react'

type ProfileHeaderProps = {
  firstName: string
  lastName: string
  grade: string
  school: string
  district: string
  status: string
  referralSource: string
  intakeDate: string
  baselineIncidents: number | null
  currentIncidents: number
  totalSessions: number
  avgGoalRate: number | null
}

function getStatusBadgeStyle(status: string): CSSProperties {
  switch (status) {
    case 'active':
      return { background: 'rgba(92,107,70,0.18)', color: '#c8d6aa', border: '1px solid rgba(200,214,170,0.25)' }
    case 'graduated':
      return { background: 'rgba(214,160,51,0.18)', color: '#f0d898', border: '1px solid rgba(240,216,152,0.25)' }
    case 'escalated':
      return { background: 'rgba(220,38,38,0.18)', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.25)' }
    default:
      return { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.15)' }
  }
}

export function ProfileHeader({
  firstName,
  lastName,
  grade,
  school,
  district,
  status,
  referralSource,
  intakeDate,
  baselineIncidents,
  currentIncidents,
  totalSessions,
  avgGoalRate,
}: ProfileHeaderProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'var(--olive-800)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      {/* Gold left bar */}
      <div
        className="absolute left-0 top-0 h-full"
        style={{ width: 4, background: 'var(--gold-500)' }}
        aria-hidden="true"
      />

      {/* Decorative circles */}
      <div
        className="pointer-events-none absolute"
        style={{
          right: -60,
          bottom: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute"
        style={{
          right: 40,
          bottom: -120,
          width: 340,
          height: 340,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
        aria-hidden="true"
      />

      {/* Content — padded left to clear the gold bar */}
      <div className="pl-6 pr-5 pt-5 pb-0">
        {/* Identity row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: 'clamp(20px, 4vw, 26px)',
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
                color: '#ffffff',
              }}
            >
              {firstName} {lastName}
            </h1>
            <p
              className="mt-1"
              style={{
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Grade {grade} · {school} · {district}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-[var(--radius-sm)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em]"
              style={getStatusBadgeStyle(status)}
            >
              {status}
            </span>
            <span
              className="rounded-[var(--radius-sm)] px-2.5 py-1 text-[10px] font-medium"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
            >
              {referralSource}
            </span>
            <span
              className="rounded-[var(--radius-sm)] px-2.5 py-1 text-[10px] font-medium"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
            >
              Intake {new Date(intakeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="mt-4 grid grid-cols-2 gap-0 sm:grid-cols-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
        >
          {[
            {
              label: 'Baseline incidents',
              value: baselineIncidents !== null ? String(baselineIncidents) : '—',
              sub: 'at intake',
            },
            {
              label: 'Incidents (30d)',
              value: String(currentIncidents),
              sub: 'current period',
            },
            {
              label: 'Sessions total',
              value: String(totalSessions),
              sub: 'all time',
            },
            {
              label: 'Avg goal rate',
              value: avgGoalRate !== null ? `${avgGoalRate}%` : '—',
              sub: 'last 5 sessions',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="py-4 pr-4"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 4,
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-ibm-plex-mono), monospace',
                  fontSize: 20,
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                  color: '#ffffff',
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.30)',
                  marginTop: 4,
                }}
              >
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
