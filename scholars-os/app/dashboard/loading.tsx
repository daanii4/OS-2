export default function DashboardRouteLoading() {
  return (
    <div className="min-h-[40vh] bg-[var(--surface-page)] p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full rounded-lg" />
        <div className="skeleton h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}
