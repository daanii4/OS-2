'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogoAnimation } from '@/components/LogoAnimation'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

type Role = 'owner' | 'assistant' | 'counselor'

type Step = {
  id: string
  headline: (name: string) => string
  subheadline?: string
  body: string
  cta: string
  showLogo: boolean
  isFinal?: boolean
}

const ONBOARDING_STEPS: Record<Role, Step[]> = {
  owner: [
    {
      id: 'welcome',
      headline: name => `Welcome, ${name}.`,
      subheadline: 'Operation Scholars OS is ready.',
      body:
        'You now have everything you need to manage your team, track your students, and prove your impact to every district you work with. Let us get you set up.',
      cta: 'Get started',
      showLogo: true,
    },
    {
      id: 'students',
      headline: () => 'Your students are at the center.',
      body:
        'Every student has a profile with their full behavioral history, AI-powered session briefings, and a visual progress chart. Add your first student to see it in action.',
      cta: 'Next',
      showLogo: false,
    },
    {
      id: 'sessions',
      headline: () => 'Session logging is frictionless.',
      body:
        'Student name, date, school — all pre-populated. Your counselors open a session and only write what happened. The AI reads every word and prepares their next visit automatically.',
      cta: 'Next',
      showLogo: false,
    },
    {
      id: 'export',
      headline: () => 'District reports in one click.',
      body:
        'Every session your counselors log flows into the monthly caseload export. Select a month, select a school, and download the exact format your districts already expect.',
      cta: 'Next',
      showLogo: false,
    },
    {
      id: 'team',
      headline: () => 'Your team is waiting.',
      body:
        'Head to Settings to invite your counselors. They will receive a welcome email, set their password, and be ready to log sessions the same day.',
      cta: 'Take me to my dashboard',
      showLogo: false,
      isFinal: true,
    },
  ],
  assistant: [
    {
      id: 'welcome',
      headline: name => `Welcome, ${name}.`,
      subheadline: 'You are part of the Operation Scholars team.',
      body:
        'You have visibility across the full student caseload. You can log sessions, track incidents, and generate district reports. Here is a quick look at what you can do.',
      cta: 'Get started',
      showLogo: true,
    },
    {
      id: 'students',
      headline: () => 'Full caseload visibility.',
      body:
        'You can see every student across all counselors — their progress charts, session history, and behavioral trends. Filter by school, counselor, or status.',
      cta: 'Next',
      showLogo: false,
    },
    {
      id: 'export',
      headline: () => 'Monthly reports are automated.',
      body:
        'The caseload export pulls directly from logged sessions. Select a month and school to download the district report in the exact format they expect — no manual entry.',
      cta: 'Take me to my dashboard',
      showLogo: false,
      isFinal: true,
    },
  ],
  counselor: [
    {
      id: 'welcome',
      headline: name => `Welcome, ${name}.`,
      subheadline: 'Your students are ready.',
      body:
        'Operation Scholars OS was built to save you time and make your sessions more effective. Everything is pre-filled. You just show up and write what happened.',
      cta: 'Show me how',
      showLogo: true,
    },
    {
      id: 'students',
      headline: () => 'Your assigned students only.',
      body:
        'You will see only the students assigned to you. Each profile has their full history — referrals, past sessions, behavioral trends, and the AI briefing for your next visit.',
      cta: 'Next',
      showLogo: false,
    },
    {
      id: 'sessions',
      headline: () => 'Log a session in under 2 minutes.',
      body:
        'Student name, date, school, and counselor are already filled in when you open a new session. You write the summary, mark goals, and save. The AI does the rest before your next visit.',
      cta: 'Next',
      showLogo: false,
    },
    {
      id: 'ai',
      headline: () => 'Your AI co-counselor.',
      body:
        'After every session you log, the AI reads the full student history and prepares a plan of action for your next meeting — what to open with, what to watch for, and specific questions to ask. It is waiting on every student profile.',
      cta: 'Take me to my students',
      showLogo: false,
      isFinal: true,
    },
  ],
}

type Props = {
  profile: {
    id: string
    name: string
    role: Role
    onboarding_step: number
  }
}

export function OnboardingFlow({ profile }: Props) {
  const steps = ONBOARDING_STEPS[profile.role]
  const [currentStep, setCurrentStep] = useState(
    Math.min(profile.onboarding_step, Math.max(0, steps.length - 1))
  )
  const [completing, setCompleting] = useState(false)
  const router = useRouter()
  const reducedMotion = usePrefersReducedMotion()

  const step = steps[currentStep]
  if (!step) return null

  async function handleNext() {
    const isLast = currentStep === steps.length - 1 || step.isFinal === true

    if (isLast) {
      setCompleting(true)
      const res = await fetch('/api/auth/complete-onboarding', { method: 'POST' })
      if (!res.ok) {
        setCompleting(false)
        return
      }
      const dest = profile.role === 'counselor' ? '/dashboard/students' : '/dashboard'
      router.push(dest)
      return
    }

    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    fetch('/api/auth/onboarding-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: nextStep }),
    }).catch(() => {})
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--surface-page)] px-4 py-10">
      <div className="mb-6 flex gap-1">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={`h-2 w-2 rounded-full ${
              i === currentStep ? 'bg-[var(--olive-600)]' : i < currentStep ? 'bg-[var(--olive-300)]' : 'bg-[var(--surface-inner)]'
            }`}
            aria-hidden
          />
        ))}
      </div>

      {step.showLogo && (
        <div className="mb-6">
          {reducedMotion ? (
            <img src="/static/logo.svg" width={120} height={120} alt="Operation Scholars" />
          ) : (
            <LogoAnimation size={120} loop={false} />
          )}
        </div>
      )}

      <div className="w-full max-w-lg text-center">
        <h1 className="os-title">{step.headline(profile.name)}</h1>
        {step.subheadline && (
          <p className="os-subhead mt-2 text-[var(--text-secondary)]">{step.subheadline}</p>
        )}
        <p className="os-body mt-4 text-[var(--text-primary)]">{step.body}</p>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={completing}
        className="os-btn-primary mt-10 min-w-[200px]"
      >
        {completing ? 'Loading...' : step.cta}
      </button>
    </div>
  )
}
