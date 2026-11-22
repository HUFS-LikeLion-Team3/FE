import { z } from 'zod'
import { ApiError, parseResponse, request } from '@/lib/api-client'
import { categoryLabel } from '../news/category'
import type { Target } from '../learning/model'

// ─── 시안용 시나리오 (개발 환경 데모 전용) ─────────────────────────────────────
// 대상 선택·예측·최초 피드백 데모와 결과 미리보기가 쓰는 FE 표시 모델이다. HTTP 계약이 아니다.
export const replayCategoryKeys = ['rate_policy', 'price', 'employment', 'fx_export', 'energy', 'semiconductor'] as const
export type ReplayCategoryKey = typeof replayCategoryKeys[number]
export const replayCategories = [
  { key: 'rate_policy', label: '금리·통화정책' }, { key: 'price', label: '물가' },
  { key: 'employment', label: '고용·경기' }, { key: 'fx_export', label: '환율·수출' },
  { key: 'energy', label: '에너지·원자재' }, { key: 'semiconductor', label: '반도체 업황' },
] satisfies { key: ReplayCategoryKey; label: string }[]
export const replayTargetIds = ['dollar', 'yield', 'nasdaq'] as const
export const replayTargets: Target[] = [
  { id: 'dollar', marketTargetId: 'dollar-market', name: '달러 인덱스', kind: 'index' },
  { id: 'yield', marketTargetId: 'yield-market', name: '미국 10년물', kind: 'rate' },
  { id: 'nasdaq', marketTargetId: 'nasdaq-market', name: 'NASDAQ 100', kind: 'index' },
]
export const replayScenarioSchema = z.object({
  id: z.string().min(1), category: z.enum(replayCategoryKeys), title: z.string().min(1),
  referenceMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  keywords: z.string(), summary: z.string(),
  facts: z.array(z.string()).min(1), announcement: z.string().nullable(),
  sourceNote: z.string(), targetIds: z.array(z.enum(replayTargetIds)).min(1).max(3),
})
export type ReplayScenario = z.infer<typeof replayScenarioSchema>
export async function getReplayScenarios(signal?: AbortSignal): Promise<ReplayScenario[]> {
  if (import.meta.env.DEV) {
    const { replayFixtures } = await import('./fixtures')
    signal?.throwIfAborted()
    return parseResponse(z.array(replayScenarioSchema), replayFixtures)
  }
  throw new Error('Replay API가 아직 연결되지 않았어요.')
}

// ─── 지난 뉴스 목록·상세 API ──────────────────────────────────────────────────
// 목록: GET /api/v1/news?contentType=replay (+ category, from, to, marketTargetId)
// 상세: GET /api/v1/news/{newsId}
// 시장 대상 옵션: GET /api/v1/market-targets
// 결과 공개 전 화면이다. 아래 스키마에 정의한 필드만 남고, 그 밖의 필드(결과·원문·시장 값 등)는 zod가 제거한다.
// sources·target-candidates·facts·세션 API는 이 화면에서 호출하지 않는다.

/** false(기본)면 배포는 "준비 중" 안내만, 개발은 시안용 목 데이터를 쓴다. */
export const replayApiEnabled = import.meta.env.VITE_REPLAY_API_ENABLED === 'true'
export const replayUsesFixtures = import.meta.env.DEV && !replayApiEnabled
export const replayPageSize = 6
export const replayYears = ['2025', '2024', '2023'] as const
export type ReplayYear = typeof replayYears[number]

/**
 * 화면 탭 key → 뉴스 API category. 탭 key는 URL(?category=)에 그대로 남긴다.
 * 뉴스 category는 이 6개로 고정되지 않는다(BE 확인). 매핑 밖의 값은 "전체"에서만 보인다.
 */
export const replayNewsCategories = {
  rate_policy: 'rate', price: 'price', employment: 'employment',
  fx_export: 'exchange_rate', energy: 'energy', semiconductor: 'semiconductor',
} satisfies Record<ReplayCategoryKey, string>

/** 응답의 category를 탭 이름으로 바꾼다. 모르는 값은 공용 라벨, 그것도 없으면 원래 값을 보여준다. */
export function replayCategoryLabel(category: string) {
  const key = replayCategoryKeys.find(item => replayNewsCategories[item] === category)
  return replayCategories.find(item => item.key === key)?.label ?? categoryLabel(category)
}

const monthFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long' })
/** 기준 시점(referenceAt, 없으면 publishedAt)을 서울 시간대의 연·월로 표시한다. */
export function formatReplayMonth(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : monthFormat.format(date)
}

/** 시장 대상 필터 옵션. id는 URL(?target=)과 목록 요청의 marketTargetId에 그대로 쓴다. */
export type ReplayTargetOption = { id: string; label: string }
const fixtureTargetOptions: ReplayTargetOption[] = replayTargets.flatMap(target => target.marketTargetId ? [{ id: target.marketTargetId, label: target.name }] : [])
// 화면에 쓰는 id·displayName만 남긴다. code·marketCategory·targetType·directionLabels·unit 등은 zod가 제거한다.
const marketTargetsSchema = z.object({ targets: z.array(z.object({ id: z.string().uuid(), displayName: z.string().min(1) })) })

export async function getReplayMarketTargets(signal?: AbortSignal): Promise<ReplayTargetOption[]> {
  if (import.meta.env.DEV && !replayApiEnabled) return fixtureTargetOptions
  const data = await request('/market-targets', marketTargetsSchema, { signal })
  return [...new Map(data.targets.map(target => [target.id, { id: target.id, label: target.displayName }])).values()]
}

