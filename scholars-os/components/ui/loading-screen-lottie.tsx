'use client'

import Lottie from 'lottie-react'
import logoAnimation from '@/public/animations/logo.json'

/** Lottie-only chunk for dynamic import — keeps initial bundle smaller. */
export default function LoadingScreenLottie() {
  return (
    <Lottie
      animationData={logoAnimation}
      loop
      autoplay
      style={{ width: 96, height: 96 }}
    />
  )
}
