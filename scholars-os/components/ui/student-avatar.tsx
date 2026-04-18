type StudentAvatarProps = {
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[13px]',
  lg: 'w-12 h-12 text-[15px]',
}

function initialsFrom(firstName: string, lastName: string): string {
  const a = firstName.trim()[0] ?? ''
  const b = lastName.trim()[0] ?? ''
  const combined = `${a}${b}`.toUpperCase()
  return combined || '?'
}

export function StudentAvatar({ firstName, lastName, size = 'md' }: StudentAvatarProps) {
  const initials = initialsFrom(firstName, lastName)

  return (
    <div
      className={`os-motif flex flex-shrink-0 items-center justify-center bg-[var(--olive-600)] ${sizes[size]}`}
    >
      <span
        className="font-normal leading-none text-white"
        style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
      >
        {initials}
      </span>
    </div>
  )
}
