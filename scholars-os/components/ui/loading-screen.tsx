export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
      style={{ background: 'var(--olive-800)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(214, 160, 51, 0.12) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <div className="relative z-10 motion-safe:animate-[brand-pulse_2s_ease-in-out_infinite]">
        <img
          src="/logo-mark.png"
          alt="Operation Scholars"
          className="h-16 w-16 object-contain"
        />
      </div>
      <div className="relative z-10 text-center">
        <p className="font-[family-name:var(--font-dm-serif),Georgia,serif] text-[20px] font-normal tracking-[-0.01em] text-white">
          Operation Scholars
        </p>
        <p className="mt-1 font-[family-name:var(--font-geist-sans),system-ui,sans-serif] text-[10px] uppercase tracking-[0.1em] text-white/35">
          Loading your students
        </p>
      </div>
      <div className="relative z-10 h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[var(--gold-500)] motion-safe:animate-[brand-load_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  )
}
