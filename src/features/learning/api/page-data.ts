import { ApiError } from '@/lib/api-client'
import { horizons, type Draft, type FeedbackItem, type FeedbackState, type FeedbackView, type NewsView, type Source, type Target } from '../model'
import type { MarketDto, SessionDto } from './contracts'
import { learningApi as api, mockLearningEnabled } from './service'

export function formatTime(value: string | null | undefined) {
  if (!value) return '아직 없음'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '시각 정보 없음' : date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })
}
export function blankDraft(targets: Target[]): Draft {
  return Object.fromEntries(targets.map(target => [target.id, Object.fromEntries(horizons.map(h => [h, { direction: null, reason: '' }]))])) as Draft
}
export function toTarget(market: MarketDto, sessionTargetId?: string): Target {
  return { id: sessionTargetId ?? market.id, marketTargetId: market.id, name: market.displayName,
    kind: market.targetType === 'yield' || market.marketCategory === 'rate' ? 'rate' : market.targetType === 'currency_pair' || market.targetType === 'exchange_rate' ? 'fx' : 'index',
    directionLabels: market.directionLabels,
    referenceMarket: market.referenceMarket ? { ...market.referenceMarket, asOf: market.referenceMarket.asOfAt ? formatTime(market.referenceMarket.asOfAt) : null, sourceName: market.referenceMarket.dataSourceName, sourceUrl: market.referenceMarket.dataSourceUrl } : undefined,
  }
}
export async function loadNews(newsId: string, signal?: AbortSignal): Promise<NewsView> {
  const [news, facts, sources, candidates] = await Promise.all([api.news(newsId, signal), api.facts(newsId, signal), api.sources(newsId, signal), api.candidates(newsId, signal)])
  const primary = sources.sources.find(s => s.isPrimary)
  return { id: news.id, title: news.title, category: news.category, publisher: primary?.publisher ?? '발행처 정보 없음', publishedAt: formatTime(news.publishedAt),
    originalUrl: primary?.url ?? null, originalLabel: '대표 출처 보기 ↗',
    briefing: [{ title: '주요 내용', body: news.briefing }], context: null, term: null,
    facts: [...facts.facts].sort((a, b) => a.sortOrder - b.sortOrder).map(f => ({ id: f.id, label: f.label, value: f.valueText, unit: f.unit ?? '', asOf: f.asOfAt ? formatTime(f.asOfAt) : null })),
    sources: sources.sources.map(s => ({ id: s.id, title: s.title, publisher: s.publisher, date: formatTime(s.publishedAt), quote: '', url: s.url })),
    targets: [...candidates.candidates].sort((a, b) => a.sortOrder - b.sortOrder).map(c => toTarget({ ...c, id: c.marketTargetId })),
  }
}
export async function loadSaved(session: SessionDto, signal?: AbortSignal) {
  const response = await api.targets(session.id, signal)
  const selected = response.targets.filter(t => t.isSelected).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const targets = await Promise.all(selected.map(async target => toTarget(await api.market(target.marketTargetId, signal), target.sessionTargetId)))
  const draft = blankDraft(targets)
  await Promise.all(targets.map(async target => {
    const saved = await api.predictions(session.id, target.id, signal)
    for (const p of saved.predictions) draft[target.id][p.horizon] = { direction: p.direction, reason: p.reason ?? '' }
  }))
  return { targets, draft }
}
export type PageData = { news: NewsView; session: SessionDto | null; targets: Target[]; draft: Draft; feedback: FeedbackView | null; feedbackState: FeedbackState; poll: boolean; noFeedback?: boolean }
export async function loadPage(page: 'news' | 'prediction' | 'initial' | 'final', newsId: string | undefined, sessionId: string | undefined, selectedIds: string[], signal?: AbortSignal, cachedPage?: PageData): Promise<PageData> {
  let session = sessionId ? await api.session(sessionId, signal) : null
  const id = session?.newsId ?? newsId
  if (!id) throw new ApiError(400)
  const news = cachedPage?.news.id === id ? cachedPage.news : await loadNews(id, signal)
  if (!session) session = (await api.sessions(id, signal)).content[0] ?? null
  const saved = session ? cachedPage?.session?.id === session.id && cachedPage.session.status !== 'drafting' ? { targets: cachedPage.targets, draft: cachedPage.draft } : await loadSaved(session, signal) : { targets: news.targets.filter(t => selectedIds.includes(t.id)), draft: {} as Draft }
  if (!session) {
    // Only the explicit DEV mock supplies a selection; the other owner's selector passes ?targets=UUID,... in real mode.
    if (!saved.targets.length && mockLearningEnabled) saved.targets = news.targets.slice(0, 2)
    if (page === 'prediction') saved.targets = await Promise.all(saved.targets.map(async target => toTarget(await api.market(target.id, signal))))
    saved.draft = blankDraft(saved.targets)
  }
  const result: PageData = { news, session, ...saved, feedback: null, feedbackState: 'ready', poll: false }
  if (page === 'news' || page === 'prediction' || !session || session.status === 'drafting' || (page === 'final' && session.status !== 'completed')) return result
  const stage = page === 'final' ? 'final' : 'initial'
  const [summaries, outcomes, notes] = await Promise.all([api.feedbacks(session.id, signal), api.outcomes(session.id, signal), stage === 'final' ? api.notes(session.id, signal) : Promise.resolve([])])
  const latest = summaries.find(f => f.feedbackStage === stage && f.isLatest)
  const feedback = latest ? await api.feedback(latest.id, signal) : null
  if (feedback && (feedback.learningSessionId !== session.id || feedback.feedbackStage !== stage)) throw new ApiError(502, 'contract')
  result.feedbackState = feedback ? feedback.status === 'ready' ? feedback.insufficientEvidence ? 'limited' : 'ready' : feedback.status : 'pending'
  result.poll = !feedback || feedback.status === 'pending' || feedback.status === 'generating'
  result.noFeedback = !feedback
  const sourceMap = new Map<string, Source>((feedback?.references ?? []).map(r => [r.id, { id: r.id, title: `${r.citationLabel} · ${r.title}`, publisher: r.publisher, date: formatTime(r.publishedAt), quote: r.citationExcerpt, url: r.url }]))
  const items: Record<string, FeedbackItem[]> = Object.fromEntries(saved.targets.map(t => [t.id, []]))
  if (feedback?.status === 'ready') {
    for (const target of feedback.targetFeedbacks) {
      if (!(target.sessionTargetId in items)) throw new ApiError(502, 'contract')
      items[target.sessionTargetId] = [...target.items].sort((a, b) => a.sortOrder - b.sortOrder).map(item => {
        if (item.referenceIds.some(id => !sourceMap.has(id))) throw new ApiError(502, 'contract')
        return { title: itemTitles[item.type] ?? '함께 살펴볼 내용', body: item.content, sources: item.referenceIds.map(id => sourceMap.get(id)!) }
      })
    }
  }
  const allObservations = outcomes.targets.flatMap(t => t.observations)
  const observation = session.status === 'baseline_pending' ? 'baseline_pending' : session.status === 'reflection_pending' ? 'reflection_pending' : session.status === 'completed' ? 'completed' : allObservations.some(o => o.status === 'ready') ? 'observing' : 'scheduled'
  const finalNotes = notes.filter(n => n.reflectionType === 'final' && n.sessionTargetId === null)
  result.feedback = {
    targets: saved.targets, draft: saved.draft, items, sessionId: session.id, observation,
    reflection: finalNotes.map(n => `${noteTitles[n.promptKey] ?? '회고'}\n${n.body}`).join('\n\n'),
    reflectionSavedAt: finalNotes[0] ? formatTime(finalNotes[0].createdAt) : null,
    generatedAt: feedback?.generatedAt ? formatTime(feedback.generatedAt) : null,
    flowSummary: feedback?.flowSummary ?? null,
    inputCutoffAt: feedback?.inputCutoffAt ? formatTime(feedback.inputCutoffAt) : null,
    observationRecords: Object.fromEntries(outcomes.targets.map(t => [t.sessionTargetId, t.observations.map(o => ({ horizon: o.horizon, status: o.status, text: o.status === 'ready' ? `${o.observedValue ?? '—'} ${o.unit} · ${formatTime(o.observedAt)}` : o.status === 'unavailable' ? `관측 불가 · ${o.unavailableReason ?? '관측 자료가 없어요.'}` : `관찰 예정${o.expectedObservationDate ? ` · ${o.expectedObservationDate}` : ''}` }))])),
    midNotes: Object.fromEntries(saved.targets.map(t => [t.id, notes.filter(n => n.sessionTargetId === t.id && (n.reflectionType === 'day_1' || n.reflectionType === 'day_5')).map(n => `${n.reflectionType === 'day_1' ? '1' : '5'}거래일 메모 · ${n.body}`)])),
  }
  return result
}
const itemTitles: Record<string, string> = {
  flow_summary: '판단 흐름 요약', initial_uncertainty: '불확실한 점', initial_counter_scenario: '반대 시나리오', initial_factor_to_review: '함께 살펴볼 요소',
  final_observed_flow: '관찰된 흐름', final_co_observed_factors: '함께 확인된 요소', final_reflection_improvement: '회고 보완점', final_next_hypothesis: '다음 가설 점검', interpretation_limit: '해석 한계',
}
const noteTitles: Record<string, string> = { learned: '배운 점', missed_variable: '놓친 변수', next_check: '다음에 확인할 점' }
