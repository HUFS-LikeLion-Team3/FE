import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { learningApi } from '@/features/learning/api/service'
import { formatTime } from '@/features/learning/api/page-data'
import { topics, type ExploreNews } from './api'

export function NewsRow({ news }: { news: ExploreNews }) {
  const sources = useQuery({ queryKey: ['news', 'sources', news.id], queryFn: ({ signal }) => learningApi.sources(news.id, signal), retry: false, staleTime: 300_000 })
  const candidates = useQuery({ queryKey: ['news', 'candidates', news.id], queryFn: ({ signal }) => learningApi.candidates(news.id, signal), retry: false, staleTime: 300_000 })
  const categories = new Set(candidates.data?.candidates.map(candidate => candidate.marketCategory))
  const market = [categories.has('korea_equity') ? '국내' : '', categories.has('us_equity') ? '미국' : ''].filter(Boolean).join('·')
  const topic = topics.find(topic => topic.key === news.category)?.label ?? news.category
  const publisher = sources.data?.sources.find(source => source.isPrimary)?.publisher ?? (sources.isPending ? '출처 확인 중' : '발행처 정보 없음')
  return <li>
    <Link to={`/news/${news.id}`} className="flex flex-col gap-3 border-b border-border-default pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary">
      <p className="text-meta text-text-muted">{market && `${market} · `}{topic} / {publisher} · {formatTime(news.publishedAt)}</p>
      <h3 className="text-news-title">{news.title}</h3>
      <p className="text-ui text-text-secondary">{news.briefing}</p>
    </Link>
    {(sources.isError || candidates.isError) && <Button variant="text" onClick={() => { if (sources.isError) void sources.refetch(); if (candidates.isError) void candidates.refetch() }}>출처·시장 정보 다시 불러오기</Button>}
  </li>
}
