import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { learningApi as api } from './api/service'
import { loadWorkbook } from './api/workbook'
import { formatTime } from './api/page-data'
import { PageTitle, Shell, TargetSwitcher, Notice, linkClass } from './components/PagePrimitives'
import { QueryState } from './components/QueryState'
import { horizons, directionLabel, type Horizon } from './model'
import MarketSeriesChart from './MarketSeriesChart'
import ReflectionForm from './ReflectionForm'
import { ApiError } from '@/lib/api-client'

const statusLabels = { ready: '준비됨', pending: '관찰 중', unavailable: '관측 불가' }
const number = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString('ko-KR', { maximumFractionDigits: 4 })
export default function ResultsPage() {
  const { sessionId = '' } = useParams()
  const [active, setActive] = useState('')
  const [horizon, setHorizon] = useState<Horizon>(1)
  const query = useQuery({ queryKey: ['workbook', sessionId], queryFn: ({ signal }) => loadWorkbook(sessionId, signal), retry: false, refetchOnWindowFocus: false })
  const resolvedData = query.data?.redirectTo === null ? query.data : undefined
  const targetId = resolvedData?.targets.find(t => t.id === active)?.id ?? resolvedData?.targets[0]?.id ?? ''
  const series = useQuery({ queryKey: ['outcome-series', sessionId, targetId], enabled: !!targetId && !!resolvedData, retry: false, queryFn: async ({ signal }) => { const data = await api.series(sessionId, targetId, signal); if (data.sessionTargetId !== targetId || data.learningSessionId !== sessionId) throw new ApiError(502, 'contract'); return data } })
  const events = useQuery({ queryKey: ['outcome-events', targetId], enabled: !!targetId && !!resolvedData, retry: false, queryFn: ({ signal }) => api.events(targetId, signal) })
  if (!query.data) return <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
  if (query.data.redirectTo !== null) {
    if (query.isFetching || query.isError) return <QueryState loading={query.isFetching} error={query.error} retry={() => void query.refetch()} />
    return <Navigate to={query.data.redirectTo} replace />
  }
  const data = query.data
  if (data.session.status === 'drafting') return <Navigate to={`/learning/${sessionId}/edit`} replace />
  const target = data.targets.find(t => t.id === targetId) ?? data.targets[0]
  const outcome = data.outcomes.targets.find(t => t.sessionTargetId === target?.id)
  const observation = outcome?.observations.find(o => o.horizon === horizon)
  const baseline = outcome?.baseline
  const noteType = horizon === 1 ? 'day_1' : 'day_5'
  const notes = data.notes.filter(n => n.sessionTargetId === target?.id && n.reflectionType === noteType)
  const prediction = target ? data.draft[target.id]?.[horizon] : null
  const rate = target?.kind === 'rate'
  const change = observation?.changeValue == null ? null : rate && observation.unit === '%' ? observation.changeValue * 100 : observation.changeValue
  return <Shell>{query.isError && <Notice title="최신 상태를 불러오지 못했어요" error>{query.error.message} 마지막으로 조회한 기록을 유지했어요.</Notice>}<PageTitle label="OBSERVATION / WORKBOOK" title="변화를 관찰하고, 생각을 보태다" description={`${data.news.title} · 제출 ${formatTime(data.session.submittedAt)}`} />
    <TargetSwitcher targets={data.targets} active={target?.id ?? ''} onChange={setActive} />
    <div className="flex gap-2" aria-label="관찰 기간">{horizons.map(h => <FilterChip key={h} selected={horizon === h} onClick={() => setHorizon(h)}>{h}거래일 · {statusLabels[outcome?.observations.find(o => o.horizon === h)?.status ?? 'pending']}</FilterChip>)}</div>
    {!target || !outcome ? <Notice title="관측 정보를 준비하고 있어요">저장된 대상의 관측 결과가 아직 없어요.</Notice> : <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,3fr)] items-start gap-12"><section className="min-w-0 space-y-6"><h2 className="text-section">관찰된 변화 · {horizon}거래일</h2>
      <div className="grid grid-cols-2 gap-4">{[['기준 종가(T0)', baseline?.status === 'ready' ? baseline.baselineValue : null, baseline?.unit], [`관측 종가(T${horizon})`, observation?.status === 'ready' ? observation.observedValue : null, observation?.unit]].map(([label, value, unit]) => <div key={String(label)} className="space-y-2 rounded-card bg-surface-subtle p-4"><p className="text-meta text-text-secondary">{label}</p><p className="font-mono text-number">{number(typeof value === 'number' ? value : null)} <span className="text-meta">{unit}</span></p></div>)}</div>
      {baseline?.status !== 'ready' && <Notice title={baseline?.status === 'unavailable' ? '기준값을 확보하지 못했어요' : '기준값 확정 중'}>{baseline?.unavailableReason ?? `예정 기준일 ${baseline?.expectedBaselineDate ?? '아직 없음'}`}</Notice>}
      {observation?.status === 'ready' ? <><p className={`font-mono text-number ${change && change > 0 ? 'text-market-up' : change && change < 0 ? 'text-market-down' : 'text-text-primary'}`}>{change != null && change > 0 ? '+' : ''}{number(change)} {rate ? 'bp' : observation.unit}{!rate && ` / ${number(observation.changePercent)}%`}</p><p className="text-meta text-text-muted">{rate ? '금리 변화량 · 1bp = 0.01퍼센트포인트' : '변화량 / 변화율'}</p></> : <Notice title={observation?.status === 'unavailable' ? '관측 불가' : '관찰 중'}>{observation?.unavailableReason ?? '확정된 관측값을 기다리고 있어요.'}</Notice>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-border-default pt-6 text-meta text-text-secondary"><dt>기준일</dt><dd>{baseline?.baselineSessionDate ?? '미확정'}</dd><dt>예정 관측일</dt><dd>{observation?.expectedObservationDate ?? '미확정'}</dd><dt>실제 관측일</dt><dd>{observation?.observationSessionDate ?? '미확정'}</dd><dt>지연 정규 거래 세션</dt><dd>{observation?.observationDelaySessions ?? 0}회</dd></dl>
      <p className="text-meta">데이터 출처 · {observation?.dataSourceName ?? baseline?.dataSourceName ?? '정보 없음'}</p>{(observation?.dataSourceUrl ?? baseline?.dataSourceUrl) && <a href={observation?.dataSourceUrl ?? baseline?.dataSourceUrl ?? undefined} className={`${linkClass} w-full`} target="_blank" rel="noopener noreferrer">종가 데이터 보기 ↗</a>}
      <h2 className="text-section">T0 기준 세션 이후 시장 추이</h2>{series.isPending ? <Notice title="시장 추이를 불러오고 있어요">잠시만 기다려 주세요.</Notice> : series.isError ? <><Notice title="시장 추이를 불러오지 못했어요" error>{series.error.message}</Notice><Button variant="secondary" onClick={() => void series.refetch()}>추이 다시 불러오기</Button></> : <MarketSeriesChart data={series.data} outcome={outcome} />}
      {events.isError ? <Notice title="관측 이력을 불러오지 못했어요" error>{events.error.message}<Button variant="text" onClick={() => void events.refetch()}>이력 다시 불러오기</Button></Notice> : !!events.data?.length && <details className="text-meta"><summary>관측 수집 이력</summary>{events.data.map(event => <p key={event.id} className="py-2">{formatTime(event.occurredAt)} · {event.detail ?? event.eventType}</p>)}</details>}
    </section><aside className="space-y-6"><Notice title="내가 남긴 판단"><p>{horizon}거래일 · {directionLabel(target, prediction?.direction ?? null)}</p><p className="mt-2 whitespace-pre-wrap">{prediction?.reason || '판단 이유 미작성'}</p></Notice>{horizon !== 20 && <><h2 className="text-section">저장된 {horizon}거래일 메모</h2>{notes.length ? notes.map(note => <article key={note.id} className="space-y-2"><p className="whitespace-pre-wrap text-ui">{note.body}</p><p className="text-meta text-text-muted">{formatTime(note.createdAt)} · 읽기 전용</p></article>) : <p className="text-meta text-text-muted">아직 저장된 메모가 없어요.</p>}</>}
      <ReflectionForm key={sessionId} sessionId={sessionId} targetId={target.id} horizon={horizon} enabled={data.session.status !== 'completed' && !!observation && observation.status !== 'pending'} onSaved={() => query.refetch()} />
      {data.session.status === 'reflection_pending' ? <Link to={`/learning/${sessionId}/reflection`} className={`${linkClass} w-full bg-brand-primary text-white`}>최종 회고 작성하기</Link> : data.session.status === 'completed' ? <Link to={`/learning/${sessionId}`} className={`${linkClass} w-full`}>완료 기록 보기</Link> : <Notice title="남은 관찰">모든 대상의 관찰이 종료되면 최종 회고를 작성할 수 있어요.</Notice>}
      <Link to={`/learning/${sessionId}/feedback`} className={`${linkClass} w-full`}>최초 AI 피드백 다시 보기</Link><Link to="/learning" className={`${linkClass} w-full`}>학습 기록 보기</Link>
    </aside></div>}
    <Button variant="text" loading={query.isFetching} onClick={() => { void query.refetch(); void series.refetch(); void events.refetch() }}>최신 상태 불러오기</Button>
  </Shell>
}
