'use client'

import Image from 'next/image'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { useRef } from 'react'
import logoAnimation from '@/public/animations/logo.json'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

type LoadingScreenProps = {
  message?: string
}

export function LoadingScreen({ message = 'Loading your students' }: LoadingScreenProps) {
  const reducedMotion = usePrefersReducedMotion()
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  function handleComplete() {
    lottieRef.current?.pause()
  }

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

      <div className="relative z-10 flex h-[96px] w-[96px] items-center justify-center">
        {reducedMotion ? (
          <Image
            src="/logo-3d.webp"
            alt="Operation Scholars"
            width={96}
            height={96}
            priority
            className="object-contain"
            style={{
              filter: 'drop-shadow(0 8px 24px rgba(214, 160, 51, 0.35))',
            }}
          />
        ) : (
          <Lottie
            lottieRef={lottieRef}
            animationData={logoAnimation}
            loop={false}
            autoplay
            onComplete={handleComplete}
            style={{ width: 96, height: 96 }}
          />
        )}
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
