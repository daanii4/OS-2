export type IncidentType =
  | 'office_referral'
  | 'suspension_iss'
  | 'suspension_oss'
  | 'teacher_referral'
  | 'behavioral_incident'
  | 'other'

export type IncidentSeverity = 'low' | 'medium' | 'high'

export interface Incident {
  id: string
  student_id: string
  incident_type: IncidentType
  incident_date: string
  severity: IncidentSeverity
  description: string | null
  reported_by: string
  suspension_days: number | null
  logged_by: string
  created_at: string
}

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  office_referral: 'Office Referral',
  suspension_iss: 'Suspension — ISS',
  suspension_oss: 'Suspension — OSS',
  teacher_referral: 'Teacher Referral',
  behavioral_incident: 'Behavioral Incident',
  other: 'Other',
}

export const SEVERITY_CONFIG = {
  low: {
    label: 'Low',
    dotColor: '#16a34a',
    badgeBg: '#f0fdf4',
    badgeBorder: '#bbf7d0',
    badgeText: '#16a34a',
    labelBg: '#f0fdf4',
    labelBorder: '#86efac',
    labelText: '#16a34a',
  },
  medium: {
    label: 'Medium',
    dotColor: '#b45309',
    badgeBg: '#fffbeb',
    badgeBorder: '#fde68a',
    badgeText: '#b45309',
    labelBg: '#fffbeb',
    labelBorder: '#fde68a',
    labelText: '#b45309',
  },
  high: {
    label: 'High',
    dotColor: '#dc2626',
    badgeBg: '#fef2f2',
    badgeBorder: '#fecaca',
    badgeText: '#dc2626',
    labelBg: '#fef2f2',
    labelBorder: '#fecaca',
    labelText: '#dc2626',
  },
} as const
