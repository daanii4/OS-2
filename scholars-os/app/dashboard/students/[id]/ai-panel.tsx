'use client'

import { useCallback, useEffect, useState } from 'react'
import { parsePlanOfAction } from '@/lib/ai/validation'
import { PlanOfActionPanel } from './plan-of-action'

type Intervention = {
  intervention: string
  rationale: string
  source: { name: string; url: string }
}

type Analysis = {
  id: string
  triggered_by: string
  problem_analysis: string
  next_session_guide: string
  recommended_interventions: Intervention[]
  plan_of_action: unknown
  escalation_flag: boolean
  escalation_reason: string | null
  counselor_action: string
  counselor_notes: string | null
  created_at: string
}

type AIPanelProps = {
  studentId: string
  escalationActive: boolean
}

const triggerLabels: Record<string, string> = {
  new_session: 'After session',
  new_incident: 'After incident',
  plan_creation: 'Plan created',
  milestone_missed: 'Milestone missed',
  counselor_request: 'Counselor asked',
  regression_alert: 'Regression alert',
}

export function AIPanel({ studentId, escalationActive }: AIPanelProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Ask AI state
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)

  // Escalation acknowledge state
  const [escalationNote, setEscalationNote] = useState('')
  const [acknowledging, setAcknowledging] = useState(false)
  const [ackError, setAckError] = useState<string | null>(null)
  const [isEscalated, setIsEscalated] = useState(escalationActive)

  const fetchAnalyses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/students/${studentId}/ai`)
      if (!res.ok) return
      const json = await res.json()
      const data = json.data as Analysis[]
      setAnalyses(data)
      if (data.length > 0) setExpanded(data[0].id)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchAnalyses()
  }, [fetchAnalyses])

  const latestPlan =
    analyses.length > 0 ? parsePlanOfAction(analyses[0].plan_of_action) : null

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    setAsking(true)
    setAskError(null)

    const res = await fetch(`/api/students/${studentId}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })

    const json = await res.json()
    setAsking(false)

    if (!res.ok) {
      setAskError(json.error ?? 'AI request failed')
      return
    }

    setQuestion('')
    await fetchAnalyses()
  }

  async function handleAcknowledge(e: React.FormEvent) {
    e.preventDefault()
    setAcknowledging(true)
    setAckError(null)

    const res = await fetch(`/api/students/${studentId}/escalation-acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counselor_notes: escalationNote }),
    })

    const json = await res.json()
    setAcknowledging(false)

    if (!res.ok) {
      setAckError(json.error ?? 'Failed to acknowledge')
      return
    }

    setIsEscalated(false)
    setEscalationNote('')
    await fetchAnalyses()
  }

  return (
    <div className="space-y-4">
      {/* Escalation acknowledge block */}
      {isEscalated && (
        <div className="rounded-lg border border-[var(--color-escalation)]/30 bg-[var(--color-escalation)]/8 p-5">
          <p className="os-subhead text-[var(--color-escalation)]">Action Required: Escalation</p>
          <p className="os-body mt-1">
            AI has flagged a safety or clinical concern for this student. You must acknowledge and
            document your action before continuing.
          </p>
          <form onSubmit={handleAcknowledge} className="mt-4 space-y-3">
            {ackError && (
              <p className="os-body text-[var(--color-regression)]">{ackError}</p>
            )}
            <textarea
              className="os-input w-full"
              rows={3}
              placeholder="Describe what action you took (min 10 characters)..."
              value={escalationNote}
              onChange={e => setEscalationNote(e.target.value)}
              required
              minLength={10}
            />
            <button
              type="submit"
              className="os-btn-primary"
              disabled={acknowledging}
            >
              {acknowledging ? 'Saving...' : 'Acknowledge & clear escalation'}
            </button>
          </form>
        </div>
      )}

      {/* AI analyses */}
      <div className="os-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="os-heading">AI Briefing</h3>
            <p className="os-body">
              Synthesized from full student history — updated after every session and incident
            </p>
          </div>
        </div>

        {loading ? (
          <p className="os-body">Loading analysis...</p>
        ) : analyses.length === 0 ? (
          <div className="rounded-md bg-[var(--surface-inner)] p-4">
            <p className="os-body">
              No analysis yet. AI will run automatically after the first session or incident is
              logged.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map(analysis => (
              <div
                key={analysis.id}
                className="rounded-md border border-[var(--border-default)] bg-[var(--surface-inner)]"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpanded(expanded === analysis.id ? null : analysis.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded px-2 py-0.5 os-caption bg-[var(--olive-100)] text-[var(--olive-700)] capitalize">
                      {triggerLabels[analysis.triggered_by] ?? analysis.triggered_by}
                    </span>
                    {analysis.escalation_flag && (
                      <span className="rounded px-2 py-0.5 os-caption bg-[var(--color-escalation)]/15 text-[var(--color-escalation)] font-medium">
                        Escalation
                      </span>
                    )}
                    <span className="os-caption">
                      {new Date(analysis.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 16 16"
                    className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                      expanded === analysis.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path d="M3.5 6L8 10.5l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {expanded === analysis.id && (
                  <div className="border-t border-[var(--border-default)] px-4 py-4 space-y-5">
                    {analysis.escalation_flag && analysis.escalation_reason && (
                      <div className="rounded-md bg-[var(--color-escalation)]/10 px-4 py-3">
                        <p className="os-subhead text-[var(--color-escalation)]">Escalation reason</p>
                        <p className="os-body mt-1">{analysis.escalation_reason}</p>
                      </div>
                    )}

                    <div>
                      <p className="os-label mb-2">Problem analysis</p>
                      <p className="os-body whitespace-pre-line">{analysis.problem_analysis}</p>
                    </div>

                    <div>
                      <p className="os-label mb-2">Next session guide</p>
                      <p className="os-body whitespace-pre-line">{analysis.next_session_guide}</p>
                    </div>

                    {analysis.recommended_interventions?.length > 0 && (
                      <div>
                        <p className="os-label mb-2">Recommended interventions</p>
                        <div className="space-y-3">
                          {analysis.recommended_interventions.map((item, i) => (
                            <div
                              key={i}
                              className="rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] p-3"
                            >
                              <p className="os-subhead">{item.intervention}</p>
                              <p className="os-body mt-1">{item.rationale}</p>
                              <a
                                href={item.source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block os-caption text-[var(--olive-600)] underline hover:text-[var(--olive-800)]"
                              >
                                {item.source.name} ↗
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.counselor_notes && (
                      <div className="rounded-md bg-[var(--surface-page)] px-3 py-2">
                        <p className="os-label mb-1">Counselor note</p>
                        <p className="os-body">{analysis.counselor_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {latestPlan && <PlanOfActionPanel studentId={studentId} plan={latestPlan} />}

      {/* Ask AI */}
      <div className="os-card">
        <h3 className="os-heading mb-1">Ask AI</h3>
        <p className="os-body mb-4">
          Ask a specific question about this student. AI responds using their full history.
        </p>

        <form onSubmit={handleAsk} className="space-y-3">
          {askError && (
            <p className="os-body text-[var(--color-regression)]">{askError}</p>
          )}
          <textarea
            className="os-input w-full"
            rows={3}
            placeholder="e.g. This student shuts down when I bring up home life -- how should I approach that?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
            minLength={10}
            maxLength={1000}
            disabled={asking}
          />
          <div className="flex items-center justify-between">
            <p className="os-caption">{question.length}/1000</p>
            <button type="submit" className="os-btn-primary" disabled={asking || question.length < 10}>
              {asking ? 'Analyzing...' : 'Ask AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
