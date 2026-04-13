'use client'

import { useState } from 'react'

type Counselor = {
  id: string
  name: string
  role: string
}

type AssignCounselorFormProps = {
  studentId: string
  counselors: Counselor[]
  currentCounselorId: string | null
}

export function AssignCounselorForm({
  studentId,
  counselors,
  currentCounselorId,
}: AssignCounselorFormProps) {
  const [selected, setSelected] = useState(currentCounselorId ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleAssign() {
    setLoading(true)
    setMessage(null)

    const res = await fetch(`/api/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assigned_counselor_id: selected === '' ? null : selected,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage({ type: 'error', text: json.error ?? 'Failed to update assignment' })
      return
    }

    setMessage({ type: 'success', text: 'Counselor assignment updated' })
  }

  return (
    <div className="os-card">
      <h3 className="os-heading mb-3">Assign counselor</h3>

      {message && (
        <div
          className={`mb-3 rounded-md px-3 py-2 os-body ${
            message.type === 'success'
              ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
              : 'bg-[var(--color-regression)]/10 text-[var(--color-regression)]'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-2">
        <select
          className="os-input flex-1"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">-- Unassigned --</option>
          {counselors.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.role})
            </option>
          ))}
        </select>
        <button
          type="button"
          className="os-btn-primary"
          onClick={handleAssign}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
