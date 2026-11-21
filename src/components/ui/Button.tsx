import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/cn'

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'text'
  loading?: boolean
  loadingLabel?: string
}

const variants = {
  primary: 'border-transparent bg-brand-primary text-surface-canvas enabled:hover:bg-brand-hover enabled:active:bg-brand-pressed',
  secondary: 'border-border-default bg-surface-canvas text-text-primary enabled:hover:bg-brand-subtle enabled:active:bg-brand-subtle',
  text: 'border-transparent bg-transparent text-text-primary enabled:hover:bg-brand-subtle enabled:active:bg-brand-subtle',
}

export function Button({ variant = 'primary', loading = false, loadingLabel = '처리 중…', disabled, type = 'button', className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-12 min-w-11 items-center justify-center gap-2 rounded-control border px-4 py-3 text-control font-medium',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pressed',
        !loading && 'disabled:bg-surface-subtle disabled:text-text-muted',
        variants[variant],
        className,
      )}
    >
      {loading ? loadingLabel : children}
    </button>
  )
}
