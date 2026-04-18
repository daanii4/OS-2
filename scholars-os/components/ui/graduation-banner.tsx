function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L13.53 5.48a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.832l8.57 3.906a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  )
}

export function GraduationBanner() {
  return (
    <div
      className="relative mb-4 overflow-hidden rounded-xl border border-[rgba(214,160,51,0.3)] px-5 py-4"
      style={{ background: 'var(--olive-800)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 80% 50%, rgba(214, 160, 51, 0.2) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <div className="relative z-10 flex items-center gap-3">
        <div className="os-motif flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[var(--gold-500)]">
          <GraduationCapIcon className="h-[18px] w-[18px] text-[var(--olive-800)]" />
        </div>
        <div>
          <p className="font-[family-name:var(--font-dm-serif),Georgia,serif] text-[16px] font-normal text-[var(--gold-500)]">
            Graduated
          </p>
          <p className="font-[family-name:var(--font-geist-sans),system-ui,sans-serif] text-[11px] text-white/50">
            This student met their goals. Their story continues.
          </p>
        </div>
      </div>
    </div>
  )
}
