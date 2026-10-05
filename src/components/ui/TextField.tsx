import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type FieldProps = {
  label: ReactNode
  helperText?: string
  error?: string
  containerClassName?: string
}

type TextFieldProps = FieldProps & ComponentPropsWithRef<'input'>
type TextAreaProps = FieldProps & ComponentPropsWithRef<'textarea'>

const controlClassName = cn(
  'w-full min-h-12 rounded-control border border-border-default bg-surface-canvas p-3 text-meta text-text-primary',
  'placeholder:text-text-muted focus-visible:border-brand-primary focus-visible:outline-1 focus-visible:outline-brand-primary',
  'disabled:bg-surface-subtle disabled:text-text-muted disabled:opacity-100',
  'aria-invalid:border-status-error aria-invalid:focus-visible:outline-status-error',
)

function FieldFrame({ id, label, helperText, error, containerClassName, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2 rounded-card bg-surface-subtle p-4', containerClassName)}>
      <label htmlFor={id} className="text-control font-medium text-text-primary">{label}</label>
      {children}
      {helperText && !error ? <p id={`${id}-help`} className="text-meta text-text-secondary">{helperText}</p> : null}
      {error ? <p id={`${id}-error`} role="alert" className="text-meta text-status-error">{error}</p> : null}
    </div>
  )
}

export function TextField({ label, helperText, error, containerClassName, id, className, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: TextFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const description = [describedBy, error ? `${fieldId}-error` : helperText ? `${fieldId}-help` : undefined].filter(Boolean).join(' ') || undefined
  return (
    <FieldFrame id={fieldId} label={label} helperText={helperText} error={error} containerClassName={containerClassName}>
      <input {...props} id={fieldId} aria-describedby={description} aria-invalid={error ? true : invalid} className={cn(controlClassName, className)} />
    </FieldFrame>
  )
}

export function TextArea({ label, helperText, error, containerClassName, id, className, rows = 4, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: TextAreaProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const description = [describedBy, error ? `${fieldId}-error` : helperText ? `${fieldId}-help` : undefined].filter(Boolean).join(' ') || undefined
  return (
    <FieldFrame id={fieldId} label={label} helperText={helperText} error={error} containerClassName={containerClassName}>
      <textarea {...props} id={fieldId} rows={rows} aria-describedby={description} aria-invalid={error ? true : invalid} className={cn(controlClassName, 'resize-y', className)} />
    </FieldFrame>
  )
}
