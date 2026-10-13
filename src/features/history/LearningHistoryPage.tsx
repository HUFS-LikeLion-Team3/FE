import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ApiError } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Shell } from '@/features/learning/components/PagePrimitives'
import {
  getLearningSessions,
  getNewsList,
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

// ─── 세션 카드 ────────────────────────────────────────────────────────────────

function SessionCard({
  session,
  news,
}: {
  session: LearningSession
  news: NewsItem | undefined
}) {
  const display = getSessionDisplay(session.status)

  return (
    <li className="rounded-card bg-surface-subtle p-6 space-y-3">
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
}

// ─── 학습 기록 페이지 ─────────────────────────────────────────────────────────

export default function LearningHistoryPage() {
  const [filter, setFilter] = useState<StatusFilter>('all')

  // 전체 세션을 받아 클라이언트에서 필터링한다 (필터 전환마다 재조회하지 않음).
  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['learning-sessions', 'history'],
    queryFn: () => getLearningSessions({ size: 100 }),
  })

  // 뉴스 제목 매칭용 목록 (실패해도 카드는 폴백 제목으로 표시)
  const { data: newsList = [] } = useQuery({
    queryKey: ['news', 'history-titles'],
    queryFn: () => getNewsList(100),
  })

  const newsMap = useMemo(
    () => new Map(newsList.map((n) => [n.id, n])),
    [newsList],
  )

  const filteredSessions = useMemo(
    () => (filter === 'all' ? sessions : sessions.filter((s) => s.status === filter)),
    [sessions, filter],
  )

  const isUnauthorized = error instanceof ApiError && error.status === 401

  return (
    <Shell>
      {/* 페이지 헤더 */}
      <div className="space-y-4">
        <p className="font-sans text-[11px] font-semibold tracking-[0.18em] text-brand-primary">
          MY&nbsp;WORKBOOK
        </p>
        <h1 className="text-hero text-text-primary">생각이 쌓이는 기록</h1>
        <p className="font-sans text-[15px] text-text-secondary">
          처음의 판단부터 관찰과 회고까지, 나의 학습을 이어가세요.
        </p>
      </div>

      {/* 상태 필터 */}
      <div className="flex flex-wrap gap-3" role="group" aria-label="상태 필터">
        {STATUS_FILTERS.map(({ key, label }) => (
          <FilterChip
            key={key}
            selected={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      {/* 상태별 렌더링 */}
      {isLoading ? (
        <p role="status" className="font-sans text-[14px] text-text-muted">
          학습 기록을 불러오는 중…
        </p>
      ) : isError ? (
        <div role="alert" className="space-y-3 rounded-card bg-status-error-bg px-5 py-4">
          <p className="font-sans text-[14px] font-medium text-status-error">
            {isUnauthorized
              ? '로그인이 필요하거나 만료됐어요.'
              : '학습 기록을 불러오지 못했어요.'}
          </p>
          {isUnauthorized ? (
            <Link to="/login" className={secondaryLinkClass}>
              로그인하러 가기
            </Link>
          ) : (
            <Button variant="secondary" onClick={() => refetch()}>
              다시 시도하기
            </Button>
          )}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-card bg-surface-subtle px-5 py-8 text-center">
          <p className="font-sans text-[14px] text-text-secondary">
            {filter === 'all'
              ? '아직 학습 기록이 없어요. 오늘의 뉴스로 첫 기록을 시작해 보세요.'
              : '이 상태의 학습 기록이 없어요.'}
          </p>
          {filter === 'all' && (
            <Link
              to="/"
              className="mt-4 inline-flex font-sans text-[14px] text-brand-primary hover:underline"
            >
              오늘의 뉴스 보러 가기
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              news={newsMap.get(session.newsId)}
            />
          ))}
        </ul>
      )}
    </Shell>
  )
}
