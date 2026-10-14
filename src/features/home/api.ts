import { z } from 'zod'
import { request } from '@/lib/api-client'

// ─── 뉴스 목록 ────────────────────────────────────────────────────────────────

const newsItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  briefing: z.string(),
  contentType: z.enum(['live', 'replay']),
  replayStatus: z.string(),
  publishedAt: z.string(),
})

const newsListResponseSchema = z.object({
  content: z.array(newsItemSchema),
  page: z.number(),
  size: z.number(),
  hasNext: z.boolean(),
})

export type NewsItem = z.infer<typeof newsItemSchema>

export type NewsListParams = {
  category?: string
  contentType?: 'live' | 'replay'
  sort?: 'latest' | 'recommended'
  page?: number
  size?: number
}

/**
 * 뉴스 목록 조회
 * GET /api/v1/news
 */
export async function getNewsList(params: NewsListParams = {}): Promise<NewsItem[]> {
  const query = new URLSearchParams()
  if (params.category) query.set('category', params.category)
  if (params.contentType) query.set('contentType', params.contentType)
  if (params.sort) query.set('sort', params.sort)
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.size !== undefined) query.set('size', String(params.size))

  const qs = query.toString()
  const data = await request(
    `/news${qs ? `?${qs}` : ''}`,
    newsListResponseSchema,
  )
  return data.content
}

// ─── 학습 세션 목록 ───────────────────────────────────────────────────────────

const sessionStatusSchema = z.enum([
  'drafting',
  'baseline_pending',
  'observing',
  'reflection_pending',
  'completed',
])

const learningSessionSchema = z.object({
  id: z.string().uuid(),
  newsId: z.string().uuid(),
  sessionType: z.enum(['live', 'replay']),
  status: sessionStatusSchema,
  submittedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const sessionListResponseSchema = z.object({
  content: z.array(learningSessionSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
})

export type LearningSession = z.infer<typeof learningSessionSchema>
export type SessionStatus = z.infer<typeof sessionStatusSchema>

/**
 * "이어서 학습하기"에 노출할 진행 중 상태와 우선순위.
 * 명세 흐름: drafting → baseline_pending → observing → reflection_pending → completed
 * 작성 중(drafting)을 가장 먼저, 회고 대기(reflection_pending)를 가장 나중에 노출한다.
 * completed는 "진행 중"이 아니므로 제외한다.
 */
export const IN_PROGRESS_STATUS_PRIORITY: SessionStatus[] = [
  'drafting',
  'baseline_pending',
  'observing',
  'reflection_pending',
]

type SessionDisplay = {
  /** 카드 상단 상태 라벨 */
  label: string
  /** 라벨 색상 클래스 */
  tone: 'brand' | 'warning' | 'muted'
  /** '결과 보기' 버튼이 이동할 경로를 세션으로부터 계산 */
  href: (session: LearningSession) => string
  /** 액션 버튼 문구 */
  action: string
}

const SESSION_DISPLAY: Record<SessionStatus, SessionDisplay> = {
  drafting: {
    label: '작성 중 · 예측을 마저 작성해요',
    tone: 'brand',
    href: (s) => `/news/${s.newsId}/predict`,
    action: '이어서 작성하기',
  },
  baseline_pending: {
    label: '기준값 확정 중 · 결과를 준비하고 있어요',
    tone: 'muted',
    href: (s) => `/learning/${s.id}/feedback`,
    action: '학습 보기',
  },
  observing: {
    label: '관찰 중 · 새 결과가 있어요',
    tone: 'warning',
    href: (s) => `/learning/${s.id}/feedback`,
    action: '결과 보기',
  },
  reflection_pending: {
    label: '회고 대기 · 돌아볼 차례예요',
    tone: 'brand',
    href: (s) => `/learning/${s.id}/final-feedback`,
    action: '회고하러 가기',
  },
  completed: {
    label: '학습 완료',
    tone: 'muted',
    href: (s) => `/learning/${s.id}/final-feedback`,
    action: '다시 보기',
  },
}

/** 세션 상태에 맞는 표시 정보(문구/색상/경로/액션)를 반환한다. */
export function getSessionDisplay(status: SessionStatus): SessionDisplay {
  return SESSION_DISPLAY[status]
}

/**
 * 진행 중 세션 목록에서 우선순위가 가장 높은 세션 1개를 고른다.
 * 같은 우선순위면 updatedAt이 최신인 세션을 고른다.
 */
export function pickTopInProgress(sessions: LearningSession[]): LearningSession | null {
  const candidates = sessions.filter((s) =>
    IN_PROGRESS_STATUS_PRIORITY.includes(s.status),
  )
  if (candidates.length === 0) return null
  return candidates.sort((a, b) => {
    const pa = IN_PROGRESS_STATUS_PRIORITY.indexOf(a.status)
    const pb = IN_PROGRESS_STATUS_PRIORITY.indexOf(b.status)
    if (pa !== pb) return pa - pb
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })[0]
}

export type SessionListParams = {
  newsId?: string
  status?: SessionStatus
  sessionType?: 'live' | 'replay'
  page?: number
  size?: number
}

/**
 * 학습 세션 목록 조회
 * GET /api/v1/learning-sessions
 */
export async function getLearningSessions(
  params: SessionListParams = {},
): Promise<LearningSession[]> {
  const query = new URLSearchParams()
  if (params.newsId) query.set('newsId', params.newsId)
  if (params.status) query.set('status', params.status)
  if (params.sessionType) query.set('sessionType', params.sessionType)
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.size !== undefined) query.set('size', String(params.size))

  const qs = query.toString()
  const data = await request(
    `/learning-sessions${qs ? `?${qs}` : ''}`,
    sessionListResponseSchema,
  )
  return data.content
}
