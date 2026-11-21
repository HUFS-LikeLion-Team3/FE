import { z } from 'zod'
import { ApiError } from '@/lib/api-client'
import { newsSchema } from '@/features/learning/api/contracts'
import { requestLearningData } from '@/features/learning/api/service'

export const markets = [{ key: 'all', label: '전체' }, { key: 'korea', label: '국내' }, { key: 'us', label: '미국' }] as const
export const topics = [{ key: 'all', label: '전체' }, { key: 'rate', label: '금리' }, { key: 'exchange_rate', label: '환율' }, { key: 'semiconductor', label: '반도체' }, { key: 'energy', label: '에너지' }, { key: 'price', label: '물가' }, { key: 'employment', label: '고용' }] as const
export type Market = typeof markets[number]['key']
export type Topic = typeof topics[number]['key']
export const pageSize = 10
export const recentNewsKey = (market: Market, topic: Topic) => ['news', 'explore', 'recent', { market, topic }] as const

const itemSchema = newsSchema.extend({ contentType: z.literal('live'), replayStatus: z.string() })
const pageSchema = z.object({ content: z.array(itemSchema), page: z.number().int().nonnegative(), size: z.number().int().positive(), hasNext: z.boolean() })
export type ExploreNews = z.infer<typeof itemSchema>

export async function getExploreNews({ market = 'all', topic = 'all', sort = 'latest', page = 0, size = pageSize }: { market?: Market; topic?: Topic; sort?: 'latest' | 'recommended'; page?: number; size?: number } = {}, signal?: AbortSignal) {
  const params = new URLSearchParams({ market, contentType: 'live', sort, page: String(page), size: String(size) })
  if (topic !== 'all') params.set('category', topic)
  const data = await requestLearningData(`/news?${params}`, pageSchema, { signal })
  if (data.page !== page || data.size !== size || data.content.length > size || (data.hasNext && data.content.length === 0)) throw new ApiError(502, 'contract')
  return data
}
