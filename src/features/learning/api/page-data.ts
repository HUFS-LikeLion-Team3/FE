import { ApiError } from '@/lib/api-client'
import { horizons, type Draft, type FeedbackItem, type FeedbackState, type FeedbackView, type NewsView, type Source, type Target } from '../model'
import { sessionDestination } from '../session-routes'
import type { FeedbackDto, MarketDto, SessionDto, SessionTargetDto } from './contracts'
import { learningApi as api, replayLearningApi } from './service'

export function formatTime(value: string | null | undefined) {
  if (!value) return '아직 없음'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '시각 정보 없음' : date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })
}
export function blankDraft(targets: Target[]): Draft {
  return Object.fromEntries(targets.map(target => [target.id, Object.fromEntries(horizons.map(h => [h, { direction: null, reason: '' }]))])) as Draft
}
export function toTarget(market: MarketDto, sessionTargetId?: string): Target {
  return { id: sessionTargetId ?? market.id, marketTargetId: market.id, name: market.displayName, targetType: market.targetType, marketCategory: market.marketCategory,
    kind: market.targetType === 'yield' || market.marketCategory === 'rate' ? 'rate' : market.marketCategory === 'fx' || market.targetType === 'currency_pair' || market.targetType === 'exchange_rate' ? 'fx' : 'index',
    directionLabels: market.directionLabels,
    referenceMarket: market.referenceMarket ? { ...market.referenceMarket, asOf: market.referenceMarket.asOfAt ? formatTime(market.referenceMarket.asOfAt) : null, sourceName: market.referenceMarket.dataSourceName, sourceUrl: market.referenceMarket.dataSourceUrl } : undefined,
  }
}
export async function loadNews(newsId: string, signal?: AbortSignal, newsData?: Awaited<ReturnType<typeof api.news>>): Promise<NewsView> {
  const news = newsData ?? await api.news(newsId, signal)
  if (news.id !== newsId || news.contentType === 'replay') throw new ApiError(502, 'contract')
  const [facts, sources, candidates] = await Promise.all([api.facts(newsId, signal), api.sources(newsId, signal), api.candidates(newsId, signal)])
  const primary = sources.sources.find(s => s.isPrimary)
  return { id: news.id, title: news.title, category: news.category, publisher: primary?.publisher ?? '발행처 정보 없음', publishedAt: formatTime(news.publishedAt),
    originalUrl: primary?.url ?? null, originalLabel: '대표 출처 보기 ↗',
    briefing: [{ title: '주요 내용', body: news.briefing }], context: null, term: null,
    facts: [...facts.facts].sort((a, b) => a.sortOrder - b.sortOrder).map(f => ({ id: f.id, label: f.label, value: f.valueText, unit: f.unit ?? '', asOf: f.asOfAt ? formatTime(f.asOfAt) : null })),
    sources: sources.sources.map(s => ({ id: s.id, title: s.title, publisher: s.publisher, date: formatTime(s.publishedAt), quote: '', url: s.url })),
    targets: [...candidates.candidates].sort((a, b) => a.sortOrder - b.sortOrder).map(c => ({ ...toTarget({ ...c, id: c.marketTargetId }), rationale: c.rationale })),
  }
}
export async function loadSaved(session: SessionDto, signal?: AbortSignal) {
  const response = await api.targets(session.id, signal)
  if (response.learningSessionId !== session.id) throw new ApiError(502, 'contract')
  const selected = response.targets.filter(t => t.isSelected).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const targets = await Promise.all(selected.map(async target => {
    const market = await api.market(target.marketTargetId, signal)
    if (market.id !== target.marketTargetId) throw new ApiError(502, 'contract')
    return toTarget(market, target.sessionTargetId)
  }))
  const draft = await loadPredictionDraft(session, selected, false, signal)
  return { targets, draft, sessionTargets: response.targets }
}

