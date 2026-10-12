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
