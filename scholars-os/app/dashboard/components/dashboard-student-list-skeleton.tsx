export function StudentListSkeleton() {
  return (
    <section className="os-card os-card-interactive min-w-0 overflow-x-hidden">
      <div className="space-y-2 px-4 pt-4 md:px-5">
        <div className="mb-5 flex flex-col gap-4 border-b border-[rgba(92,107,70,0.12)] pb-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-24 animate-pulse rounded bg-[var(--surface-inner)]" />
            <div className="h-3 w-32 animate-pulse rounded bg-[var(--surface-inner)]" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-48 animate-pulse rounded-full bg-[var(--surface-inner)]" />
            <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--surface-inner)]" />
          </div>
        </div>
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="animate-pulse rounded-md border border-[var(--border-default)] p-4"
            aria-hidden
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
    </section>
  )
}
