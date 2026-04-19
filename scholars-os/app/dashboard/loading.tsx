import { LoadingScreen } from '@/components/ui/loading-screen'

/**
 * Displayed while the dashboard route's auth/tenant/escalation checks resolve
 * on first navigation. The page shell (sidebar, topbar, KPI skeletons) takes
 * over as soon as those queries return.
 */
export default function DashboardRouteLoading() {
  return <LoadingScreen />
}
