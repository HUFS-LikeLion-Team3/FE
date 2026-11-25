import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { requestLearningData as request } from '@/features/learning/api/service'
import { getSessionDisplay, type LearningSession, type SessionStatus } from './api'

// 홈·뉴스 탐색에서 기사별로 기존 Live 세션을 찾기 위한 조회.
// 기사마다 세션을 조회하지 않고, 현재 사용자의 Live 세션 목록을 페이지 단위로 한 번에 읽어 기사 ID로 매칭한다.
// 키가 'learning-sessions'로 시작하므로 세션 생성·회고 저장 시의 기존 invalidate와 로그인·로그아웃 시 cache clear가 그대로 적용된다.

const PAGE_SIZE = 100
const MAX_PAGES = 5

const sessionPageSchema = z.object({
  content: z.array(z.object({
    id: z.string().uuid(),
    newsId: z.string().uuid(),
    sessionType: z.enum(['live', 'replay']),
    status: z.enum(['drafting', 'baseline_pending', 'observing', 'reflection_pending', 'completed']),
    submittedAt: z.string().nullable(),
    completedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
  hasNext: z.boolean(),
})

export type LiveSessionIndex = {
  byNewsId: Map<string, LearningSession>
  /** false면 세션이 너무 많아 일부만 읽었으므로, 목록에 없는 기사를 '세션 없음'으로 단정하지 않는다. */
  complete: boolean
}

export const liveSessionIndexKey = ['learning-sessions', 'live-by-news'] as const

export async function loadLiveSessionIndex(signal?: AbortSignal): Promise<LiveSessionIndex> {
  const byNewsId = new Map<string, LearningSession>()
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await request(`/learning-sessions?${new URLSearchParams({ sessionType: 'live', page: String(page), size: String(PAGE_SIZE) })}`, sessionPageSchema, { signal })
    // 뉴스 상세(page-data)와 같은 기준으로, 기사별 첫 번째 Live 세션을 사용한다.
    for (const session of data.content) if (session.sessionType === 'live' && !byNewsId.has(session.newsId)) byNewsId.set(session.newsId, session)
    if (!data.hasNext) return { byNewsId, complete: true }
  }
  return { byNewsId, complete: false }
}

export function useLiveSessionIndex() {
  return useQuery({ queryKey: liveSessionIndexKey, queryFn: ({ signal }) => loadLiveSessionIndex(signal), retry: false, staleTime: 30_000 })
}

const SHORT_STATUS: Record<SessionStatus, string> = {
  drafting: '작성 중',
  baseline_pending: '기준값 확정 중',
  observing: '관찰 중',
  reflection_pending: '회고 대기',
  completed: '학습 완료',
}

export type NewsSessionLink = {
  /** new: 세션 없음 확인 / continue: 진행 중 / completed: 완료 / unknown: 조회 중·실패·일부만 확인 */
  kind: 'new' | 'continue' | 'completed' | 'unknown'
  href: string
  /** 기사 옆에 붙는 상태 라벨. 세션이 없거나 확인하지 못했으면 null */
  badge: string | null
  /** 대표 뉴스 버튼 문구 */
  action: string
}

export function newsSessionLink(newsId: string, index: LiveSessionIndex | undefined): NewsSessionLink {
  const session = index?.byNewsId.get(newsId)
  if (session?.status === 'completed') return { kind: 'completed', href: getSessionDisplay('completed').href(session), badge: '학습 완료 · 결과 보기', action: '결과 보기' }
  if (session) return { kind: 'continue', href: getSessionDisplay(session.status).href(session), badge: `이어서 보기 · ${SHORT_STATUS[session.status]}`, action: '이어서 보기' }
  if (index?.complete) return { kind: 'new', href: `/news/${newsId}`, badge: null, action: '뉴스 읽고 예측하기' }
  return { kind: 'unknown', href: `/news/${newsId}`, badge: null, action: '뉴스 보기' }
}
