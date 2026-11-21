import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/cn'

type FilterChipProps = Omit<ComponentPropsWithRef<'button'>, 'aria-pressed'> & { selected: boolean }

export function FilterChip({ selected, className, children, type = 'button', ...props }: FilterChipProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill border border-border-default bg-surface-canvas px-4 py-2 text-control font-medium text-text-primary',
        'focus-visible:outline-2 focus-visible:outline-brand-primary disabled:text-text-muted',
        selected && 'border-brand-primary bg-brand-subtle',
        className,
      )}
    >
      {selected ? <span aria-hidden="true" className="w-6 shrink-0 text-brand-primary">✓</span> : null}
      <span className="min-w-0 break-words">{children}</span>
    </button>
  )
}
