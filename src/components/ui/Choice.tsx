import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ChoiceProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'className'> & {
  type: 'radio' | 'checkbox'
  label: ReactNode
  className?: string
}

export function Choice({ type, label, className, ...props }: ChoiceProps) {
  return (
    <label className={cn('relative block min-w-0', className)}>
      <input {...props} type={type} className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default" />
      <span className={cn(
        'flex min-h-14 items-center gap-2 rounded-control border border-border-default bg-surface-canvas px-4 py-3 text-control font-medium text-text-primary',
        'peer-checked:border-brand-primary peer-checked:bg-brand-subtle',
        'peer-focus-visible:outline-2 peer-focus-visible:outline-brand-primary',
        'peer-disabled:text-text-muted peer-disabled:[&_.choice-marker]:text-text-muted',
        'peer-checked:[&_.choice-unchecked]:hidden peer-checked:[&_.choice-checked]:block',
      )}>
        <span aria-hidden="true" className="choice-marker w-6 shrink-0 text-brand-primary">
          <span className="choice-unchecked">○</span>
          <span className="choice-checked hidden">✓</span>
        </span>
        <span className="min-w-0 break-words">{label}</span>
      </span>
    </label>
  )
}
