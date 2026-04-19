import { LoadingScreen } from '@/components/ui/loading-screen'

/**
 * Displayed while a student profile route resolves auth + initial student row.
 * The profile header + tabs render as soon as those return; section data
 * streams in behind its own Suspense boundary.
 */
export default function StudentDetailLoading() {
  return <LoadingScreen message="Loading student profile" />
}
