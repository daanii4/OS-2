'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import type { LottieRefCurrentProps } from 'lottie-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

// Lottie + the 144KB JSON animation are deferred. The static logo image
// rendered alongside is what the user sees on first paint; once Lottie is
// ready it crossfades in and the static image fades out so they don't
// overlap.
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export function LoadingScreenLogo() {
  const reducedMotion = usePrefersReducedMotion()
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [animationData, setAnimationData] = useState<unknown | null>(null)
  const [lottieReady, setLottieReady] = useState(false)

  useEffect(() => {
    if (reducedMotion) return
    let cancelled = false
    import('@/public/animations/logo.json')
      .then(mod => {
        if (cancelled) return
        setAnimationData(
          (mod as { default?: unknown }).default ?? (mod as unknown)
        )
      })
      .catch(() => {
        // Static logo stays visible. Failure is silent by design.
      })
    return () => {
      cancelled = true
    }
  }, [reducedMotion])

  function handleComplete() {
    lottieRef.current?.pause()
  }

  const showLottie = !reducedMotion && animationData !== null && lottieReady

  return (
    <div className="relative z-10 h-[96px] w-[96px]">
      {/*
        Static logo — emitted as SSR HTML so it paints with the first byte.
        Fades out the moment the Lottie animation is in the DOM so the two
        do not stack and create a "duplicate logo" look.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-3d.webp"
        alt="Operation Scholars"
        width={96}
        height={96}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ease-out"
        style={{
          opacity: showLottie ? 0 : 1,
          filter: 'drop-shadow(0 8px 24px rgba(214, 160, 51, 0.35))',
        }}
      />

      {!reducedMotion && animationData ? (
        <div
          className="absolute inset-0 transition-opacity duration-300 ease-out"
          style={{
            opacity: showLottie ? 1 : 0,
            filter: 'drop-shadow(0 8px 24px rgba(214, 160, 51, 0.35))',
          }}
          aria-hidden
        >
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={false}
            autoplay
            onDOMLoaded={() => setLottieReady(true)}
            onComplete={handleComplete}
            style={{ width: 96, height: 96 }}
          />
        </div>
      ) : null}
    </div>
  )
}
