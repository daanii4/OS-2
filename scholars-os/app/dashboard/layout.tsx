import { requireOnboardingComplete } from '@/lib/require-onboarding-complete'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireOnboardingComplete()
  return <>{children}</>
}
