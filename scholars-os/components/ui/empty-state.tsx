import type { ReactNode } from 'react'

export type EmptyStateProps = {
  icon: ReactNode
  title: string
  body: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="os-motif mb-4 flex h-14 w-14 items-center justify-center bg-[var(--olive-50)]">
        {icon}
      </div>
      <h3
        className="mb-2 text-[18px] font-normal text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
      >
        {title}
      </h3>
      <p
        className="mb-5 max-w-[260px] text-[13px] leading-relaxed text-[var(--text-tertiary)]"
        style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
      >
        {body}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-lg bg-[var(--olive-600)] px-4 py-2 text-[12px] font-semibold text-white transition-all duration-[var(--duration-fast)] hover:bg-[var(--olive-700)]"
          style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
