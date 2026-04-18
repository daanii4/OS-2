import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center p-8 text-center"
      style={{ background: '#2d3820' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(214, 160, 51, 0.12) 0%, transparent 70%)',
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
          style={{ filter: 'drop-shadow(0 8px 24px rgba(214, 160, 51, 0.35))' }}
        />
      </div>

      <div className="relative z-10 max-w-sm">
        <h1
          className="mb-3 text-[28px] font-normal leading-tight tracking-[-0.02em] text-white"
          style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
        >
          This page doesn&apos;t exist
        </h1>
        <p className="mb-8 font-sans text-[13px] leading-relaxed text-white/50">
          But the students on your caseload do. Let&apos;s get you back.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-[#5c6b46] px-5 py-2.5 font-sans text-[13px] font-semibold text-white transition-all duration-[150ms] hover:bg-[#3d4c2c]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
