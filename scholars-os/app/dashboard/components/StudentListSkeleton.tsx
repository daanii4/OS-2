export function StudentListSkeleton() {
  return (
    <div className="os-card os-card-interactive">
      <div className="space-y-2 px-4 pt-4">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="animate-pulse rounded-md border border-[var(--border-default)] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm bg-[var(--surface-inner)]" />
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-[var(--surface-inner)]" />
                <div className="h-3 w-24 rounded bg-[var(--surface-inner)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
