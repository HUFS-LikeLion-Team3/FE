// Explicit DEV-only fixtures. Never used as a fallback for a failed HTTP request.
import { ApiError } from '@/lib/api-client'
import { horizons } from '../model'
import type { FeedbackDto, MarketDto, SessionDto, SessionTargetDto, NoteDto, ReflectionRequest } from './contracts'

export const demoNewsId = 'f1000000-0000-4000-8000-000000000001'
export const demoSessionIds = {
  observing: 'f2000000-0000-4000-8000-000000000001',
  reflection: 'f2000000-0000-4000-8000-000000000002',
  completed: 'f2000000-0000-4000-8000-000000000003',
  pending: 'f2000000-0000-4000-8000-000000000004',
  unavailable: 'f2000000-0000-4000-8000-000000000005',
}
const marketIds = ['f0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000003']
const markets: MarketDto[] = [
  { id: marketIds[0], displayName: '달러 인덱스', marketCategory: 'fx', targetType: 'index', unit: 'pt', directionLabels: { up: '상승 예상', down: '하락 예상', neutral: '큰 방향성 없음' } },
  { id: marketIds[1], displayName: 'NASDAQ 100', marketCategory: 'equity', targetType: 'index', unit: 'pt', directionLabels: { up: '상승 예상', down: '하락 예상', neutral: '큰 방향성 없음' } },
  { id: marketIds[2], displayName: '미국 10년물 국채금리', marketCategory: 'rate', targetType: 'yield', unit: '%', directionLabels: { up: '금리 상승', down: '금리 하락', neutral: '큰 방향성 없음' } },
]
type Prediction = { horizon: 1 | 5 | 20; direction: 'up' | 'down' | 'neutral' | null; reason: string | null }
type Stored = { session: SessionDto; targets: SessionTargetDto[]; predictions: Map<string, Prediction[]>; feedbacks: FeedbackDto[]; notes: NoteDto[]; requestedAt: number; scenario: string; submissions: Map<string, { signature: string; response: unknown }> }
const sessions = new Map<string, Stored>()
const empty = (): Prediction[] => horizons.map(horizon => ({ horizon, direction: null, reason: null }))
const now = () => new Date().toISOString()
const fixtureTime = '2026-10-12T07:00:00+09:00'
let interests = [{ interestType: 'market', interestKey: 'us' }, { interestType: 'topic', interestKey: 'semiconductor' }]
export function ownsMarket(id: string) { return marketIds.includes(id) }
export function sessionsForNews(newsId: string) { return [...sessions.values()].filter(s => s.session.newsId === newsId).map(s => structuredClone(s.session)) }
export function owns(path: string) { return [...sessions.values()].some(value => path.includes(value.session.id) || value.feedbacks.some(f => path.includes(f.id))) }
function feedback(record: Stored, stage: 'initial' | 'final', status: FeedbackDto['status'] = 'ready'): FeedbackDto {
  return { id: crypto.randomUUID(), learningSessionId: record.session.id, feedbackStage: stage, status, isLatest: true, version: 1, failureCode: null, generatedAt: status === 'ready' ? now() : null, flowSummary: status === 'ready' ? '개발용 피드백입니다. 기록한 판단과 관찰된 변화를 함께 살펴보세요.' : null, insufficientEvidence: false, inputCutoffAt: record.session.completedAt ?? record.session.submittedAt ?? now(), references: [], targetFeedbacks: status === 'ready' ? record.targets.filter(t => t.isSelected).map(t => ({ sessionTargetId: t.sessionTargetId, items: [{ id: crypto.randomUUID(), type: stage === 'initial' ? 'initial_uncertainty' : 'final_next_hypothesis', content: '실제 AI 생성 결과가 아닌 개발용 예시입니다. 판단 조건과 자료의 공개 시점을 확인해 보세요.', referenceIds: [], sortOrder: 1 }] })) : [] }
}
function addSession(id: string, newsId: string, scenario: string) {
  const status = scenario === 'completed' ? 'completed' : scenario === 'reflection' || scenario === 'unavailable' ? 'reflection_pending' : scenario === 'observing' ? 'observing' : scenario === 'drafting' ? 'drafting' : 'baseline_pending'
  const session: SessionDto = { id, newsId, sessionType: 'live', status, createdAt: fixtureTime, updatedAt: fixtureTime, savedAt: status === 'drafting' ? null : fixtureTime, submittedAt: status === 'drafting' ? null : fixtureTime, completedAt: status === 'completed' ? fixtureTime : null }
  const record: Stored = { session, targets: [], predictions: new Map(), feedbacks: [], notes: [], requestedAt: 0, scenario, submissions: new Map() }
  if (scenario !== 'drafting') {
    record.targets = markets.map((m, i) => ({ sessionTargetId: crypto.randomUUID(), marketTargetId: m.id, isSelected: true, sortOrder: i + 1 }))
    record.targets.forEach(t => record.predictions.set(t.sessionTargetId, horizons.map(horizon => ({ horizon, direction: 'up', reason: '개발용 판단 이유입니다.' }))))
    record.feedbacks = [feedback(record, 'initial')]
  }
  if (scenario === 'completed') {
    record.notes.push({ id: crypto.randomUUID(), learningSessionId: id, sessionTargetId: null, reflectionType: 'final', promptKey: 'learned', body: '개발용 회고입니다. 발표 사실과 관찰된 시장 변화를 구분해 확인했어요.', createdAt: fixtureTime, submissionId: crypto.randomUUID(), clientRequestId: crypto.randomUUID() })
    record.feedbacks.push(feedback(record, 'final', 'failed'))
  }
  sessions.set(id, record)
  return record
}
Object.entries(demoSessionIds).forEach(([scenario, id]) => addSession(id, demoNewsId, scenario))
function outcomes(record: Stored) {
  const terminal = ['reflection', 'completed', 'unavailable'].includes(record.scenario)
  return { learningSessionId: record.session.id, targets: record.targets.filter(t => t.isSelected).map((target, i) => {
    const market = markets.find(m => m.id === target.marketTargetId)!
    const base = market.marketCategory === 'rate' ? 4.1 : i === 0 ? 103.5 : 20000
    const ready = record.scenario !== 'pending' && record.scenario !== 'drafting'
    const baseline = { status: ready ? 'ready' : 'pending', baselineSessionDate: ready ? '2026-09-01' : null, baselineAt: ready ? fixtureTime : null, baselineValue: ready ? base : null, unit: market.unit, dataSourceName: '개발용 목자료', dataSourceUrl: null, unavailableReason: null, expectedBaselineDate: '2026-09-01', baselineDeadlineDate: '2026-09-03' }
    return { ...target, baseline, observations: horizons.map(horizon => {
      const unavailable = record.scenario === 'unavailable' && horizon !== 20
      const status = unavailable ? 'unavailable' : terminal || record.scenario === 'observing' && horizon === 1 && i === 0 ? 'ready' : 'pending'
      const change = market.marketCategory === 'rate' ? 0.05 : i === 0 ? 0.62 : 120
      return { horizon, status, exceptionStatus: unavailable ? 'data_missing' : 'none', referenceAt: record.session.submittedAt, observationDeadlineDate: '2026-10-01', observationSessionDate: status === 'ready' ? horizon === 1 ? '2026-09-02' : horizon === 5 ? '2026-09-08' : '2026-09-29' : null, observationDelaySessions: unavailable ? 2 : 0, usableForAiEvidence: status === 'ready', dataSourceName: '개발용 목자료', dataSourceUrl: null, observedValue: status === 'ready' ? base + change : null, observedAt: status === 'ready' ? fixtureTime : null, unit: market.unit, unavailableReason: unavailable ? '개발용 시나리오 · 유효한 종가 자료를 확보하지 못했어요.' : null, expectedObservationDate: horizon === 1 ? '2026-09-02' : horizon === 5 ? '2026-09-08' : '2026-09-29', changeValue: status === 'ready' ? change : null, changePercent: status === 'ready' ? change / base * 100 : null }
    }) }
  }) }
}
export async function respond(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<unknown> {
  await new Promise<void>((resolve, reject) => {
    const signal = options.signal
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, 80)
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
  const method = options.method ?? 'GET'
  const body = options.body as Record<string, unknown> | undefined
  const url = new URL(path, 'http://mock.local')
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts[0] === 'users') {
    if (parts[2] === 'interests') { if (method === 'PUT') interests = structuredClone(body?.interests as typeof interests); return { interests } }
    return { onboardingCompletedAt: now() }
  }
  if (parts[0] === 'news') {
    const id = parts[1] ?? demoNewsId
    const news = { id, title: '정책금리 동결 발표: 발표문에서 확인할 사실', category: 'rate', briefing: '개발용 뉴스 예시입니다. 정책 발표와 시장의 관측값을 구분해 살펴보세요.', publishedAt: fixtureTime, contentType: 'live', replayStatus: 'not_applicable' }
    if (!parts[1]) return { content: [news], page: 0, size: 10, hasNext: false }
    if (!parts[2]) return news
    if (parts[2] === 'facts') return { facts: [{ id: crypto.randomUUID(), label: '정책금리', valueText: '4.00', unit: '%', asOfAt: fixtureTime, sortOrder: 1 }] }
    if (parts[2] === 'sources') return { sources: [{ id: crypto.randomUUID(), title: '개발용 출처 예시', publisher: '개발용 목자료', url: 'https://www.federalreserve.gov/', publishedAt: fixtureTime, isPrimary: true }] }
    if (parts[2] === 'target-candidates') return { candidates: markets.map((m, i) => ({ ...m, marketTargetId: m.id, sortOrder: i + 1, rationale: ['환율과 달러 수요의 흐름', '미국 기술주 지수의 흐름', '장기 국채금리의 흐름'][i] })) }
  }
  if (parts[0] === 'market-targets') {
    const market = markets.find(m => m.id === parts[1]); if (!market) throw new ApiError(404)
    return { ...market, referenceMarket: { status: 'pending', asOfAt: null, value: null, changeValue: null, changePercent: null, unit: market.unit, dataSourceName: '개발용 목자료', dataSourceUrl: null, unavailableReason: null } }
  }
  if (parts[0] === 'session-targets') return []
  if (parts[0] === 'feedbacks') {
    const record = [...sessions.values()].find(s => s.feedbacks.some(f => f.id === parts[1])); if (!record) throw new ApiError(404)
    updateFeedback(record)
    return structuredClone(record.feedbacks.find(f => f.id === parts[1]))
  }
  if (parts[0] !== 'learning-sessions') throw new ApiError(404)
  if (!parts[1]) {
    if (method === 'GET') {
      const values = [...sessions.values()].filter(s => (!url.searchParams.get('newsId') || s.session.newsId === url.searchParams.get('newsId')) && (!url.searchParams.get('status') || s.session.status === url.searchParams.get('status'))).map(s => s.session)
      const page = Number(url.searchParams.get('page') ?? 0), size = Number(url.searchParams.get('size') ?? 20)
      return { content: values.slice(page * size, (page + 1) * size), page, size, totalElements: values.length, totalPages: Math.ceil(values.length / size), hasNext: (page + 1) * size < values.length }
    }
    const existing = [...sessions.values()].find(s => s.session.newsId === body?.newsId && s.scenario === 'drafting'); if (existing) return structuredClone(existing.session)
    return structuredClone(addSession(crypto.randomUUID(), String(body?.newsId), 'drafting').session)
  }
  const record = sessions.get(parts[1]); if (!record) throw new ApiError(404)
  if (!parts[2]) return structuredClone(record.session)
  if (parts[2] === 'feedbacks') { updateFeedback(record); return structuredClone(record.feedbacks) }
  if (parts[2] === 'reflections') {
    if (method === 'GET') return structuredClone(record.notes)
    const request = body as unknown as ReflectionRequest
    const signature = JSON.stringify(request)
    const previous = record.submissions.get(request.clientRequestId)
    if (previous) { if (previous.signature !== signature) throw new ApiError(409); return structuredClone(previous.response) }
    const submissionId = crypto.randomUUID()
    if (request.reflectionType === 'final') {
      if (record.session.status !== 'reflection_pending' || !request.answers?.some(a => a.body.trim())) throw new ApiError(409)
      const notes = request.answers.filter(a => a.body.trim()).map(a => ({ id: crypto.randomUUID(), learningSessionId: record.session.id, sessionTargetId: null, reflectionType: 'final' as const, ...a, createdAt: now(), submissionId, clientRequestId: request.clientRequestId }))
      record.notes.push(...notes); record.session.status = 'completed'; record.session.completedAt = now(); record.session.updatedAt = now()
      record.feedbacks.push(feedback(record, 'final'))
      const response = { submissionId, clientRequestId: request.clientRequestId, notes, sessionStatus: 'completed', completedAt: record.session.completedAt }
      record.submissions.set(request.clientRequestId, { signature, response }); return structuredClone(response)
    }
    const horizon = request.reflectionType === 'day_1' ? 1 : 5
    const target = outcomes(record).targets.find(t => t.sessionTargetId === request.sessionTargetId)
    if (!request.body?.trim() || !target || record.session.status === 'completed' || target.observations.find(o => o.horizon === horizon)?.status === 'pending') throw new ApiError(409)
    const note: NoteDto = { id: crypto.randomUUID(), learningSessionId: record.session.id, sessionTargetId: request.sessionTargetId!, reflectionType: request.reflectionType, promptKey: request.promptKey!, body: request.body, createdAt: now(), submissionId, clientRequestId: request.clientRequestId }
    record.notes.push(note); record.submissions.set(request.clientRequestId, { signature, response: note }); return structuredClone(note)
  }
  if (parts[2] === 'outcomes') return outcomes(record)
  if (parts[2] === 'submit') {
    if (record.session.status !== 'drafting') throw new ApiError(409)
    const selected = record.targets.filter(t => t.isSelected), predictions = selected.flatMap(t => record.predictions.get(t.sessionTargetId) ?? empty())
    if (!selected.length || selected.length > 3 || predictions.some(p => !p.direction) || !predictions.some(p => p.reason?.trim())) throw new ApiError(400)
    record.session = { ...record.session, status: 'baseline_pending', submittedAt: now(), updatedAt: now() }; record.scenario = 'pending'; record.requestedAt = Date.now(); record.feedbacks = [feedback(record, 'initial', 'pending')]
    return { sessionId: record.session.id, status: record.session.status, submittedAt: record.session.submittedAt }
  }
  if (parts[2] !== 'targets') throw new ApiError(404)
  if (!parts[3]) {
    if (method === 'PUT') {
      if (record.session.status !== 'drafting') throw new ApiError(409)
      const requested = body?.targets as { marketTargetId: string; sortOrder: number }[]
      if (!requested.length || requested.length > 3 || new Set(requested.map(t => t.marketTargetId)).size !== requested.length || requested.some(t => !marketIds.includes(t.marketTargetId))) throw new ApiError(400)
      record.targets = record.targets.map(t => ({ ...t, isSelected: false, sortOrder: null }))
      for (const target of requested) {
        let existing = record.targets.find(t => t.marketTargetId === target.marketTargetId)
        if (!existing) { existing = { sessionTargetId: crypto.randomUUID(), marketTargetId: target.marketTargetId, isSelected: true, sortOrder: target.sortOrder }; record.targets.push(existing) }
        existing.isSelected = true; existing.sortOrder = target.sortOrder
      }
      record.session.savedAt = now(); record.session.updatedAt = now()
    }
    return structuredClone({ learningSessionId: record.session.id, targets: record.targets })
  }
  const target = record.targets.find(t => t.sessionTargetId === parts[3]); if (!target) throw new ApiError(404)
  if (parts[4] === 'series') {
    const outcome = outcomes(record).targets.find(t => t.sessionTargetId === target.sessionTargetId)!
    const base = outcome.baseline
    const series = base.status === 'ready' ? [{ tradingDate: base.baselineSessionDate!, closeValue: base.baselineValue!, unit: base.unit, dataSourceName: '개발용 목자료', dataSourceUrl: null }, ...outcome.observations.filter(o => o.status === 'ready').map(o => ({ tradingDate: o.observationSessionDate!, closeValue: o.observedValue!, unit: o.unit, dataSourceName: '개발용 목자료', dataSourceUrl: null }))] : []
    return { learningSessionId: record.session.id, sessionTargetId: target.sessionTargetId, marketTargetId: target.marketTargetId, series }
  }
  if (parts[4] !== 'predictions') throw new ApiError(404)
  const predictions = structuredClone(record.predictions.get(target.sessionTargetId) ?? empty())
  if (method === 'PUT') {
    if (record.session.status !== 'drafting') throw new ApiError(409)
    for (const item of (body?.predictions ?? []) as Prediction[]) { const index = predictions.findIndex(p => p.horizon === item.horizon); if (index === -1) throw new ApiError(400); predictions[index] = { ...predictions[index], ...item } }
    record.predictions.set(target.sessionTargetId, predictions); record.session.savedAt = now(); record.session.updatedAt = now()
  }
  return { sessionTargetId: target.sessionTargetId, predictions, updatedAt: record.session.updatedAt }
}
function updateFeedback(record: Stored) {
  if (!record.requestedAt) return
  const elapsed = Date.now() - record.requestedAt
  const initial = record.feedbacks.find(f => f.feedbackStage === 'initial')
  if (initial && initial.status !== 'ready') {
    if (elapsed < 500) initial.status = 'pending'
    else if (elapsed < 1000) initial.status = 'generating'
    else { const ready = feedback(record, 'initial'); record.feedbacks[record.feedbacks.indexOf(initial)] = { ...ready, id: initial.id } }
  }
}
