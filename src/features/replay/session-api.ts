import { parseBriefing } from '@/features/news/briefing'
import { z } from 'zod'
import { ApiError } from '@/lib/api-client'
import type { LearningNews } from '../learning/learning-note-data'
import type { NoteDto, SessionDto } from '../learning/api/contracts'
import { formatTime, loadPredictionDraft, loadSessionFeedback, toTarget, type PageData } from '../learning/api/page-data'
import { replayLearningApi as api } from '../learning/api/service'
import { replayFeedbackHref } from '../learning/session-routes'
import { getReplayNews } from './api'
import { replayPrompts, type ReplayData, type ReplayReceipt, type ReplaySaveRequest } from './model'

const uuid = z.string().uuid()
export const hasRevealedResults = (value?: string | null) => !!value && Number.isFinite(Date.parse(value))

export async function getReplaySession(id: string, signal?: AbortSignal) {
  if (!uuid.safeParse(id).success) throw new ApiError(404)
  const session = await api.session(id, signal)
  if (session.id !== id || session.sessionType !== 'replay') throw new ApiError(404)
  return session
}

async function loadReplayTargets(newsId: string, signal?: AbortSignal) {
  const { candidates } = await api.candidates(newsId, signal)
  return candidates.slice().sort((a, b) => a.sortOrder - b.sortOrder).map(candidate =>
    toTarget({ ...candidate, id: candidate.marketTargetId, referenceMarket: undefined }))
}

async function loadReplaySaved(session: SessionDto, signal?: AbortSignal, knownTargets?: Awaited<ReturnType<typeof loadReplayTargets>>) {
  const [saved, candidates] = await Promise.all([
    api.targets(session.id, signal),
    knownTargets ?? loadReplayTargets(session.newsId, signal),
  ])
  if (saved.learningSessionId !== session.id) throw new ApiError(502, 'contract')
  const selected = saved.targets.filter(target => target.isSelected).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const targets = selected.map(target => {
    const candidate = candidates.find(item => item.id === target.marketTargetId)
    if (!candidate) throw new ApiError(502, 'contract')
    return { ...candidate, id: target.sessionTargetId }
  })
  const draft = await loadPredictionDraft(session, selected, false, signal)
  return { targets, draft, sessionTargets: saved.targets }
}

const feedbackDefaults = { feedback: null, feedbackState: 'ready', poll: false } as const

export async function loadReplayEditor(newsId: string, signal?: AbortSignal): Promise<PageData> {
  const news = await getReplayNews(newsId, signal)
  const [candidates, list] = await Promise.all([
    loadReplayTargets(newsId, signal), api.sessions(newsId, signal, 'replay'),
  ])
  const existing = list.content.find(item => item.newsId === newsId && item.sessionType === 'replay')
  const session = existing ? await getReplaySession(existing.id, signal) : null
  if (session && session.newsId !== newsId) throw new ApiError(502, 'contract')
  const saved = session?.status === 'drafting' ? await loadReplaySaved(session, signal, candidates) : null
  const targets = saved?.targets.map(target => ({ ...target, id: target.marketTargetId ?? target.id })) ?? []
  const draft = saved ? {
    ...await loadPredictionDraft(session!, saved.sessionTargets.filter(target => !target.isSelected), true, signal),
    ...Object.fromEntries(saved.targets.map(target => [target.marketTargetId ?? target.id, saved.draft[target.id]])),
  } : {}
  return {
    session, targets, draft, ...feedbackDefaults,
    news: {
      id: news.id, title: news.title, category: news.category, publisher: '', publishedAt: formatTime(news.referenceAt),
      originalUrl: null, originalLabel: '', briefing: parseBriefing(news.briefing, '발표 내용'),
      context: null, term: null, facts: [], sources: [],
      targets: candidates,
    },
  }
}

