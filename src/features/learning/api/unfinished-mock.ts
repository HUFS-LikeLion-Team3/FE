// DEV-only adapter for APIs marked unfinished in the 2026-10-11 contract.
// No automatic fallback for a failed real API request. Refresh clears this store.
import { ApiError } from '@/lib/api-client'
import { horizons } from '../model'
import type { FeedbackDto, MarketDto, SessionDto, SessionTargetDto } from './contracts'

const marketIds = ['f0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000003']
const markets: MarketDto[] = [
  { id: marketIds[0], displayName: '달러 인덱스', marketCategory: 'fx', targetType: 'index', unit: 'pt', directionLabels: { up: '상승 예상', down: '하락 예상', neutral: '큰 방향성 없음' } },
  { id: marketIds[1], displayName: 'NASDAQ 100', marketCategory: 'equity', targetType: 'index', unit: 'pt', directionLabels: { up: '상승 예상', down: '하락 예상', neutral: '큰 방향성 없음' } },
  { id: marketIds[2], displayName: '미국 10년물 국채금리', marketCategory: 'rate', targetType: 'yield', unit: '%', directionLabels: { up: '금리 상승', down: '금리 하락', neutral: '큰 방향성 없음' } },
]
type Prediction = { horizon: 1 | 5 | 20; direction: 'up' | 'down' | 'neutral' | null; reason: string | null }
type Stored = { session: SessionDto; targets: SessionTargetDto[]; predictions: Map<string, Prediction[]>; feedback: FeedbackDto | null; requestedAt: number }
const sessions = new Map<string, Stored>()
const empty = (): Prediction[] => horizons.map(horizon => ({ horizon, direction: null, reason: null }))
const now = () => new Date().toISOString()
export function owns(path: string) {
  return [...sessions.values()].some(value => path.includes(value.session.id) || (value.feedback && path.includes(value.feedback.id)))
}
export async function respond(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<unknown> {
  await new Promise<void>((resolve, reject) => {
    const signal = options.signal
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, 150)
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
  const method = options.method ?? 'GET'
  const body = options.body as Record<string, unknown> | undefined
  const url = new URL(path, 'http://mock.local')
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts[0] === 'market-targets') {
    const market = markets.find(m => m.id === parts[1])
    if (!market) throw new ApiError(404)
    return { ...market, code: ['DOLLAR', 'NASDAQ100', 'US10Y'][marketIds.indexOf(market.id)], isActive: true, referenceMarket: { status: 'pending', sessionDate: null, asOfAt: null, value: null, previousCloseValue: null, changeValue: null, changePercent: null, unit: market.unit, dataSourceName: '개발용 목자료', dataSourceUrl: null, unavailableReason: null } }
  }
  if (parts[0] === 'news' && parts[2] === 'target-candidates') return { candidates: markets.map((m, i) => ({ ...m, marketTargetId: m.id, sortOrder: i + 1, rationale: '개발용 후보 대상입니다.' })) }
  if (parts[0] === 'feedbacks') {
    const record = [...sessions.values()].find(s => s.feedback?.id === parts[1])
    if (!record) throw new ApiError(404)
    return currentFeedback(record)
  }
  if (parts[0] !== 'learning-sessions') throw new ApiError(404)
  if (!parts[1]) {
    if (method === 'GET') return { content: [...sessions.values()].filter(s => s.session.newsId === url.searchParams.get('newsId')).map(s => s.session) }
    const existing = [...sessions.values()].find(s => s.session.newsId === body?.newsId)
    if (existing) return existing.session
    const session: SessionDto = { id: crypto.randomUUID(), newsId: String(body?.newsId), sessionType: 'live', status: 'drafting', createdAt: now(), savedAt: null, submittedAt: null, completedAt: null }
    sessions.set(session.id, { session, targets: [], predictions: new Map(), feedback: null, requestedAt: 0 })
    return session
  }
  const record = sessions.get(parts[1])
  if (!record) throw new ApiError(404)
  if (!parts[2]) return record.session
  if (parts[2] === 'feedbacks') return record.feedback ? [currentFeedback(record)] : []
  if (parts[2] === 'reflections') return []
  if (parts[2] === 'outcomes') return { learningSessionId: record.session.id, targets: record.targets.filter(t => t.isSelected).map(t => ({ ...t, baseline: { status: 'pending', baselineSessionDate: null, baselineAt: null, baselineValue: null, unit: markets.find(m => m.id === t.marketTargetId)?.unit ?? '', dataSourceName: '개발용 목자료', dataSourceUrl: null, unavailableReason: null, expectedBaselineDate: null, baselineDeadlineDate: null }, observations: horizons.map(horizon => ({ horizon, status: 'pending', exceptionStatus: 'none', referenceAt: record.session.submittedAt, observationDeadlineDate: null, observationSessionDate: null, observationDelaySessions: 0, usableForAiEvidence: false, dataSourceName: '개발용 목자료', dataSourceUrl: null, observedValue: null, observedAt: null, unit: markets.find(m => m.id === t.marketTargetId)?.unit ?? '', unavailableReason: null, expectedObservationDate: null, changeValue: null, changePercent: null })) })) }
  if (parts[2] === 'submit') {
    if (record.session.status !== 'drafting') throw new ApiError(409)
    const selected = record.targets.filter(t => t.isSelected)
    const predictions = selected.flatMap(t => record.predictions.get(t.sessionTargetId) ?? empty())
    if (!selected.length || selected.length > 3 || predictions.some(p => !p.direction) || !predictions.some(p => p.reason?.trim())) throw new ApiError(400)
    record.session = { ...record.session, status: 'baseline_pending', submittedAt: now(), updatedAt: now() }
    record.requestedAt = Date.now()
    record.feedback = { id: crypto.randomUUID(), learningSessionId: record.session.id, feedbackStage: 'initial', status: 'pending', isLatest: true, version: 1, failureCode: null, generatedAt: null, flowSummary: null, insufficientEvidence: false, inputCutoffAt: record.session.submittedAt!, references: [], targetFeedbacks: [] }
    return { sessionId: record.session.id, status: record.session.status, submittedAt: record.session.submittedAt }
  }
  if (parts[2] !== 'targets') throw new ApiError(404)
  if (!parts[3]) {
    if (method === 'PUT') {
      if (record.session.status !== 'drafting') throw new ApiError(409)
      const requested = body?.targets as { marketTargetId: string; sortOrder: number }[]
      if (requested.length > 3 || new Set(requested.map(t => t.marketTargetId)).size !== requested.length || requested.some(t => !marketIds.includes(t.marketTargetId))) throw new ApiError(400)
      record.targets = record.targets.map(t => ({ ...t, isSelected: false, sortOrder: null }))
      for (const target of requested) {
        let existing = record.targets.find(t => t.marketTargetId === target.marketTargetId)
        if (!existing) { existing = { sessionTargetId: crypto.randomUUID(), marketTargetId: target.marketTargetId, isSelected: true, sortOrder: target.sortOrder }; record.targets.push(existing) }
        existing.isSelected = true; existing.sortOrder = target.sortOrder
      }
      record.session.savedAt = now(); record.session.updatedAt = record.session.savedAt
    }
    return { learningSessionId: record.session.id, targets: record.targets }
  }
  const target = record.targets.find(t => t.sessionTargetId === parts[3])
  if (!target || parts[4] !== 'predictions') throw new ApiError(404)
  const predictions = structuredClone(record.predictions.get(target.sessionTargetId) ?? empty())
  if (method === 'PUT') {
    if (record.session.status !== 'drafting') throw new ApiError(409)
    for (const item of (body?.predictions ?? []) as Prediction[]) {
      const index = predictions.findIndex(p => p.horizon === item.horizon)
      if (index === -1) throw new ApiError(400)
      predictions[index] = { ...predictions[index], ...item }
    }
    record.predictions.set(target.sessionTargetId, predictions)
    record.session.savedAt = now(); record.session.updatedAt = record.session.savedAt
  }
  return { sessionTargetId: target.sessionTargetId, predictions, updatedAt: record.session.updatedAt }
}
function currentFeedback(record: Stored): FeedbackDto {
  if (record.feedback?.status === 'ready') return structuredClone(record.feedback)
  const feedback = structuredClone(record.feedback!)
  const elapsed = Date.now() - record.requestedAt
  feedback.status = elapsed < 500 ? 'pending' : elapsed < 1500 ? 'generating' : 'ready'
  if (feedback.status === 'ready') {
    feedback.generatedAt = new Date(record.requestedAt + 1500).toISOString()
    feedback.flowSummary = '개발용 피드백입니다. 기록한 대상별 판단과 자료의 공개 시점을 함께 살펴보세요.'
    feedback.targetFeedbacks = record.targets.filter(t => t.isSelected).map(t => ({ sessionTargetId: t.sessionTargetId, items: [
      { id: crypto.randomUUID(), type: 'initial_uncertainty', content: '실제 AI 생성 결과가 아닌 개발용 예시입니다. 예측의 조건과 자료의 공개 시점을 확인해 보세요.', referenceIds: [], sortOrder: 1 },
    ] }))
  }
  if (feedback.status === 'ready') record.feedback = feedback
  return feedback
}
