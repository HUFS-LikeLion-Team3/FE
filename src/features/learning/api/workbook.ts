import { ApiError } from '@/lib/api-client'
import { learningApi as api } from './service'
import { loadNews, loadSaved } from './page-data'

export async function loadWorkbook(id: string, signal?: AbortSignal) {
  const session = await api.session(id, signal)
  if (session.id !== id) throw new ApiError(502, 'contract')
  if (session.status === 'drafting') return { session, redirectTo: `/learning/${id}/edit` } as const
  const [news, saved, outcomes, notes, feedbacks] = await Promise.all([
    loadNews(session.newsId, signal), loadSaved(session, signal), api.outcomes(id, signal), api.notes(id, signal), api.feedbacks(id, signal),
  ])
  const targetIds = new Set(saved.targets.map(t => t.id))
  if (outcomes.learningSessionId !== id || outcomes.targets.some(t => !targetIds.has(t.sessionTargetId)) || feedbacks.some(f => f.learningSessionId !== id) || notes.some(n => n.learningSessionId && n.learningSessionId !== id)) throw new ApiError(502, 'contract')
  return { session, redirectTo: null, news, ...saved, outcomes, notes: [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)), feedbacks } as const
}
export type WorkbookData = Extract<Awaited<ReturnType<typeof loadWorkbook>>, { redirectTo: null }>
