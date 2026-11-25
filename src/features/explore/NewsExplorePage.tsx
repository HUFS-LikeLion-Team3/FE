import { LoadingRows } from '@/components/ui/LoadingSkeleton'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { ApiError } from '@/lib/api-client'
import { replayApiEnabled } from '@/features/replay/api'
import { Shell, PageTitle, Notice, linkClass } from '@/features/learning/components/PagePrimitives'
import { getExploreNews, markets, topics, recentNewsKey, type Market, type Topic } from './api'
import { NewsRow } from './NewsRow'
import { isMockLearningEnabled } from '@/features/learning/api/service'

function NewsError({ error, retry, busy }: { error: Error; retry: () => void; busy: boolean }) {
  const loginRequired = error instanceof ApiError && error.status === 401
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
  return <Notice title={loginRequired ? '로그인이 필요해요' : '뉴스를 불러오지 못했어요'} error><p>{error.message}</p>{loginRequired ? <Link to={`/login?returnTo=${returnTo}`} className={linkClass}>로그인하기</Link> : <Button variant="secondary" loading={busy} onClick={retry}>다시 불러오기</Button>}</Notice>
}

export default function NewsExplorePage() {
  const [params, setParams] = useSearchParams()
  const client = useQueryClient()
  const market: Market = markets.find(option => option.key === params.get('market'))?.key ?? 'all'
  const topic: Topic = topics.find(option => option.key === params.get('category'))?.key ?? 'all'
  const highlights = useQuery({ queryKey: ['news', 'explore', 'highlights'], queryFn: ({ signal }) => getExploreNews({ sort: 'recommended', size: 3 }, signal), retry: false, staleTime: 60_000 })
  const recent = useInfiniteQuery({ queryKey: recentNewsKey(market, topic), initialPageParam: 0, queryFn: ({ signal, pageParam }) => getExploreNews({ market, topic, page: pageParam }, signal), getNextPageParam: last => last.hasNext ? last.page + 1 : undefined, retry: false, staleTime: 60_000 })
  const highlightedNews = highlights.data?.content ?? []
  const highlightedIds = new Set(highlightedNews.map(item => item.id))
  const recentItems = recent.data?.pages.flatMap(page => page.content) ?? []
  const news = [...new Map(recentItems.filter(item => !highlightedIds.has(item.id)).map(item => [item.id, item])).values()]
  const changeFilters = (nextMarket: Market, nextTopic: Topic) => {
    if (nextMarket === market && nextTopic === topic) return
    client.removeQueries({ queryKey: recentNewsKey(nextMarket, nextTopic), exact: true })
    const next = new URLSearchParams(params)
    next.delete('page')
    if (nextMarket === 'all') next.delete('market'); else next.set('market', nextMarket)
    if (nextTopic === 'all') next.delete('category'); else next.set('category', nextTopic)
    setParams(next, { preventScrollReset: true })
  }
  return <Shell section="/explore">
    {import.meta.env.DEV && isMockLearningEnabled() && <Notice title="개발용 목 데이터">개발용 예시이며 실제 서버의 뉴스·조회 결과가 아닙니다.</Notice>}
    <PageTitle label="NEWS JOURNAL" title="경제의 흐름을 읽는 시간" description="선별한 핵심 뉴스와 최근 경제 소식을 살펴보세요." />
    {(import.meta.env.DEV || replayApiEnabled) && <nav className="flex gap-2" aria-label="뉴스 시점"><Link to="/explore" aria-current="page" className={`${linkClass} min-w-40 rounded-pill border border-brand-primary bg-brand-subtle text-brand-primary`}>✓ 오늘의 뉴스</Link><Link to="/replay" className={`${linkClass} min-w-40 rounded-pill border border-border-default`}>지난 뉴스</Link></nav>}
    <section aria-labelledby="highlight-news-title" className="space-y-8"><h2 id="highlight-news-title" className="text-section">추천 핵심 뉴스</h2>
      {!highlights.data ? highlights.isPending ? <LoadingRows label="뉴스를 불러오는 중" /> : <NewsError error={highlights.error!} busy={highlights.isFetching} retry={() => void highlights.refetch()} /> : <>
        {highlights.isError && <NewsError error={highlights.error} busy={highlights.isFetching} retry={() => void highlights.refetch()} />}
        {highlightedNews.length ? <ul className="space-y-8">{highlightedNews.map(item => <NewsRow key={item.id} news={item} />)}</ul> : <Notice title="핵심 뉴스가 아직 없어요">새로운 뉴스가 준비되면 이곳에서 확인할 수 있어요.</Notice>}
      </>}
    </section>
    <section aria-labelledby="recent-news-title" className="space-y-8"><h2 id="recent-news-title" className="text-section">최근 경제 뉴스</h2>
      <fieldset className="space-y-8"><legend className="sr-only">뉴스 필터</legend><div className="space-y-8" role="group" aria-label="시장"><p className="text-control font-medium">시장</p><div className="flex gap-2">{markets.map(option => <FilterChip key={option.key} className={market === option.key ? 'min-w-[84px] [&>span:first-child]:w-auto' : 'min-w-20'} selected={market === option.key} onClick={() => changeFilters(option.key, topic)}>{option.label}</FilterChip>)}</div></div><div className="space-y-8" role="group" aria-label="주제"><p className="text-control font-medium">주제</p><div className="flex flex-wrap gap-2">{topics.map(option => <FilterChip key={option.key} className={topic === option.key ? 'min-w-[84px] [&>span:first-child]:w-auto' : option.label.length > 2 ? 'min-w-[85px]' : 'min-w-20'} selected={topic === option.key} onClick={() => changeFilters(market, option.key)}>{option.label}</FilterChip>)}</div></div></fieldset>
      {!recent.data ? recent.isPending ? <LoadingRows label="뉴스를 불러오는 중" /> : <NewsError error={recent.error!} busy={recent.isFetching} retry={() => void recent.refetch()} /> : <>
        {news.length > 0 && <ul className="space-y-8">{news.map(item => <NewsRow key={item.id} news={item} />)}</ul>}
        {!news.length && !recent.isError && (recentItems.length ? (
          <Notice title="추천 핵심 뉴스에서 이미 볼 수 있어요">
            {recent.hasNextPage ? '뉴스 더 보기에서 다음 목록을 확인해 주세요.' : '현재 조건의 최근 뉴스는 모두 위에 표시돼 있어요.'}
          </Notice>
        ) : <Notice title={market !== 'all' || topic !== 'all' ? '조건에 맞는 뉴스가 없어요' : '최근 뉴스가 아직 없어요'}>다른 시장이나 주제를 선택하거나 잠시 후 다시 확인해 주세요.{market !== 'all' || topic !== 'all' ? <Button variant="text" onClick={() => changeFilters('all', 'all')}>필터 초기화</Button> : <Button variant="text" loading={recent.isFetching} onClick={() => void recent.refetch()}>새로 불러오기</Button>}</Notice>)}
        {recent.isError && <NewsError error={recent.error} busy={recent.isFetching} retry={() => { if (recent.isFetchNextPageError) void recent.fetchNextPage(); else void recent.refetch() }} />}
        {(recent.hasNextPage || recent.isFetchNextPageError) && <Button className="w-full" variant="secondary" loading={recent.isFetching} onClick={() => void recent.fetchNextPage()}>{recent.isFetchNextPageError ? '추가 뉴스 다시 불러오기' : '뉴스 더 보기'}</Button>}
      </>}
    </section>
  </Shell>
}
