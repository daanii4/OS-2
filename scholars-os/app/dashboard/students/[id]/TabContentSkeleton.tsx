export function TabContentSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-sm bg-[var(--surface-inner)]" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 rounded bg-[var(--surface-inner)]" />
              <div className="h-3 w-32 rounded bg-[var(--surface-inner)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
