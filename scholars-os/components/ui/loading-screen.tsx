import { LoadingScreenAnimation } from './loading-screen-animation'

type LoadingScreenProps = {
  message?: string
}

/**
 * Server-rendered loading screen. The static logo image is emitted as inline
 * HTML so it paints **before any JavaScript runs**, eliminating the blank
 * square previously caused by waiting for Lottie to hydrate. Once JS loads,
 * `LoadingScreenAnimation` mounts a Lottie player and crossfades it over
 * the static image.
 *
 * Background, gradient, title, and progress bar are all pure CSS — no
 * client work required for the user to see the brand.
 */
export function LoadingScreen({
  message = 'Loading your students',
}: LoadingScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: '#2d3820' }}
      role="status"
      aria-label="Loading Operation Scholars"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(214, 160, 51, 0.14) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 h-[96px] w-[96px]">
        {/*
          Static logo — paints with the SSR HTML, no JS required. Becomes the
          LCP element on the loading screen. The animated Lottie below fades
          in on top once mounted.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-3d.webp"
          alt="Operation Scholars"
          width={96}
          height={96}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
          style={{
            filter: 'drop-shadow(0 8px 24px rgba(214, 160, 51, 0.35))',
          }}
        />
        <LoadingScreenAnimation />
      </div>

      <div className="relative z-10 text-center">
        <p
          className="text-[22px] font-normal leading-tight tracking-[-0.01em] text-white"
          style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
        >
          Operation Scholars
        </p>
        <p className="mt-1.5 font-sans text-[10px] uppercase tracking-[0.1em] text-white/35">
          {message}
        </p>
      </div>

      <div
        className="relative z-10 h-[2px] w-28 overflow-hidden rounded-full bg-white/[0.08]"
        aria-hidden
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#d6a033]"
          style={{ animation: 'brand-load 1.6s ease-in-out infinite' }}
        />
      </div>
    </div>
  )
}
