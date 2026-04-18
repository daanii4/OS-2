'use client'

import Image from 'next/image'
import { useEffect } from 'react'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center p-8 text-center"
      style={{ background: '#2d3820' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(214, 160, 51, 0.1) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mb-8">
        <Image
          src="/logo-3d.webp"
          alt="Operation Scholars"
          width={80}
          height={80}
          className="logo-3d-float mx-auto object-contain"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(214, 160, 51, 0.3))' }}
        />
      </div>

      <div className="relative z-10 max-w-sm">
        <h1
          className="mb-3 text-[26px] font-normal leading-tight tracking-[-0.02em] text-white"
          style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
        >
          Something went wrong
        </h1>
        <p className="mb-8 font-sans text-[13px] leading-relaxed text-white/50">
          We&apos;ll get you back on track. No student data was lost.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#5c6b46] px-5 py-2.5 font-sans text-[13px] font-semibold text-white transition-all duration-[150ms] hover:bg-[#3d4c2c]"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
