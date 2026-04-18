type NumberBadgeProps = {
  number: number
  variant?: 'met' | 'missed' | 'upcoming' | 'ahead'
}

const variants = {
  met: 'bg-[var(--color-success)] text-white',
  missed: 'bg-[var(--color-error)] text-white',
  upcoming: 'bg-[var(--olive-100)] text-[var(--olive-600)]',
  ahead: 'bg-[var(--gold-500)] text-[var(--olive-800)]',
}

export function NumberBadge({ number, variant = 'upcoming' }: NumberBadgeProps) {
  return (
    <div
      className={`os-motif flex h-9 w-9 flex-shrink-0 items-center justify-center ${variants[variant]}`}
    >
      <span
        className="text-[13px] font-medium leading-none"
        style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}
      >
        {String(number).padStart(2, '0')}
      </span>
    </div>
  )
}
