export function KPIRowSkeleton() {
  return (
    <section className="os-kpi-grid">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="os-card-tight animate-pulse"
          style={{ borderTop: '3px solid var(--olive-200)', paddingTop: 17 }}
        >
          <div className="h-3 w-24 rounded bg-[var(--surface-inner)]" />
          <div className="mt-2 h-8 w-16 rounded bg-[var(--surface-inner)]" />
          <div className="mt-1 h-3 w-20 rounded bg-[var(--surface-inner)]" />
        </div>
      ))}
    </section>
  )
}
