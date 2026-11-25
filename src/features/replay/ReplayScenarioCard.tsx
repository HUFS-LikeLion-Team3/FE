import { briefingSummary } from '@/features/news/briefing'
import { Link } from 'react-router-dom'
import { linkClass } from '../learning/components/PagePrimitives'
import { formatReplayMonth, replayCategoryLabel, type ReplayNewsItem } from './api'

export function ReplayScenarioCard({ news, search }: { news: ReplayNewsItem; search: string }) {
  return <article className="min-w-0 space-y-4 rounded-card bg-surface-subtle p-6">
    <p className="text-meta text-text-muted">{replayCategoryLabel(news.category)} · {formatReplayMonth(news.referenceAt)}</p>
    <h2 className="text-section">{news.title}</h2>
    {news.briefing && <p className="line-clamp-3 whitespace-pre-line text-ui text-text-secondary">{briefingSummary(news.briefing)}</p>}
    <Link to={`/replay/${encodeURIComponent(news.id)}${search}`} className={`${linkClass} w-full border border-border-default bg-surface-canvas`}>당시 뉴스 살펴보기<span className="sr-only"> · {news.title}</span></Link>
  </article>
}
