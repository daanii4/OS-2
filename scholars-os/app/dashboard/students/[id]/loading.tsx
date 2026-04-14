export default function StudentDetailLoading() {
  return (
    <div className="os-page space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="h-4 w-56 animate-pulse rounded bg-[var(--surface-inner)]" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-[var(--surface-inner)]" />
      </div>
      <div className="h-36 w-full animate-pulse rounded-lg bg-[var(--surface-inner)]" />
      <div className="flex gap-1 overflow-hidden border-b border-[var(--border-default)] pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 flex-shrink-0 animate-pulse rounded-full bg-[var(--surface-inner)]"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg bg-[var(--surface-inner)]" />
        <div className="h-64 animate-pulse rounded-lg bg-[var(--surface-inner)]" />
      </div>
    </div>
  )
}
