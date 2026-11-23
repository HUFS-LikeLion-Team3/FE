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

export function PageLoading() {
  const { pathname } = useLocation()
  if (matchPath('/login', pathname) || matchPath('/auth/kakao/callback', pathname)) return <AuthLoading />

  const isNews = Boolean(matchPath('/news/:newsId', pathname))
  const isList = Boolean(matchPath('/explore', pathname) || matchPath('/learning', pathname) || matchPath('/replay', pathname))
  const section = pathname.startsWith('/replay') ? '/explore' : undefined

  return <Shell section={section} responsive>
    <LoadingSkeleton label={isNews ? '뉴스 상세를 불러오는 중' : '화면을 불러오는 중'} className="space-y-8">
      <div className="space-y-4">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-10 w-3/4 max-w-2xl" />
        <SkeletonBlock className="h-5 w-1/2 max-w-md" />
      </div>
      {!isList && <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
        <div className="space-y-4 border-t border-border-default pt-6">
          <SkeletonBlock className="h-6 w-2/5" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
        <SkeletonBlock className="h-40 w-full rounded-card" />
      </div>}
    </LoadingSkeleton>
    {isList && <LoadingRows label="목록을 불러오는 중" />}
  </Shell>
}
