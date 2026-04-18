import { Suspense, type ReactNode } from 'react'
import { LoadingScreen } from '@/components/ui/loading-screen'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
}
