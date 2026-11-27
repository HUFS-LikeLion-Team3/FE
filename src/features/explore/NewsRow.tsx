import { briefingSummary } from '@/features/news/briefing'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { learningApi } from '@/features/learning/api/service'
import { formatTime } from '@/features/learning/api/page-data'
import { topics, type ExploreNews } from './api'
import { NewsSessionBadge } from '@/features/home/NewsSessionBadge'
import { PublisherSkeleton } from '@/features/home/NewsPublisher'
import { newsSessionLink, type LiveSessionIndex } from '@/features/home/news-session'

export function NewsRow({ news, sessionIndex }: { news: ExploreNews; sessionIndex: LiveSessionIndex | undefined }) {
  const link = newsSessionLink(news.id, sessionIndex)
  const sources = useQuery({ queryKey: ['news', 'sources', news.id], queryFn: ({ signal }) => learningApi.sources(news.id, signal), retry: false, staleTime: 300_000 })
  const candidates = useQuery({ queryKey: ['news', 'candidates', news.id], queryFn: ({ signal }) => learningApi.candidates(news.id, signal), retry: false, staleTime: 300_000 })
  const categories = new Set(candidates.data?.candidates.map(candidate => candidate.marketCategory))
  const market = [categories.has('korea_equity') ? '국내' : '', categories.has('us_equity') ? '미국' : ''].filter(Boolean).join('·')
  const topic = topics.find(topic => topic.key === news.category)?.label ?? news.category
  const primaryPublisher = sources.data?.sources.find(source => source.isPrimary)?.publisher
  const publisher = primaryPublisher ?? (sources.isPending ? <PublisherSkeleton /> : '발행처 정보 없음')
  return <li className="rounded-card border border-border-default bg-surface-canvas">
    <Link to={link.href} className="group flex min-w-0 flex-col gap-3 rounded-card p-4 focus-visible:outline-2 focus-visible:outline-brand-primary sm:p-5">
      <p className="text-meta text-text-muted">{market && `${market} · `}{topic} / {publisher} · {formatTime(news.publishedAt)}</p>
      <NewsSessionBadge link={link} />
      <h3 className="break-words text-news-title group-hover:text-brand-primary">{news.title}</h3>
      <p className="line-clamp-3 break-words text-ui text-text-secondary">{briefingSummary(news.briefing)}</p>
    </Link>
    {(sources.isError || candidates.isError) && <div className="px-4 pb-3 sm:px-5"><Button variant="text" onClick={() => { if (sources.isError) void sources.refetch(); if (candidates.isError) void candidates.refetch() }}>출처·시장 정보 다시 불러오기</Button></div>}
  </li>
}
