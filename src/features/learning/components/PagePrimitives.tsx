import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { setAccessToken } from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import type { Source, Target } from '../model'

export const linkClass = 'inline-flex min-h-12 items-center justify-center rounded-control px-4 py-3 text-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pressed hover:bg-brand-subtle'
export function Shell({ children, section, responsive = false }: { children: ReactNode; section?: string; responsive?: boolean }) {
  const { pathname } = useLocation()
  const [accountOpen, setAccountOpen] = useState(false)
  const client = useQueryClient()
  const activeSection = section ?? (pathname.endsWith('/predict') || pathname.endsWith('/edit') ? '/' : pathname.startsWith('/news/') ? '/explore' : pathname.startsWith('/learning') ? '/learning' : pathname)
  return <div className={cn("mx-auto max-w-[1296px]", responsive ? "px-5 sm:px-12" : "px-12")}>
    <header className="border-b border-border-default py-6"><div className={responsive ? "flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6" : "flex items-start gap-6"}>
      <Link to="/" className="flex-1 font-serif text-[28px] font-bold leading-[38px] focus-visible:outline-2 focus-visible:outline-brand-primary">FinSight</Link>
      <nav aria-label="주 메뉴" className={responsive ? "flex flex-wrap gap-2 lg:gap-6" : "flex gap-6"}>{[['/', '홈'], ['/explore', '뉴스 탐색'], ['/learning', '학습 기록']].map(([to, name]) => <Link key={to} to={to} aria-current={activeSection === to ? 'page' : undefined} className={cn(linkClass, 'w-[120px]', activeSection === to ? 'text-brand-primary' : 'text-text-secondary')}>{name}</Link>)}
        <div className="relative"><Button variant="text" className="w-[120px]" aria-expanded={accountOpen} aria-controls="account-options" onClick={() => setAccountOpen(!accountOpen)}>계정</Button>{accountOpen && <div id="account-options" className="absolute right-0 z-20 w-48 rounded-card border border-border-default bg-surface-canvas p-2 shadow-lg"><Link to="/settings/interests" className={`${linkClass} w-full`}>관심 설정 변경</Link><Link to="/login" className={`${linkClass} w-full`}>로그인</Link><Link to="/login" className={`${linkClass} w-full`} onClick={() => { setAccessToken(null); client.clear() }}>로그아웃</Link></div>}</div>
      </nav>
    </div></header>
    <main className="space-y-8 py-12">{children}</main>
    <footer className="border-t border-border-default py-8 text-meta text-text-muted">FinSight / 나만의 시장 관점을 쌓는 기록</footer>
  </div>
}
export function PageTitle({ label, title, description }: { label: string; title: string; description: string }) {
  return <div className="space-y-8"><p className="font-mono text-label text-brand-primary">{label}</p><h1 className="text-page">{title}</h1><p className="text-ui text-text-secondary">{description}</p></div>
}
export function Notice({ title, children, error = false, className }: { title: string; children: ReactNode; error?: boolean; className?: string }) {
  return <div role={error ? 'alert' : 'status'} className={cn('space-y-2 rounded-card p-4', error ? 'bg-status-error-bg' : 'bg-surface-subtle', className)}><p className={cn('text-control font-medium', error && 'text-status-error')}>{title}</p><div className="text-meta text-text-secondary">{children}</div></div>
}
export function SourceCard({ source, compact = false }: { source: Source; compact?: boolean }) {
  return <article className={compact ? 'min-w-0 space-y-1 border-l border-border-default pl-3' : 'space-y-2 rounded-card bg-surface-subtle p-4'}><h3 className={compact ? 'break-words text-meta font-medium text-text-secondary' : 'text-control font-medium'}>{source.title}</h3><p className="break-words text-meta text-text-muted">{source.publisher} · {source.date}</p>{source.quote && <blockquote className="whitespace-pre-wrap break-words text-meta text-text-secondary">{source.quote}</blockquote>}<a href={source.url} target="_blank" rel="noopener noreferrer" className={compact ? 'inline-flex min-h-11 items-center text-meta text-text-muted underline underline-offset-4 hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary' : cn(linkClass, 'w-full')}>원문 보기 ↗<span className="sr-only"> (새 탭)</span></a></article>
}
export function FeedbackSources({ sources }: { sources: Source[] }) {
  const unique = [...new Map(sources.map(source => [source.id, source])).values()]
  if (!unique.length) return null
  return <details className="group"><summary className="w-fit cursor-pointer rounded-control py-2 text-meta text-text-muted hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-brand-primary">근거 {unique.length}개 <span className="group-open:hidden">보기</span><span className="hidden group-open:inline">접기</span></summary><div className="mt-2 space-y-4">{unique.map(source => <SourceCard key={source.id} source={source} compact />)}</div></details>
}
export function TargetSwitcher({ targets, active, onChange, children }: { targets: Target[]; active: string; onChange: (id: string) => void; children?: ReactNode }) {
  return <div aria-label="작성 대상 전환" className="flex flex-wrap gap-2">{targets.map(t => <FilterChip key={t.id} selected={active === t.id} onClick={() => onChange(t.id)}>{t.name}</FilterChip>)}{children}</div>
}
export function SourcesOverview({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false)
  const unique = [...new Map(sources.map(source => [source.id, source])).values()]
  if (!unique.length) return null
  return <section className="space-y-3 border-t border-border-default pt-4"><h2 className="text-control"><button type="button" className="min-h-11 rounded-control text-left text-brand-primary underline underline-offset-4 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand-primary" aria-expanded={open} onClick={() => setOpen(!open)}>전체 근거 자료 · {unique.length}개 {open ? '접기' : '전체 보기'}</button></h2>{open && unique.map(source => <SourceCard key={source.id} source={source} compact />)}</section>
}
