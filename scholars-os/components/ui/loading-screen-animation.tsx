'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import type { LottieRefCurrentProps } from 'lottie-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

// Lottie + the 144KB JSON animation are deferred. The static logo image is
// the first-paint placeholder on the user's very first visit, since the JS
// chunks aren't in cache yet. After the animation has loaded once, both the
// Lottie module and the JSON live in module-scoped state, so subsequent
// loading screens (route changes, refreshes within the session) render the
// animation directly with no static fallback.
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

let cachedAnimationData: unknown | null = null

export function LoadingScreenLogo() {
  const reducedMotion = usePrefersReducedMotion()
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [animationData, setAnimationData] = useState<unknown | null>(
    cachedAnimationData
  )
  const [lottieReady, setLottieReady] = useState(false)

  // Skip the static placeholder once the animation has loaded once in this
  // session — by then Lottie's chunk is cached and renders fast.
  const skipStatic = cachedAnimationData !== null

  useEffect(() => {
    if (reducedMotion) return
    if (cachedAnimationData !== null) return
    let cancelled = false
    import('@/public/animations/logo.json')
      .then(mod => {
        if (cancelled) return
        const data = (mod as { default?: unknown }).default ?? (mod as unknown)
        cachedAnimationData = data
        setAnimationData(data)
      })
      .catch(() => {
        // Static logo stays visible on failure.
      })
    return () => {
      cancelled = true
    }
  }, [reducedMotion])

  function handleComplete() {
    lottieRef.current?.pause()
  }

  const showLottie = !reducedMotion && animationData !== null && lottieReady
  const showStatic = !skipStatic && !showLottie

  return (
    <div className="relative z-10 h-[96px] w-[96px]">
      {/*
        Static logo — emitted as SSR HTML so it paints with the first byte
        on the user's very first visit. Hidden on subsequent loading
        screens once the animation chunk is cached.
      */}
      {!skipStatic ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo-3d.webp"
          alt="Operation Scholars"
          width={96}
          height={96}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-200 ease-out"
          style={{
            opacity: showStatic ? 1 : 0,
            filter: 'drop-shadow(0 8px 24px rgba(214, 160, 51, 0.35))',
          }}
        />
      ) : null}

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
