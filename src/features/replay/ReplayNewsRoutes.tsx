import type { ReactNode } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Link, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/lib/api-client'
import { Notice, PageTitle, Shell, linkClass } from '../learning/components/PagePrimitives'
import { getReplayMarketTargets, getReplayNews, getReplayNewsPage, readReplayFilters, replayNewsKey, replayUsesFixtures, type ReplayNews } from './api'
import ReplayLibrary from './ReplayLibrary'
import { ReplayEditorRoute, ReplayFeedbackRoute } from './ReplaySessionRoutes'
import ReplayNewsDetail from './ReplayNewsDetail'
import { ReplayErrorNotice } from './ReplayErrorNotice'

/** 개발 미리보기의 상태 선택기(?state=)로 강제할 수 있는 목록·상세 상태. */
export type ReplayPreviewState = 'loading' | 'error' | 'empty'

function useClearPreviewState() {
  const [, setParams] = useSearchParams()
  return () => setParams(previous => { const next = new URLSearchParams(previous); next.delete('state'); return next })
}

/** 지난 뉴스 목록: 필터는 URL에서 읽어 서버 검색 파라미터로 보내고, 더 보기로 다음 페이지를 이어 붙인다. */
export function ReplayLibraryRoute({ preview }: { preview?: ReplayPreviewState }) {
  const [params] = useSearchParams()
  const clearPreview = useClearPreviewState()
  // 시장 대상 옵션: 실패하면 필터만 숨기고 목록은 target 없이 조회한다. 별도 오류 안내는 띄우지 않는다.
  const targets = useQuery({
    queryKey: ['replay', 'market-targets', replayUsesFixtures ? 'fixtures' : 'api'],
    queryFn: ({ signal }) => getReplayMarketTargets(signal),
    retry: false,
    staleTime: 300_000,
  })
  const targetOptions = targets.data ?? []
  const filters = readReplayFilters(params, targetOptions)
  // URL에 target이 있으면 옵션 조회가 끝난 뒤 조회한다. 필터 없는 목록이 먼저 보였다가 바뀌는 것과 중복 요청을 막는다.
  const waitingForTargets = params.has('target') && targets.isPending
  const query = useInfiniteQuery({
    queryKey: replayNewsKey(filters),
    enabled: !waitingForTargets,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => getReplayNewsPage(filters, pageParam, signal),
    getNextPageParam: last => last.hasNext ? last.page + 1 : undefined,
    retry: false,
    staleTime: 60_000,
  })
  const items = [...new Map((query.data?.pages.flatMap(page => page.content) ?? []).map(item => [item.id, item])).values()]
  const error = preview === 'error' ? new ApiError(500) : !query.data && query.isError ? query.error : null
  const loading = preview === 'loading' || (!error && query.isPending)
  const empty = preview === 'empty'
  return <ReplayLibrary
    state={loading ? 'loading' : error ? 'error' : 'ready'}
    error={error}
    retry={() => { if (preview) clearPreview(); void query.refetch() }}
    retrying={query.isRefetching}
    items={empty ? [] : items}
    totalElements={empty ? 0 : query.data?.pages[0]?.totalElements ?? null}
    hasNext={!empty && query.hasNextPage}
    loadingMore={query.isFetchingNextPage}
    moreError={!empty && query.isFetchNextPageError}
    onMore={() => void query.fetchNextPage()}
    targetOptions={targetOptions}
    fixtures={replayUsesFixtures}
  />
}

/** 지난 뉴스 상세: GET /news/{newsId}. 조회만으로 세션을 만들지 않는다. */
export function ReplayDetailRoute({ preview, renderStart }: { preview?: ReplayPreviewState; renderStart?: (news: ReplayNews) => ReactNode }) {
  const { newsId = '' } = useParams()
  const { search } = useLocation()
  const clearPreview = useClearPreviewState()
  const query = useQuery({ queryKey: ['replay', 'news', 'detail', newsId], queryFn: ({ signal }) => getReplayNews(newsId, signal), retry: false, staleTime: 60_000 })
  const back = <Link to={`/replay${search}`} className={linkClass}>지난 뉴스 목록으로</Link>
  const previewError = preview === 'error' ? new ApiError(500) : preview === 'empty' ? new ApiError(404) : null
  if (preview === 'loading' || (!previewError && query.isPending)) return <Shell section="/explore"><Notice title="당시 뉴스를 불러오고 있어요">잠시 기다려 주세요.</Notice>{back}</Shell>
  const error = previewError ?? (query.data ? null : query.error)
  if (error || !query.data) return <Shell section="/explore">
    <ReplayErrorNotice error={error ?? new ApiError(404)} titles={{ unsupported: '이 뉴스는 지난 뉴스로 학습할 수 없어요', notFound: '이 지난 뉴스를 찾을 수 없어요', other: '당시 뉴스를 불러오지 못했어요' }} retry={() => { if (preview) clearPreview(); void query.refetch() }} busy={query.isFetching}>{back}</ReplayErrorNotice>
  </Shell>
  return <ReplayNewsDetail news={query.data} fixtures={replayUsesFixtures} start={renderStart?.(query.data)} />
}

function ReplayNotReady() {
  return <Shell section="/explore"><PageTitle label="REPLAY" title="Replay 예측은 준비 중이에요" description="지난 뉴스의 사실 브리핑은 목록에서 볼 수 있어요. 예측과 결과 공개는 준비가 끝나면 이용할 수 있어요." /><Link to="/replay" className={linkClass}>지난 뉴스 목록으로</Link></Shell>
}

export default function ReplayApiRoutes() {
  return <Routes>
    <Route path="/" element={<ReplayLibraryRoute />} />
    <Route path=":newsId" element={<ReplayDetailRoute renderStart={news => <Link to={`/replay/${news.id}/predict`} className={`${linkClass} w-full bg-brand-primary text-white`}>예측 시작하기</Link>} />} />
    <Route path=":newsId/predict" element={<ReplayEditorRoute />} />
    <Route path="session/:sessionId/feedback" element={<ReplayFeedbackRoute />} />
    <Route path="session/:sessionId/final-feedback" element={<ReplayFeedbackRoute final />} />
    <Route path="*" element={<ReplayNotReady />} />
  </Routes>
}
