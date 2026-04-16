'use client'

import { SessionType } from '@prisma/client'
import type { DragEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

const GRADES = [
  'K',
  'G1',
  'G2',
  'G3',
  'G4',
  'G5',
  'G6',
  'G7',
  'G8',
  'G9',
  'G10',
  'G11',
  'G12',
] as const

function gradeLabel(g: (typeof GRADES)[number]): string {
  if (g === 'K') return 'Kindergarten (K)'
  const n = g.replace(/^G/, '')
  return `Grade ${n}`
}

const INTERVENTION_OPTIONS: SessionType[] = [
  SessionType.intake_assessment,
  SessionType.behavioral_observation,
  SessionType.classroom_support,
  SessionType.emotional_regulation,
  SessionType.group_behavior_support,
  SessionType.peer_conflict_mediation,
  SessionType.check_in,
  SessionType.crisis,
]

const INTERVENTION_LABEL: Partial<Record<SessionType, string>> = {
  [SessionType.intake_assessment]: 'Intake assessment',
  [SessionType.behavioral_observation]: 'Behavioral observation',
  [SessionType.classroom_support]: 'Classroom support',
  [SessionType.emotional_regulation]: 'Emotional regulation',
  [SessionType.group_behavior_support]: 'Group behavior support',
  [SessionType.peer_conflict_mediation]: 'Peer conflict mediation',
  [SessionType.check_in]: 'Check-in',
  [SessionType.crisis]: 'Crisis',
}

type CounselorOption = { id: string; name: string; role: string }

/** Per-file metadata — same labels as Step 2 (referral form). */
type PendingFile = {
  id: string
  file: File
  referred_by: string
  brief_description: string
  referral_date: string
}

function isAllowedIntakeDoc(file: File): boolean {
  const n = file.name.toLowerCase()
  return n.endsWith('.pdf') || n.endsWith('.doc') || n.endsWith('.docx')
}

type Props = {
  open: boolean
  onClose: () => void
  counselors: CounselorOption[]
  onCreated: () => void
}

export function CreateStudentIntakeModal({
  open,
  onClose,
  counselors,
  onCreated,
}: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [grade, setGrade] = useState<(typeof GRADES)[number]>('G9')
  const [school, setSchool] = useState('')
  const [district, setDistrict] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [presentingProblem, setPresentingProblem] = useState('')
  const [intakeDate, setIntakeDate] = useState('')
  const [assignedCounselorId, setAssignedCounselorId] = useState('')
  const [schoolYear, setSchoolYear] = useState('')
  const [sessionFormat, setSessionFormat] = useState<'individual' | 'group'>('individual')
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

  const [referredBy, setReferredBy] = useState('')
  const [briefDescription, setBriefDescription] = useState('')
  const [referralDate, setReferralDate] = useState('')
  const [interventions, setInterventions] = useState<SessionType[]>([SessionType.check_in])

  const [includeConsent, setIncludeConsent] = useState(false)
  const [consentSchoolYear, setConsentSchoolYear] = useState('')
  const [parentName, setParentName] = useState('')
  const [consentDate, setConsentDate] = useState('')
  const [consentDistrict, setConsentDistrict] = useState('')
  const [consentSchool, setConsentSchool] = useState('')
  const [behavioristName, setBehavioristName] = useState('')

  const reset = useCallback(() => {
    setStep(1)
    setError(null)
    setFirstName('')
    setLastName('')
    setGrade('G9')
    setSchool('')
    setDistrict('')
    setReferralSource('')
    setPresentingProblem('')
    setIntakeDate('')
    setAssignedCounselorId('')
    setSchoolYear('')
    setSessionFormat('individual')
    setPendingFiles([])
    setReferredBy('')
    setBriefDescription('')
    setReferralDate('')
    setInterventions([SessionType.check_in])
    setIncludeConsent(false)
    setConsentSchoolYear('')
    setParentName('')
    setConsentDate('')
    setConsentDistrict('')
    setConsentSchool('')
    setBehavioristName('')
  }, [])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function toggleIntervention(t: SessionType) {
    setInterventions(prev => {
      if (prev.includes(t)) {
        const next = prev.filter(x => x !== t)
        return next.length ? next : [SessionType.check_in]
      }
      return [...prev, t]
    })
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    setError(null)
    const next: PendingFile[] = []
    let skippedWrongType = false
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.size > 10 * 1024 * 1024) continue
      if (!isAllowedIntakeDoc(file)) {
        skippedWrongType = true
        continue
      }
      next.push({
        id: `${file.name}-${i}-${Date.now()}`,
        file,
        referred_by: '',
        brief_description: '',
        referral_date: '',
      })
    }
    if (skippedWrongType && next.length === 0) {
      setError('Only PDF and Word documents (.pdf, .doc, .docx) are accepted, max 10MB each.')
    } else if (skippedWrongType) {
      setError('Some files were skipped (PDF or Word only).')
    }
    setPendingFiles(p => [...p, ...next])
  }

  function updatePending(
    id: string,
    field: 'referred_by' | 'brief_description' | 'referral_date',
    value: string
  ) {
    setPendingFiles(p =>
      p.map(row => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  function removePending(id: string) {
    setPendingFiles(p => p.filter(x => x.id !== id))
  }

  async function uploadIntakeFiles(studentId: string) {
    for (const row of pendingFiles) {
      const fd = new FormData()
      fd.append('file', row.file)
      if (row.referred_by.trim()) fd.append('referred_by', row.referred_by.trim())
      if (row.brief_description.trim()) fd.append('brief_description', row.brief_description.trim())
      if (row.referral_date.trim()) fd.append('referral_date', row.referral_date.trim())
      const res = await fetch(`/api/students/${studentId}/intake-files`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        throw new Error('upload')
      }
    }
  }

  async function saveStudent() {
    setLoading(true)
    setError(null)
    const loadingToast = toast.loading('Creating student...')

    const intakeIso = intakeDate ? new Date(`${intakeDate}T12:00:00`).toISOString() : ''

    const body: Record<string, unknown> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      grade,
      school: school.trim(),
      district: district.trim(),
      referral_source: referralSource.trim(),
      presenting_problem: presentingProblem.trim(),
      intake_date: intakeIso,
      session_format: sessionFormat,
      referral: {
        referred_by: referredBy.trim() || referralSource.trim(),
        brief_description: briefDescription.trim() || undefined,
        referral_date: referralDate
          ? new Date(`${referralDate}T12:00:00`).toISOString()
          : undefined,
        intervention_types: interventions,
        assigned_to: assignedCounselorId || undefined,
      },
    }

    if (assignedCounselorId) body.assigned_counselor_id = assignedCounselorId
    if (schoolYear.trim()) body.school_year = schoolYear.trim()

    if (includeConsent) {
      body.consent = {
        school_year: consentSchoolYear.trim(),
        parent_guardian_name: parentName.trim(),
        consent_date: consentDate
          ? new Date(`${consentDate}T12:00:00`).toISOString()
          : new Date().toISOString(),
        district: consentDistrict.trim(),
        school: consentSchool.trim(),
        behaviorist_name: behavioristName.trim(),
      }
    }

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        setError('Could not create student. Check required fields.')
        toast.error('Failed to create student')
        return
      }

      const json = (await res.json()) as {
        data: { student: { id: string } }
      }
      const studentId = json.data.student.id

      if (pendingFiles.length > 0) {
        try {
          await uploadIntakeFiles(studentId)
        } catch {
          setError('Student was created but one or more files failed to upload.')
          toast.error('Student created, but a file upload failed')
          onCreated()
          return
        }
      }

      toast.success('Student created')
      onCreated()
      onClose()
    } catch {
      setError('Something went wrong.')
      toast.error('Failed to create student')
    } finally {
      toast.dismiss(loadingToast)
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-0 md:p-4"
      role="presentation"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-none bg-[var(--surface-card)] shadow-2xl md:max-h-[90vh] md:rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intake-modal-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
          <div>
            <p className="os-caption">Step {step} of 3</p>
            <h2 id="intake-modal-title" className="os-heading">
              {step === 1 && 'Student identity'}
              {step === 2 && 'Referral details'}
              {step === 3 && 'Consent (optional)'}
            </h2>
          </div>
          <button type="button" className="os-btn-secondary text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault()
            if (step !== 3) return
            void saveStudent()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {step === 1 && (
              <div className="grid gap-3">
                <div>
                  <label className="os-label mb-1 block">First name</label>
                  <input
                    className="os-input"
                    placeholder="Legal first name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">Last name</label>
                  <input
                    className="os-input"
                    placeholder="Legal last name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">Grade level</label>
                  <p className="os-caption mb-1">
                    K = kindergarten. G1–G12 = first through twelfth grade (matches district coding).
                  </p>
                  <select
                    className="os-select"
                    value={grade}
                    onChange={e => setGrade(e.target.value as (typeof GRADES)[number])}
                    disabled={loading}
                  >
                    {GRADES.map(g => (
                      <option key={g} value={g}>
                        {gradeLabel(g)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="os-label mb-1 block">School</label>
                  <input
                    className="os-input"
                    placeholder="School name"
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">District</label>
                  <input
                    className="os-input"
                    placeholder="District name"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">Referral source</label>
                  <p className="os-caption mb-1">Who or what referred this student (e.g. admin, SST).</p>
                  <input
                    className="os-input"
                    placeholder="Referral source"
                    value={referralSource}
                    onChange={e => setReferralSource(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">Presenting problem</label>
                  <p className="os-caption mb-1">Primary reason for services at intake.</p>
                  <textarea
                    className="os-textarea"
                    placeholder="Presenting problem"
                    value={presentingProblem}
                    onChange={e => setPresentingProblem(e.target.value)}
                    required
                    disabled={loading}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">Intake date</label>
                  <p className="os-caption mb-1">Date this student entered Operation Scholars services.</p>
                  <input
                    type="date"
                    className="os-input"
                    value={intakeDate}
                    onChange={e => setIntakeDate(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">Assigned counselor (optional)</label>
                  <p className="os-caption mb-1">Caseload owner; leave unassigned if unknown.</p>
                  <select
                    className="os-select"
                    value={assignedCounselorId}
                    onChange={e => setAssignedCounselorId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Unassigned</option>
                    {counselors.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="os-label mb-1 block">School year (optional)</label>
                  <p className="os-caption mb-1">
                    Academic year in <strong>YYYY-YYYY</strong> form (e.g. 2025-2026).
                  </p>
                  <input
                    className="os-input"
                    placeholder="2025-2026"
                    value={schoolYear}
                    onChange={e => setSchoolYear(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">Default session format</label>
                  <p className="os-caption mb-1">
                    How counseling is usually delivered for this student (1:1 vs group). You can change per session later.
                  </p>
                  <select
                    className="os-select"
                    value={sessionFormat}
                    onChange={e =>
                      setSessionFormat(e.target.value as 'individual' | 'group')
                    }
                    disabled={loading}
                  >
                    <option value="individual">Individual (1:1)</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                <div>
                  <p className="os-label mb-2">Upload existing documents (optional)</p>
                  <p className="os-caption mb-2">
                    PDF or Word only. Add referral context per file (same fields as step 2) so the
                    profile matches your referral form.
                  </p>
                  <div
                    className="rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--surface-inner)] p-4 text-center"
                    onDragOver={e => e.preventDefault()}
                    onDrop={onDrop}
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      id="intake-file-input"
                      onChange={e => addFiles(e.target.files)}
                      disabled={loading}
                    />
                    <label htmlFor="intake-file-input" className="cursor-pointer os-body">
                      Click to upload or drag files here (.pdf, .doc, .docx — max 10MB each)
                    </label>
                  </div>
                  {pendingFiles.length > 0 && (
                    <ul className="mt-3 space-y-4">
                      {pendingFiles.map(p => (
                        <li
                          key={p.id}
                          className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-inner)] p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="os-body font-medium truncate">{p.file.name}</span>
                            <button
                              type="button"
                              className="os-caption shrink-0 text-[var(--color-error)]"
                              onClick={() => removePending(p.id)}
                              disabled={loading}
                            >
                              Remove
                            </button>
                          </div>
                          <p className="os-label mb-1">Referred by (optional)</p>
                          <input
                            className="os-input mb-2"
                            placeholder="Referred by"
                            value={p.referred_by}
                            onChange={e => updatePending(p.id, 'referred_by', e.target.value)}
                            disabled={loading}
                          />
                          <p className="os-label mb-1">Brief description (optional)</p>
                          <textarea
                            className="os-textarea mb-2"
                            placeholder="Brief description"
                            rows={2}
                            value={p.brief_description}
                            onChange={e =>
                              updatePending(p.id, 'brief_description', e.target.value)
                            }
                            disabled={loading}
                          />
                          <p className="os-label mb-1">Referral date (optional)</p>
                          <input
                            type="date"
                            className="os-input"
                            value={p.referral_date}
                            onChange={e => updatePending(p.id, 'referral_date', e.target.value)}
                            disabled={loading}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3">
                <p className="os-caption">
                  This step creates the formal referral record. It should align with the referral you
                  already captured on paper or in the SIS when possible.
                </p>
                <div>
                  <label className="os-label mb-1 block">Referred by</label>
                  <p className="os-caption mb-1">Defaults to referral source from step 1 if left blank.</p>
                  <input
                    className="os-input"
                    placeholder="Staff or team who made the referral"
                    value={referredBy}
                    onChange={e => setReferredBy(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">Brief description (optional)</label>
                  <p className="os-caption mb-1">Short summary of why the referral was made.</p>
                  <textarea
                    className="os-textarea"
                    placeholder="Brief description"
                    value={briefDescription}
                    onChange={e => setBriefDescription(e.target.value)}
                    disabled={loading}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="os-label mb-1 block">Referral date (optional)</label>
                  <p className="os-caption mb-1">Date the school or district initiated the referral.</p>
                  <input
                    type="date"
                    className="os-input"
                    value={referralDate}
                    onChange={e => setReferralDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <p className="os-label mb-1">Intervention types (select at least one)</p>
                  <p className="os-caption mb-2">
                    Types of support requested or in scope for this referral (drives reporting categories).
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {INTERVENTION_OPTIONS.map(t => (
                      <label key={t} className="flex items-start gap-2 os-body">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={interventions.includes(t)}
                          onChange={() => toggleIntervention(t)}
                          disabled={loading}
                        />
                        <span>{INTERVENTION_LABEL[t] ?? t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-3">
                <p className="os-caption">
                  Optional: capture signed consent for services if you have it at intake. Skip if you will
                  add consent later.
                </p>
                <label className="flex items-center gap-2 os-body">
                  <input
                    type="checkbox"
                    checked={includeConsent}
                    onChange={e => setIncludeConsent(e.target.checked)}
                    disabled={loading}
                  />
                  Add consent record now
                </label>
                {includeConsent && (
                  <>
                    <div>
                      <label className="os-label mb-1 block">Consent school year</label>
                      <p className="os-caption mb-1">Format <strong>YYYY-YYYY</strong> (e.g. 2025-2026).</p>
                      <input
                        className="os-input"
                        placeholder="2025-2026"
                        value={consentSchoolYear}
                        onChange={e => setConsentSchoolYear(e.target.value)}
                        required={includeConsent}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="os-label mb-1 block">Parent / guardian name</label>
                      <input
                        className="os-input"
                        placeholder="Name on the consent form"
                        value={parentName}
                        onChange={e => setParentName(e.target.value)}
                        required={includeConsent}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="os-label mb-1 block">Consent date</label>
                      <p className="os-caption mb-1">Date the consent was signed.</p>
                      <input
                        type="date"
                        className="os-input"
                        value={consentDate}
                        onChange={e => setConsentDate(e.target.value)}
                        required={includeConsent}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="os-label mb-1 block">District (on consent)</label>
                      <input
                        className="os-input"
                        placeholder="District"
                        value={consentDistrict}
                        onChange={e => setConsentDistrict(e.target.value)}
                        required={includeConsent}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="os-label mb-1 block">School (on consent)</label>
                      <input
                        className="os-input"
                        placeholder="School"
                        value={consentSchool}
                        onChange={e => setConsentSchool(e.target.value)}
                        required={includeConsent}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="os-label mb-1 block">Behaviorist name</label>
                      <p className="os-caption mb-1">Name printed on the consent as providing services.</p>
                      <input
                        className="os-input"
                        placeholder="Behaviorist name"
                        value={behavioristName}
                        onChange={e => setBehavioristName(e.target.value)}
                        required={includeConsent}
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {error && <p className="os-caption text-[var(--color-error)]">{error}</p>}
          </div>

          <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
            {step > 1 ? (
              <button
                type="button"
                className="os-btn-secondary"
                onClick={() => setStep(s => s - 1)}
                disabled={loading}
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              {step < 3 ? (
                <button
                  type="button"
                  className="os-btn-primary"
                  onClick={() => setStep(s => s + 1)}
                  disabled={loading}
                >
                  Next
                </button>
              ) : (
                <button type="submit" className="os-btn-primary" disabled={loading}>
                  {loading ? 'Saving…' : 'Create student'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
