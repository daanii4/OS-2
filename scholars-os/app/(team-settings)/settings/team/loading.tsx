import { LoadingScreen } from '@/components/ui/loading-screen'

/**
 * Shown while the team page resolves auth and fetches the roster. Renders
 * instantly on navigation so the user gets immediate brand feedback instead
 * of staring at the previous page.
 */
export default function TeamSettingsLoading() {
  return <LoadingScreen message="Loading team" />
}