export async function loadPredictionDraft(session: SessionDto, targets: SessionTargetDto[], byMarket: boolean, signal?: AbortSignal) {
  const apiClient = session.sessionType === 'replay' ? replayLearningApi : api
  const draft: Draft = {}
  await Promise.all(targets.map(async target => {
    const stored = await apiClient.predictions(session.id, target.sessionTargetId, signal)
    if (stored.sessionTargetId !== target.sessionTargetId) throw new ApiError(502, 'contract')
    const key = byMarket ? target.marketTargetId : target.sessionTargetId
    const entry = blankDraft([{ id: key } as Target])[key]
    for (const p of stored.predictions) entry[p.horizon] = { direction: p.direction, reason: p.reason ?? '' }
    draft[key] = entry
  }))
  return draft
}
export type PageData = { news: NewsView; session: SessionDto | null; targets: Target[]; draft: Draft; feedback: FeedbackView | null; feedbackState: FeedbackState; poll: boolean; noFeedback?: boolean }
export async function loadPage(page: 'news' | 'prediction' | 'initial' | 'final', newsId: string | undefined, sessionId: string | undefined, selectedIds: string[], signal?: AbortSignal, cachedPage?: PageData): Promise<PageData | { redirectTo: string }> {
  let session = sessionId ? await api.session(sessionId, signal) : null
  if (session?.sessionType === 'replay') return { redirectTo: sessionDestination(session) }
  const id = session?.newsId ?? newsId
  if (!id) throw new ApiError(400)
  const cachedNews = cachedPage?.news.id === id ? cachedPage.news : undefined
  const remoteNews = cachedNews ? undefined : await api.news(id, signal)
  if (remoteNews?.id && remoteNews.id !== id) throw new ApiError(502, 'contract')
  if (remoteNews?.contentType === 'replay') return { redirectTo: `/replay/${id}${page === 'prediction' ? '/predict' : ''}` }
  const news = cachedNews ?? await loadNews(id, signal, remoteNews)
  if (!session) {
    const summary = (await api.sessions(id, signal)).content[0]
    if (summary) session = await api.session(summary.id, signal)
  }
  if (session && session.newsId !== id) throw new ApiError(502, 'contract')
  const saved = session ? cachedPage?.session?.id === session.id && cachedPage.session.status !== 'drafting' ? { targets: cachedPage.targets, draft: cachedPage.draft } : await loadSaved(session, signal) : { targets: news.targets.filter(t => selectedIds.includes(t.id)), draft: {} as Draft }
  if (!session) {
    if (selectedIds.length > 3 || new Set(selectedIds).size !== selectedIds.length || selectedIds.some(id => !news.targets.some(t => t.id === id))) throw new ApiError(400)
    if (page === 'prediction') saved.targets = await Promise.all(saved.targets.map(async target => toTarget(await api.market(target.id, signal))))
    saved.draft = blankDraft(saved.targets)
  }
  const result: PageData = { news: session && page !== 'prediction' ? { ...news, targets: saved.targets } : news, session, ...saved, feedback: null, feedbackState: 'ready', poll: false }
  if (page === 'prediction' && session?.status === 'drafting') {
    const all = ('sessionTargets' in saved && saved.sessionTargets) || (await api.targets(session.id, signal)).targets
    const bank = await loadPredictionDraft(session, all, true, signal)
    result.targets = saved.targets.map(t => ({ ...t, id: t.marketTargetId ?? t.id }))
    result.draft = bank
  }
  if (page === 'news' || page === 'prediction' || !session || session.status === 'drafting' || (page === 'final' && session.status !== 'completed')) return result
  return loadSessionFeedback(result, session, page === 'final' ? 'final' : 'initial', signal)
}

