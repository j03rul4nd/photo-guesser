import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Button — shadcn base overridden with Photo Guesser design tokens.
 * Feedback táctil: CSS scale(0.97) en 80ms, nunca JS/GSAP/Motion.
 */
const buttonVariants = cva(
  // Base — siempre aplicado
  [
    'inline-flex items-center justify-center gap-2',
    'font-ui font-medium text-sm',
    'rounded-[var(--radius-md)]',
    'min-h-[44px] px-5',
    'border-2 border-transparent',
    'cursor-pointer select-none',
    'transition-[background-color,border-color,color,box-shadow]',
    'duration-150',
    // Feedback táctil (active) — CSS puro, 80ms
    'active:scale-[0.97]',
    '[transition:background-color_150ms_ease-out,border-color_150ms_ease-out,color_150ms_ease-out,box-shadow_150ms_ease-out,transform_80ms_ease-out]',
    'disabled:pointer-events-none disabled:opacity-40',
    'focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2',
  ],
  {
    variants: {
      variant: {
        // CTA principal — fondo acento
        default: [
          'bg-[var(--accent)] text-white',
          'shadow-[var(--shadow-sm)]',
          'hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)]',
          'active:shadow-none',
        ],
        // Secundario — fondo bg-secondary, borde text-primary
        secondary: [
          'bg-[var(--bg-secondary)] text-[var(--text-primary)]',
          'border-[var(--text-primary)]',
          'hover:bg-[var(--bg-primary)]',
        ],
        // Fantasma — solo borde acento
        outline: [
          'bg-transparent text-[var(--accent)]',
          'border-[var(--accent)]',
          'hover:bg-[var(--accent)] hover:text-white',
        ],
        // Silencioso — sin borde ni relleno fuerte
        ghost: [
          'bg-transparent text-[var(--text-secondary)]',
          'hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]',
        ],
        // Destructivo
        destructive: [
          'bg-[var(--incorrect)] text-white',
          'hover:opacity-90',
        ],
      },
      size: {
        sm:   'min-h-[36px] px-3 text-xs',
        md:   'min-h-[44px] px-5 text-sm',
        lg:   'min-h-[52px] px-7 text-base',
        icon: 'min-h-[44px] min-w-[44px] w-[44px] h-[44px] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
