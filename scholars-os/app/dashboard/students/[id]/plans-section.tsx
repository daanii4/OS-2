'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreatePlanForm } from './create-plan-form'
import { PlansListPanel, type PlanListItem } from './plans-list-panel'

type Props = {
  studentId: string
  plans: PlanListItem[]
}

export function PlansSection({ studentId, plans }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  function afterSave() {
    setShowForm(false)
    router.refresh()
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-[rgba(92,107,70,0.12)] bg-[#5C6B46] px-4 py-3 font-sans text-[13px] font-semibold text-white transition-colors hover:bg-[#3d4c2c]"
        >
          <span>{showForm ? 'Hide form' : '+ Create Plan'}</span>
          <svg
            viewBox="0 0 16 16"
            className={`h-4 w-4 transition-transform duration-200 ${showForm ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {showForm ? (
          <div className="mt-2">
            <CreatePlanForm studentId={studentId} onSaved={afterSave} />
          </div>
        ) : null}
      </div>

      <div className="hidden w-full gap-4 md:grid md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:items-start md:gap-4">
        <CreatePlanForm studentId={studentId} onSaved={afterSave} />
        <PlansListPanel plans={plans} />
      </div>

      <div className="md:hidden">
        <PlansListPanel plans={plans} />
      </div>
    </div>
  )
}
