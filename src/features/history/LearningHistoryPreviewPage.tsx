/**
 * DEV 전용: 목 데이터로 학습 기록 페이지 UI를 확인합니다.
 * /dev/learning 에서 접근합니다. 모든 상태의 카드와 필터 동작을 확인할 수 있습니다.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilterChip } from '@/components/ui/FilterChip'
import { Shell } from '@/features/learning/components/PagePrimitives'
import {
  getSessionDisplay,
  STATUS_FILTERS,
  type LearningSession,
  type NewsItem,
  type StatusFilter,
} from './api'

const secondaryLinkClass =
  'inline-flex min-h-12 w-full items-center justify-center rounded-control border border-border-default bg-surface-canvas px-4 py-3 font-sans text-[15px] font-medium text-text-primary hover:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pressed'

const TONE_CLASS: Record<'brand' | 'warning' | 'muted', string> = {
  brand: 'text-brand-primary',
  warning: 'text-status-warning',
  muted: 'text-text-muted',
}

const now = Date.now()
const iso = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString()

// 상태별로 하나씩 보여주는 목 세션
const MOCK_SESSIONS: LearningSession[] = [
  { id: 's-observing', newsId: 'n-rate', sessionType: 'live', status: 'observing', submittedAt: iso(1), completedAt: null, createdAt: iso(2), updatedAt: iso(0) },
  { id: 's-drafting', newsId: 'n-employment', sessionType: 'live', status: 'drafting', submittedAt: null, completedAt: null, createdAt: iso(1), updatedAt: iso(1) },
  { id: 's-reflection', newsId: 'n-energy', sessionType: 'live', status: 'reflection_pending', submittedAt: iso(3), completedAt: null, createdAt: iso(4), updatedAt: iso(2) },
  { id: 's-baseline', newsId: 'n-fx', sessionType: 'live', status: 'baseline_pending', submittedAt: iso(1), completedAt: null, createdAt: iso(1), updatedAt: iso(1) },
  { id: 's-completed', newsId: 'n-semi', sessionType: 'live', status: 'completed', submittedAt: iso(10), completedAt: iso(5), createdAt: iso(11), updatedAt: iso(5) },
]

const MOCK_NEWS: NewsItem[] = [
  { id: 'n-rate', title: '정책금리 동결 발표', category: 'rate', briefing: '', contentType: 'live', replayStatus: 'not_eligible', publishedAt: iso(2) },
  { id: 'n-employment', title: '고용 지표 발표', category: 'employment', briefing: '', contentType: 'live', replayStatus: 'not_eligible', publishedAt: iso(1) },
  { id: 'n-energy', title: '에너지 수급 발표', category: 'energy', briefing: '', contentType: 'live', replayStatus: 'not_eligible', publishedAt: iso(4) },
  { id: 'n-fx', title: '환율 동향 발표', category: 'exchange_rate', briefing: '', contentType: 'live', replayStatus: 'not_eligible', publishedAt: iso(1) },
  { id: 'n-semi', title: '반도체 수출 발표', category: 'semiconductor', briefing: '', contentType: 'live', replayStatus: 'not_eligible', publishedAt: iso(11) },
]

export default function LearningHistoryPreviewPage() {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const newsMap = useMemo(() => new Map(MOCK_NEWS.map((n) => [n.id, n])), [])
  const filtered =
    filter === 'all' ? MOCK_SESSIONS : MOCK_SESSIONS.filter((s) => s.status === filter)

  return (
    <Shell>
      <div className="rounded-card bg-brand-subtle px-4 py-2 font-mono text-[12px] text-brand-primary">
        DEV 미리보기 · 목 데이터 (모든 상태 카드)
      </div>

      <div className="space-y-4">
        <p className="font-sans text-[11px] font-semibold tracking-[0.18em] text-brand-primary">
          MY&nbsp;WORKBOOK
        </p>
        <h1 className="text-hero text-text-primary">생각이 쌓이는 기록</h1>
        <p className="font-sans text-[15px] text-text-secondary">
          처음의 판단부터 관찰과 회고까지, 나의 학습을 이어가세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-3" role="group" aria-label="상태 필터">
        {STATUS_FILTERS.map(({ key, label }) => (
          <FilterChip key={key} selected={filter === key} onClick={() => setFilter(key)}>
            {label}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-card bg-surface-subtle px-5 py-8 text-center">
          <p className="font-sans text-[14px] text-text-secondary">
            이 상태의 학습 기록이 없어요.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((session) => {
            const display = getSessionDisplay(session.status)
            const news = newsMap.get(session.newsId)
            return (
              <li key={session.id} className="rounded-card bg-surface-subtle p-6 space-y-3">
                <p className={`font-sans text-[12px] font-semibold ${TONE_CLASS[display.tone]}`}>
                  {display.label}
                </p>
                <h3 className="font-sans text-[18px] font-semibold text-text-primary leading-snug">
                  {news?.title ?? '학습한 뉴스'}
                </h3>
                <p className="font-sans text-[13px] text-text-muted">
                  마지막 활동 {new Date(session.updatedAt).toLocaleDateString('ko-KR')}
                </p>
                <Link to={display.href(session)} className={secondaryLinkClass}>
                  {display.action}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Shell>
  )
}
