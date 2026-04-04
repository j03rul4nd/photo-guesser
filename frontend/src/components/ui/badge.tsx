import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium font-ui',
  {
    variants: {
      variant: {
        default:   'bg-[var(--accent)] text-white',
        secondary: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
        correct:   'bg-[var(--correct-bg)] text-[var(--correct)] border border-[var(--correct)]',
        incorrect: 'bg-[var(--incorrect-bg)] text-[var(--incorrect)] border border-[var(--incorrect)]',
        pending:   'bg-[rgba(184,134,11,0.1)] text-[var(--pending)] border border-[var(--pending)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
