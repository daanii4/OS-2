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

const LOTTIE_CACHED_ATTR = 'data-lottie-cached'

function markLottieCached() {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute(LOTTIE_CACHED_ATTR, '1')
}

export function LoadingScreenLogo() {
  const reducedMotion = usePrefersReducedMotion()
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [animationData, setAnimationData] = useState<unknown | null>(
    cachedAnimationData
  )
  const [lottieReady, setLottieReady] = useState(false)

  // If Lottie was already cached this session, the <img> is hidden by CSS
  // (see globals.css `html[data-lottie-cached] [data-loading-static-logo]`)
  // and the animation renders directly. The flag also tells us not to
  // bother fading the static image in the React tree.
  const skipStatic = cachedAnimationData !== null

  useEffect(() => {
    if (reducedMotion) return
    if (cachedAnimationData !== null) {
      markLottieCached()
      return
    }
    let cancelled = false
    import('@/public/animations/logo.json')
      .then(mod => {
        if (cancelled) return
        const data = (mod as { default?: unknown }).default ?? (mod as unknown)
        cachedAnimationData = data
        markLottieCached()
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
      {!skipStatic ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo-3d.webp"
          alt="Operation Scholars"
          width={96}
          height={96}
          fetchPriority="high"
          decoding="async"
          data-loading-static-logo=""
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
