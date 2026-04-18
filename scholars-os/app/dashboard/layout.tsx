import { Suspense, type ReactNode } from 'react'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { requireOnboardingComplete } from '@/lib/require-onboarding-complete'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireOnboardingComplete()
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
}