export async function loadReplayFeedback(id: string, stage: 'initial' | 'final', signal?: AbortSignal, cached?: Awaited<ReturnType<typeof loadReplaySaved>> & { news?: LearningNews }) {
  const session = await getReplaySession(id, signal)
  if (session.status === 'drafting' || (stage === 'final' && (session.status !== 'completed' || !hasRevealedResults(session.resultsRevealedAt)))) {
    return { session, ...feedbackDefaults, saved: undefined }
  }
  const [saved, news] = await Promise.all([
    cached ?? loadReplaySaved(session, signal),
    cached?.news ?? getReplayNews(session.newsId, signal)
      .then((item): LearningNews => ({ title: item.title, facts: [] }))
      // Auxiliary news context must not hide an otherwise valid saved feedback.
      // Never fall back to Live news or infer facts from generated prose.
      .catch(() => undefined),
  ])
  signal?.throwIfAborted()
  const result: Pick<PageData, 'targets' | 'draft' | 'feedback' | 'feedbackState' | 'poll'> & { news?: LearningNews } = { ...saved, ...feedbackDefaults, news }
  await loadSessionFeedback(result, session, stage, signal)
  return { session, saved: { ...saved, news }, ...result }
}

function toReceipt(id: string, notes: NoteDto[], savedAt: string, clientRequestId: string): ReplayReceipt {
  const answers = notes.map(note => {
    const prompt = replayPrompts.find(item => item.key === note.promptKey)
    if (!prompt || note.learningSessionId !== id || note.sessionTargetId !== null ||
        note.reflectionType !== 'final' || note.clientRequestId !== clientRequestId ||
        note.submissionId !== notes[0]?.submissionId || !note.submissionId || !note.body.trim()) throw new ApiError(502, 'contract')
    return { promptKey: prompt.key, body: note.body }
  })
  if (!hasRevealedResults(savedAt) || !answers.length || new Set(answers.map(answer => answer.promptKey)).size !== answers.length) throw new ApiError(502, 'contract')
  return { replayId: id, clientRequestId, answers, savedAt }
}

export async function loadReplayResults(id: string, signal?: AbortSignal) {
  const session = await getReplaySession(id, signal)
  if (!hasRevealedResults(session.resultsRevealedAt) || session.status === 'drafting') return { session, data: null }
  const [news, saved, outcomes, notes] = await Promise.all([
    api.news(session.newsId, signal), loadReplaySaved(session, signal), api.outcomes(id, signal),
    session.status === 'completed' ? api.notes(id, signal) : [],
  ])
  if (news.id !== session.newsId || outcomes.learningSessionId !== id) throw new ApiError(502, 'contract')
  const finalNotes = notes.filter(note => note.reflectionType === 'final')
  const receipt = session.status === 'completed' && finalNotes[0]?.clientRequestId
    ? toReceipt(id, finalNotes, session.completedAt ?? finalNotes[0].createdAt, finalNotes[0].clientRequestId)
    : null
  if (session.status === 'completed' && !receipt) throw new ApiError(502, 'contract')
  const data: ReplayData = {
    replayId: id, sessionId: id, title: news.title, resultsRevealedAt: session.resultsRevealedAt ?? null,
    targets: saved.targets, draft: saved.draft, outcomes, series: {}, receipt, feedbackHref: replayFeedbackHref(id),
    finalFeedbackHref: `/replay/session/${id}/final-feedback`,
  }
  return { session, data }
}

export function canSaveReplayReflection({ session, data }: Awaited<ReturnType<typeof loadReplayResults>>) {
  return session.status === 'reflection_pending' && !!data &&
    data.outcomes.targets.every(target => target.baseline.status !== 'pending' && target.observations.every(row => row.status !== 'pending'))
}

export async function saveReplayReflection(id: string, input: ReplaySaveRequest) {
  if (id !== input.replayId) throw new ApiError(502, 'contract')
  const result = await api.saveFinal(id, { clientRequestId: input.clientRequestId, reflectionType: 'final', answers: input.answers })
  if (result.clientRequestId !== input.clientRequestId || result.notes.some(note => note.submissionId !== result.submissionId)) throw new ApiError(502, 'contract')
  return toReceipt(id, result.notes, result.completedAt, result.clientRequestId)
}