export type ReplayFilters = { category: ReplayCategoryKey | null; year: ReplayYear | null; targetId: string | null }
/** URL의 category·period·target을 읽는다. target은 현재 옵션 목록에 있는 id일 때만 쓰고, 없으면 무시한다. */
export function readReplayFilters(params: URLSearchParams, targetOptions: readonly ReplayTargetOption[]): ReplayFilters {
  return {
    category: replayCategoryKeys.find(key => key === params.get('category')) ?? null,
    year: replayYears.find(year => year === params.get('period')) ?? null,
    targetId: targetOptions.find(option => option.id === params.get('target'))?.id ?? null,
  }
}
export type ReplayNewsQuery = { category?: string; from?: string; to?: string; marketTargetId?: string }
export function toReplayNewsQuery(filters: ReplayFilters): ReplayNewsQuery {
  const query: ReplayNewsQuery = {}
  if (filters.category) query.category = replayNewsCategories[filters.category]
  // from/to: YYYY-MM-DD, Asia/Seoul 기준, 양 끝 포함. Replay(contentType=replay)는 referenceAt 기준이다 (BE 확인).
  if (filters.year) { query.from = `${filters.year}-01-01`; query.to = `${filters.year}-12-31` }
  if (filters.targetId) query.marketTargetId = filters.targetId
  return query
}
export const replayNewsKey = (filters: ReplayFilters) => ['replay', 'news', 'list', filters] as const

/** referenceAt은 표시 기준 시점이다. 응답에 없거나 형식이 틀리면 publishedAt으로 대체한 값이다. */
export type ReplayNews = { id: string; title: string; category: string; briefing: string; referenceAt: string }
export type ReplayNewsItem = ReplayNews
export type ReplayNewsPage = { content: ReplayNewsItem[]; page: number; size: number; hasNext: boolean; totalElements: number | null }

const isTime = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))
const timestamp = z.string().refine(isTime)
// referenceAt은 형식이 틀려도 파싱을 실패시키지 않고 publishedAt으로 대체한다.
const newsFields = {
  id: z.string().min(1), title: z.string(), category: z.string(), briefing: z.string(),
  contentType: z.literal('replay'), publishedAt: timestamp, referenceAt: z.unknown().optional(),
}
const toReplayNews = ({ id, title, category, briefing, publishedAt, referenceAt }: { id: string; title: string; category: string; briefing: string; publishedAt: string; referenceAt?: unknown }): ReplayNews =>
  ({ id, title, category, briefing, referenceAt: isTime(referenceAt) ? referenceAt : publishedAt })

// 기존 뉴스 목록 형태(content[] · id)로 확정됐다 (BE 확인). contentType으로 Replay 뉴스인지 확인한다.
export const replayNewsPageSchema = z.object({
  page: z.number().int().nonnegative(), size: z.number().int().positive(), hasNext: z.boolean(),
  totalElements: z.number().int().nonnegative().optional(),
  content: z.array(z.object(newsFields)),
}).transform(({ content, totalElements, ...meta }): ReplayNewsPage => ({ ...meta, totalElements: totalElements ?? null, content: content.map(toReplayNews) }))

export const replayNewsSchema = z.object(newsFields).transform(toReplayNews)

const uuid = z.string().uuid()

export async function getReplayNewsPage(filters: ReplayFilters, page: number, signal?: AbortSignal): Promise<ReplayNewsPage> {
  const query = toReplayNewsQuery(filters)
  let data: ReplayNewsPage
  if (import.meta.env.DEV && !replayApiEnabled) {
    const { replayNewsFixturePage } = await import('./news-fixtures')
    signal?.throwIfAborted()
    data = parseResponse(replayNewsPageSchema, replayNewsFixturePage(query, page, replayPageSize))
  } else {
    const params = new URLSearchParams({ contentType: 'replay', page: String(page), size: String(replayPageSize) })
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value)
    data = await request(`/news?${params}`, replayNewsPageSchema, { signal })
  }
  if (data.page !== page || data.size !== replayPageSize || data.content.length > replayPageSize || (data.hasNext && data.content.length === 0)) throw new ApiError(502, 'contract')
  return data
}

export async function getReplayNews(newsId: string, signal?: AbortSignal): Promise<ReplayNews> {
  let data: ReplayNews
  if (import.meta.env.DEV && !replayApiEnabled) {
    const { replayNewsFixture } = await import('./news-fixtures')
    signal?.throwIfAborted()
    const fixture = replayNewsFixture(newsId)
    if (!fixture) throw new ApiError(404)
    data = parseResponse(replayNewsSchema, fixture)
  } else {
    // 실제 뉴스 ID는 UUID다. 형식이 다르면 요청하지 않는다.
    if (!uuid.safeParse(newsId).success) throw new ApiError(404)
    data = await request(`/news/${encodeURIComponent(newsId)}`, replayNewsSchema, { signal })
  }
  if (data.id !== newsId) throw new ApiError(502, 'contract')
  return data
}

export type ReplayErrorKind = 'login' | 'unsupported' | 'notFound' | 'other'
/** 400과 계약 오류(Replay가 아닌 뉴스·모르는 응답 형태)는 "아직 준비되지 않음"으로 묶는다. */
export function replayErrorKind(error: unknown): ReplayErrorKind {
  if (!(error instanceof ApiError)) return 'other'
  if (error.status === 401) return 'login'
  if (error.status === 400 || error.kind === 'contract') return 'unsupported'
  if (error.status === 404) return 'notFound'
  return 'other'
}
