import { matchPath, useLocation } from 'react-router-dom'
import { LoadingRows, LoadingSkeleton, SkeletonBlock } from '@/components/ui/LoadingSkeleton'
import { Shell } from './PagePrimitives'

export function AuthLoading({ label = '로그인 화면을 불러오는 중…' }: { label?: string }) {
  return <main className="grid min-h-screen place-items-center bg-surface-canvas px-5">
    <div className="w-full max-w-sm space-y-4 rounded-card border border-border-default p-6 sm:p-8">
      <p role="status" className="text-center text-control text-text-secondary">{label}</p>
      <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
        <SkeletonBlock className="mx-auto h-4 w-2/3" />
        <SkeletonBlock className="h-12 w-full" />
      </div>
    </div>
  </main>
}

type PageShape = 'list' | 'split' | 'feedback' | 'stack'

// 실제 화면 배치와 맞춘 로딩 뼈대. 로딩이 끝난 뒤 레이아웃이 크게 바뀌지 않도록 화면 종류별로 고른다.
function pageShape(pathname: string): PageShape {
  const match = (pattern: string) => Boolean(matchPath(pattern, pathname))
  if (match('/explore') || match('/learning') || match('/replay')) return 'list'
  if (match('/learning/:sessionId/feedback') || match('/learning/:sessionId/final-feedback') || match('/replay/session/:sessionId/feedback') || match('/replay/session/:sessionId/final-feedback') || match('/dev/pages/learning/:sessionId/feedback') || match('/dev/pages/learning/:sessionId/final-feedback')) return 'feedback'
  if (match('/learning/:sessionId') || match('/learning/:sessionId/reflection') || match('/dev/pages/learning/:sessionId/reflection')) return 'stack'
  return 'split'
}

function TitleBlock() {
  return <div className="space-y-4">
    <SkeletonBlock className="h-4 w-28" />
    <SkeletonBlock className="h-10 w-3/4 max-w-2xl" />
    <SkeletonBlock className="h-5 w-1/2 max-w-md" />
  </div>
}

function CardBlock() {
  return <div className="space-y-3 rounded-card border border-border-default p-5 sm:p-6">
    <SkeletonBlock className="h-6 w-2/5" />
    <SkeletonBlock className="h-4 w-full" />
    <SkeletonBlock className="h-4 w-5/6" />
    <SkeletonBlock className="h-4 w-2/3" />
  </div>
}

export function PageLoading() {
  const { pathname } = useLocation()
  if (matchPath('/login', pathname) || matchPath('/auth/kakao/callback', pathname)) return <AuthLoading />

  const shape = pageShape(pathname)
  const isNews = Boolean(matchPath('/news/:newsId', pathname))
  const section = pathname.startsWith('/replay') ? '/explore' : undefined

  return <Shell section={section} responsive>
    <LoadingSkeleton label={isNews ? '뉴스 상세를 불러오는 중' : shape === 'feedback' ? '피드백 화면을 불러오는 중' : '화면을 불러오는 중'} className="space-y-8">
      <TitleBlock />
      {shape === 'split' && <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
        <div className="space-y-4 border-t border-border-default pt-6">
          <SkeletonBlock className="h-6 w-2/5" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
        <SkeletonBlock className="h-40 w-full rounded-card" />
      </div>}
      {shape === 'feedback' && <div className="w-full max-w-[880px] space-y-6">
        <SkeletonBlock className="h-16 w-full rounded-card" />
        <SkeletonBlock className="h-11 w-64" />
        <div className="space-y-4 rounded-card bg-surface-subtle p-5 sm:p-6">
          <SkeletonBlock className="h-6 w-1/3 bg-surface-canvas" />
          <SkeletonBlock className="h-4 w-full bg-surface-canvas" />
          <SkeletonBlock className="h-4 w-2/3 bg-surface-canvas" />
        </div>
        <CardBlock />
        <CardBlock />
      </div>}
      {shape === 'stack' && <div className="space-y-6">
        <CardBlock />
        <CardBlock />
      </div>}
    </LoadingSkeleton>
    {shape === 'list' && <LoadingRows label="목록을 불러오는 중" />}
  </Shell>
}
