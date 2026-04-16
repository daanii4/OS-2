'use client'

import type { ReactNode } from 'react'
import { useScrollReveal } from '@/lib/hooks/use-scroll-reveal'

type ScrollRevealProps = {
  children: ReactNode
}

export function ScrollReveal({ children }: ScrollRevealProps) {
  const ref = useScrollReveal()
  return (
    <div ref={ref} className="scroll-reveal">
      {children}
    </div>
  )
}
