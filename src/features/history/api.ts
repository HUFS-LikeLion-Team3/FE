import { z } from 'zod'
import { request } from '@/lib/api-client'

// ─── 학습 세션 ────────────────────────────────────────────────────────────────

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

export type SessionListParams = {
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

// ─── 뉴스 목록 (세션 → 뉴스 제목 매칭용) ────────────────────────────────────────

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

/**
 * 뉴스 목록 조회 (세션 카드의 뉴스 제목·카테고리 매칭에 사용)
 * GET /api/v1/news
 */
export async function getNewsList(size = 100): Promise<NewsItem[]> {
  const data = await request(`/news?size=${size}`, newsListResponseSchema)
  return data.content
}

// ─── 상태별 표시 메타 ─────────────────────────────────────────────────────────

type SessionDisplay = {
  /** 카드 상단 상태 라벨 */
  label: string
  /** 라벨 색상 */
  tone: 'brand' | 'warning' | 'muted'
  /** '결과 보기' 등 액션 버튼 문구 */
  action: string
  /** 액션 버튼이 이동할 경로 */
  href: (session: LearningSession) => string
}

const SESSION_DISPLAY: Record<SessionStatus, SessionDisplay> = {
  drafting: {
    label: '작성 중',
    tone: 'brand',
    action: '작성 이어가기',
    href: (s) => `/news/${s.newsId}/predict`,
  },
  baseline_pending: {
    label: '기준값 확정 중',
    tone: 'muted',
    action: '결과 보기',
    href: (s) => `/learning/${s.id}/feedback`,
  },
  observing: {
    label: '관찰 중',
    tone: 'warning',
    action: '결과 보기',
    href: (s) => `/learning/${s.id}/feedback`,
  },
  reflection_pending: {
    label: '회고 대기',
    tone: 'brand',
    action: '회고하러 가기',
    href: (s) => `/learning/${s.id}/final-feedback`,
  },
  completed: {
    label: '학습 완료',
    tone: 'muted',
    action: '기록 보기',
    href: (s) => `/learning/${s.id}/final-feedback`,
  },
}

export function getSessionDisplay(status: SessionStatus): SessionDisplay {
  return SESSION_DISPLAY[status]
}

// ─── 상태 필터 ────────────────────────────────────────────────────────────────

export type StatusFilter = 'all' | SessionStatus

export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'drafting', label: '작성 중' },
  { key: 'baseline_pending', label: '기준값 확정 중' },
  { key: 'observing', label: '관찰 중' },
  { key: 'reflection_pending', label: '회고 대기' },
  { key: 'completed', label: '학습 완료' },
]
