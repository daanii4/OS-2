'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const button1Variants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-colors hover:bg-[var(--surface-inner)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        primary: 'border-[var(--olive-600)] bg-[var(--olive-600)] text-white hover:bg-[var(--olive-700)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface Button1Props
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button1Variants> {
  asChild?: boolean
}

export const Button1 = React.forwardRef<HTMLButtonElement, Button1Props>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(button1Variants({ variant, className }))} ref={ref} {...props} />
  }
)
Button1.displayName = 'Button1'
