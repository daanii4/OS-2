'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[var(--olive-600)] text-white hover:bg-[var(--olive-700)]',
        ghost: 'hover:bg-[var(--surface-inner)]',
        outline: 'border border-[var(--border-default)] bg-transparent hover:bg-[var(--surface-inner)]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

/** Animated menu / close icon for mobile nav trigger (three lines → X). */
export function AnimatedMenuButton({
  open,
  className,
  'aria-label': ariaLabel = 'Menu',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { open: boolean }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={open}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-inner)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033]',
        className
      )}
      {...props}
    >
      <span className="sr-only">{ariaLabel}</span>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path
          className="origin-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            transform: open ? 'translateY(8px) rotate(45deg)' : 'translateY(0) rotate(0)',
          }}
          d="M4 6h16"
          strokeLinecap="round"
        />
        <path
          className="origin-center transition-all duration-200 ease-out"
          style={{ opacity: open ? 0 : 1 }}
          d="M4 12h16"
          strokeLinecap="round"
        />
        <path
          className="origin-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            transform: open ? 'translateY(-8px) rotate(-45deg)' : 'translateY(0) rotate(0)',
          }}
          d="M4 18h16"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
