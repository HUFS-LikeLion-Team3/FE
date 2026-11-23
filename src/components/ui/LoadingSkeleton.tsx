import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function LoadingSkeleton({ label, children, className }: {
  label: string
  children: ReactNode
  className?: string
}) {
  return <div role="status">
    <span className="sr-only">{label}</span>
    <div aria-hidden="true" className={cn('motion-safe:animate-pulse', className)}>
      {children}
    </div>
  </div>
}

export function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn('rounded-control bg-surface-subtle', className)} />
}

export function LoadingRows({ label, count = 3 }: { label: string; count?: number }) {
  return <LoadingSkeleton label={label} className="space-y-6">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="space-y-3 border-b border-border-default pb-5">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-6 w-2/3" />
        <SkeletonBlock className="h-4 w-4/5" />
      </div>
    ))}
  </LoadingSkeleton>
}

export function LoadingChart() {
  return <LoadingSkeleton label="시장 추이를 불러오는 중">
    <SkeletonBlock className="h-64 w-full rounded-card" />
  </LoadingSkeleton>
}
