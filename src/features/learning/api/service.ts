import type { z } from 'zod'
import { parseResponse, request } from '@/lib/api-client'
import * as c from './contracts'
import { horizons, type Draft, type Target } from '../model'

export const mockLearningEnabled = import.meta.env.DEV && import.meta.env.VITE_MOCK_LEARNING_API !== 'false'
const loadMock = mockLearningEnabled ? () => import('./unfinished-mock') : null
async function call<T>(path: string, schema: z.ZodType<T>, options: { method?: string; body?: unknown; signal?: AbortSignal; unfinished?: boolean } = {}): Promise<T> {
  if (loadMock) {
    const mock = await loadMock()
    if (options.unfinished || mock.owns(path)) return parseResponse(schema, await mock.respond(path, options))
  }
  return request(path, schema, options)
}
export const learningApi = {
  news: (id: string, signal?: AbortSignal) => call(`/news/${id}`, c.newsSchema, { signal }),
  facts: (id: string, signal?: AbortSignal) => call(`/news/${id}/facts`, c.factsSchema, { signal }),
  sources: (id: string, signal?: AbortSignal) => call(`/news/${id}/sources`, c.sourcesSchema, { signal }),
  candidates: (id: string, signal?: AbortSignal) => call(`/news/${id}/target-candidates`, c.candidatesSchema, { signal, unfinished: true }),
  market: (id: string, signal?: AbortSignal) => call(`/market-targets/${id}`, c.marketSchema, { signal, unfinished: true }),
  sessions: (newsId: string, signal?: AbortSignal) => call(`/learning-sessions?newsId=${encodeURIComponent(newsId)}`, c.sessionsSchema, { signal, unfinished: true }),
  session: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}`, c.sessionSchema, { signal, unfinished: true }),
  targets: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/targets`, c.targetsSchema, { signal, unfinished: true }),
  predictions: (id: string, targetId: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/targets/${targetId}/predictions`, c.predictionsSchema, { signal, unfinished: true }),
  create: (newsId: string) => call('/learning-sessions', c.sessionSchema, { method: 'POST', body: { newsId, sessionType: 'live' }, unfinished: true }),
  select: (id: string, targets: Target[]) => call(`/learning-sessions/${id}/targets`, c.targetsSchema, { method: 'PUT', body: { targets: targets.map((target, i) => ({ marketTargetId: target.marketTargetId ?? target.id, sortOrder: i + 1 })) }, unfinished: true }),
  save: (id: string, targetId: string, draft: Draft[string]) => call(`/learning-sessions/${id}/targets/${targetId}/predictions`, c.predictionsSchema, { method: 'PUT', body: { predictions: horizons.map(horizon => ({ horizon, direction: draft[horizon].direction, reason: draft[horizon].reason.trim() ? draft[horizon].reason : null })) }, unfinished: true }),
  submit: (id: string) => call(`/learning-sessions/${id}/submit`, c.submitSchema, { method: 'POST', unfinished: true }),
  feedbacks: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/feedbacks`, c.feedbackListSchema, { signal }),
  feedback: (id: string, signal?: AbortSignal) => call(`/feedbacks/${id}`, c.feedbackSchema, { signal }),
  outcomes: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/outcomes`, c.outcomesSchema, { signal }),
  notes: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/reflections`, c.notesSchema, { signal, unfinished: true }),
}
