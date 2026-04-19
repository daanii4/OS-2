import type { ReactNode } from 'react'
import { requireOnboardingComplete } from '@/lib/require-onboarding-complete'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireOnboardingComplete()
  return <>{children}</>
}
