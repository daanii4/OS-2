'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import type { LottieRefCurrentProps } from 'lottie-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

// Lottie + the 144KB JSON animation are deferred. Until they load, the static
// logo image emitted by `LoadingScreen` is what the user sees — meaning the
// brand mark paints with the very first HTML byte instead of waiting for JS.
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export function LoadingScreenAnimation() {
  const reducedMotion = usePrefersReducedMotion()
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [animationData, setAnimationData] = useState<unknown | null>(null)
  const [visible, setVisible] = useState(false)

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
        // Static logo remains visible. Failure is silent by design.
      })
    return () => {
      cancelled = true
    }
  }, [reducedMotion])

  function handleComplete() {
    lottieRef.current?.pause()
  }

  if (reducedMotion || !animationData) return null

  return (
    <div
      className="absolute inset-0 transition-opacity duration-300 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        filter: 'drop-shadow(0 8px 24px rgba(214, 160, 51, 0.35))',
      }}
      aria-hidden
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay
        onDOMLoaded={() => setVisible(true)}
        onComplete={handleComplete}
        style={{ width: 96, height: 96 }}
      />
    </div>
  )
}
