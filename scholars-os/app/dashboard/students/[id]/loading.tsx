export default function StudentDetailLoading() {
  return (
    <div className="os-page space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="skeleton h-4 w-56" />
        <div className="skeleton h-9 w-28 rounded-md" />
      </div>
      <div className="skeleton h-36 w-full rounded-lg" />
      <div className="flex gap-1 overflow-hidden border-b border-[var(--border-default)] pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-8 w-20 flex-shrink-0 rounded-full"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-64 rounded-lg" />
        <div className="skeleton h-64 rounded-lg" />
      </div>
    </div>
  )
}
