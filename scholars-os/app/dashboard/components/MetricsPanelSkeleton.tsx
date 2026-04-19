export function MetricsPanelSkeleton() {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-[14px]">
      <div className="os-card animate-pulse">
        <div className="mb-3 h-4 w-32 rounded bg-[var(--surface-inner)]" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-5 w-20 rounded bg-[var(--surface-inner)]" />
              <div className="h-5 w-8 rounded bg-[var(--surface-inner)]" />
            </div>
          ))}
        </div>
      </div>
      <div className="os-card animate-pulse">
        <div className="mb-3 h-4 w-24 rounded bg-[var(--surface-inner)]" />
        <div className="space-y-2">
          {[0, 1].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-[var(--surface-inner)]" />
              <div className="h-4 w-8 rounded bg-[var(--surface-inner)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
