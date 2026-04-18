'use client'

import Lottie from 'lottie-react'
import logoAnimation from '@/public/animations/logo.json'

type Props = {
  size?: number
  loop?: boolean
  autoplay?: boolean
}

export function LogoAnimation({ size = 120, loop = false, autoplay = true }: Props) {
  return (
    <Lottie
      animationData={logoAnimation}
      loop={loop}
      autoplay={autoplay}
      style={{ width: size, height: size }}
    />
  )
}
