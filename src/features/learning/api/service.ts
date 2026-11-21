import type { z } from 'zod'
import { parseResponse, request } from '@/lib/api-client'
import * as c from './contracts'
import { horizons, type Draft, type Target } from '../model'

// Mock mode is explicit, DEV-only, and never an error fallback.
// Keep the existing editor's boolean API until the page PR is merged.
export const mockLearningEnabled = import.meta.env.DEV && import.meta.env.VITE_MOCK_LEARNING_API === 'true'
export function isMockLearningEnabled() {
  return import.meta.env.DEV && (import.meta.env.VITE_MOCK_LEARNING_API === 'true' || sessionStorage.getItem('finsight.devMockLearning') === 'true')
}
async function call<T>(path: string, schema: z.ZodType<T>, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  if (import.meta.env.DEV && isMockLearningEnabled()) return parseResponse(schema, await (await import('./unfinished-mock')).respond(path, options))
  return request(path, schema, options)
}
export const learningApi = {
  news: (id: string, signal?: AbortSignal) => call(`/news/${id}`, c.newsSchema, { signal }),
  facts: (id: string, signal?: AbortSignal) => call(`/news/${id}/facts`, c.factsSchema, { signal }),
  sources: (id: string, signal?: AbortSignal) => call(`/news/${id}/sources`, c.sourcesSchema, { signal }),
  candidates: (id: string, signal?: AbortSignal) => call(`/news/${id}/target-candidates`, c.candidatesSchema, { signal }),
  market: (id: string, signal?: AbortSignal) => call(`/market-targets/${id}`, c.marketSchema, { signal }),
  sessions: (newsId: string, signal?: AbortSignal) => call(`/learning-sessions?newsId=${encodeURIComponent(newsId)}`, c.sessionsSchema, { signal }),
  session: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}`, c.sessionSchema, { signal }),
  targets: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/targets`, c.targetsSchema, { signal }),
  predictions: (id: string, targetId: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/targets/${targetId}/predictions`, c.predictionsSchema, { signal }),
  create: (newsId: string) => call('/learning-sessions', c.sessionSchema, { method: 'POST', body: { newsId, sessionType: 'live' } }),
  select: (id: string, targets: Target[]) => call(`/learning-sessions/${id}/targets`, c.targetsSchema, { method: 'PUT', body: { targets: targets.map((target, i) => ({ marketTargetId: target.marketTargetId ?? target.id, sortOrder: i + 1 })) } }),
  save: (id: string, targetId: string, draft: Draft[string]) => call(`/learning-sessions/${id}/targets/${targetId}/predictions`, c.predictionsSchema, { method: 'PUT', body: { predictions: horizons.map(horizon => ({ horizon, direction: draft[horizon].direction, reason: draft[horizon].reason.trim() ? draft[horizon].reason : null })) } }),
  submit: (id: string) => call(`/learning-sessions/${id}/submit`, c.submitSchema, { method: 'POST' }),
  feedbacks: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/feedbacks`, c.feedbackListSchema, { signal }),
  feedback: (id: string, signal?: AbortSignal) => call(`/feedbacks/${id}`, c.feedbackSchema, { signal }),
  outcomes: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/outcomes`, c.outcomesSchema, { signal }),
  series: (id: string, targetId: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/targets/${targetId}/series`, c.seriesSchema, { signal }),
  events: (targetId: string, signal?: AbortSignal) => call(`/session-targets/${targetId}/outcome-events`, c.eventsSchema, { signal }),
  saveNote: (id: string, body: c.ReflectionRequest) => call(`/learning-sessions/${id}/reflections`, c.noteSchema, { method: 'POST', body }),
  saveFinal: (id: string, body: c.ReflectionRequest) => call(`/learning-sessions/${id}/reflections`, c.finalReflectionSchema, { method: 'POST', body }),
  notes: (id: string, signal?: AbortSignal) => call(`/learning-sessions/${id}/reflections`, c.notesSchema, { signal }),
}

export { call as requestLearningData }