export async function loadSessionFeedback<T extends Pick<PageData, 'targets' | 'draft' | 'feedback' | 'feedbackState' | 'poll' | 'noFeedback'> & { news?: Pick<NewsView, 'title' | 'facts'> }>(result: T, session: SessionDto, stage: 'initial' | 'final', signal?: AbortSignal) {
  const apiClient = session.sessionType === 'replay' ? replayLearningApi : api
  const saved = result
  const summaries = await apiClient.feedbacks(session.id, signal)
  const latest = summaries.find(f => f.feedbackStage === stage && f.isLatest)
  const feedback = latest ? await apiClient.feedback(latest.id, signal) : null
  if (feedback && (feedback.id !== latest?.id || !feedback.isLatest || feedback.learningSessionId !== session.id || feedback.feedbackStage !== stage)) throw new ApiError(502, 'contract')
  result.feedbackState = feedback ? feedback.status === 'ready' ? feedback.insufficientEvidence ? 'limited' : 'ready' : feedback.status : 'pending'
  result.poll = !feedback || feedback.status === 'pending' || feedback.status === 'generating'
  result.noFeedback = !feedback
  const sourceMap = new Map<string, Source>((feedback?.references ?? []).map(r => [r.id, { id: r.id, title: `${r.citationLabel} · ${r.title}`, publisher: r.publisher, date: formatTime(r.publishedAt), quote: r.citationExcerpt, url: r.url }]))
  const mapItem = (item: FeedbackDto['targetFeedbacks'][number]['items'][number]): FeedbackItem => {
    if (item.referenceIds.some(id => !sourceMap.has(id))) throw new ApiError(502, 'contract')
    return { type: item.type, title: itemTitles[item.type] ?? '함께 살펴볼 내용', body: item.content, sources: item.referenceIds.map(id => sourceMap.get(id)!) }
  }
  const sessionItems = feedback?.status === 'ready' ? [...(feedback.sessionItems ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).map(mapItem) : []
  const items: Record<string, FeedbackItem[]> = Object.fromEntries(saved.targets.map(t => [t.id, []]))
  if (feedback?.status === 'ready') {
    for (const target of feedback.targetFeedbacks) {
      if (!(target.sessionTargetId in items)) throw new ApiError(502, 'contract')
      items[target.sessionTargetId] = [...target.items].sort((a, b) => a.sortOrder - b.sortOrder).map(mapItem)
    }
  }
  const observation = session.status === 'baseline_pending' ? 'baseline_pending' : session.status === 'reflection_pending' ? 'reflection_pending' : session.status === 'completed' ? 'completed' : session.status === 'observing' ? 'observing' : 'scheduled'
  result.feedback = {
    targets: saved.targets, draft: saved.draft, items, sessionItems, sessionId: session.id, observation,
    reflection: '', reflectionSavedAt: null,
    learningNews: result.news ? { title: result.news.title, facts: result.news.facts } : undefined,
    generatedAt: feedback?.generatedAt ? formatTime(feedback.generatedAt) : null,
    flowSummary: feedback?.flowSummary ?? null,
    inputCutoffAt: feedback?.inputCutoffAt ? formatTime(feedback.inputCutoffAt) : null,
  }
  return result
}
export async function loadFeedbackOutcomes(sessionId: string, targets: Target[], signal?: AbortSignal) {
  const outcomes = await api.outcomes(sessionId, signal)
  if (outcomes.learningSessionId !== sessionId || new Set(outcomes.targets.map(t => t.sessionTargetId)).size !== outcomes.targets.length || outcomes.targets.some(t => !targets.some(selected => selected.id === t.sessionTargetId && selected.marketTargetId === t.marketTargetId))) throw new ApiError(502, 'contract')
  const observationRecords: FeedbackView['observationRecords'] = Object.fromEntries(outcomes.targets.map(t => [t.sessionTargetId, t.observations.map(o => ({ horizon: o.horizon, status: o.status, text: o.status === 'ready' ? `${o.observedValue ?? '—'} ${o.unit} · ${formatTime(o.observedAt)}` : o.status === 'unavailable' ? `관측 불가 · ${o.unavailableReason ?? '관측 자료가 없어요.'}` : `관찰 예정${o.expectedObservationDate ? ` · ${o.expectedObservationDate}` : ''}` }))]))
  return { outcomes, observationRecords }
}
export async function loadFeedbackNotes(sessionId: string, targets: Target[], signal?: AbortSignal, replay = false) {
  const notes = await (replay ? replayLearningApi : api).notes(sessionId, signal)
  if (notes.some(n => (n.learningSessionId && n.learningSessionId !== sessionId) || (n.sessionTargetId !== null && !targets.some(t => t.id === n.sessionTargetId)))) throw new ApiError(502, 'contract')
  const finalNotes = notes.filter(n => n.reflectionType === 'final' && n.sessionTargetId === null)
  return {
    reflection: finalNotes.map(n => `${noteTitles[n.promptKey] ?? '회고'}\n${n.body}`).join('\n\n'),
    reflectionSavedAt: finalNotes[0] ? formatTime(finalNotes[0].createdAt) : null,
    midNotes: Object.fromEntries(targets.map(t => [t.id, notes.filter(n => n.sessionTargetId === t.id && (n.reflectionType === 'day_1' || n.reflectionType === 'day_5')).map(n => `${n.reflectionType === 'day_1' ? '1' : '5'}거래일 메모 · ${n.body}`)])),
  }
}
const itemTitles: Record<string, string> = {
  news_analysis: '뉴스 핵심 해설', initial_market_impact: '예측 근거 분석', initial_prediction_review: '내 예측 근거 평가',
  final_market_explanation: '실제 변동의 배경', final_prediction_review: '예측 결과와 근거 평가', final_takeaway: '이번 사례에서 배운 점',
  flow_summary: '판단 흐름 요약', initial_uncertainty: '불확실한 점', initial_counter_scenario: '반대 시나리오', initial_factor_to_review: '함께 살펴볼 요소',
  final_observed_flow: '관찰된 흐름', final_co_observed_factors: '함께 확인된 요소', final_reflection_improvement: '회고 보완점', final_next_hypothesis: '다음 가설 점검', interpretation_limit: '해석 한계',
}
const noteTitles: Record<string, string> = { learned: '배운 점', missed_variable: '놓친 변수', next_check: '다음에 확인할 점' }
