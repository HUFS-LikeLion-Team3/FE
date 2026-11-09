import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ApiError } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { learningApi as api } from './api/service'
import type { OutcomesDto, SeriesDto } from './api/contracts'
import { directionLabel, horizons, type Draft, type Target } from './model'
import { Notice, linkClass } from './components/PagePrimitives'
import MarketSeriesChart from './MarketSeriesChart'

type Outcome = OutcomesDto['targets'][number]
const number = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
const signed = (value: number, minimumFractionDigits = 0) => `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR', { minimumFractionDigits, maximumFractionDigits: 2 })}`
function actualChange(row: Outcome['observations'][number], target: Target) {
  if (row.status !== 'ready') return row.status === 'pending' ? '관찰 중' : '관측 불가'
  if (row.changeValue === null) return row.observedValue === null ? '변화량 정보 없음' : `${number(row.observedValue)} ${row.unit}`
  if (target.kind === 'rate') {
    if (row.unit === 'bp') return `${signed(row.changeValue)}bp`
    if (['%', 'percent', '%p'].includes(row.unit)) return `${signed(row.changeValue, 2)}%p (${signed(row.changeValue * 100)}bp)`
  }
  return row.changePercent !== null ? `${signed(row.changePercent)}%` : `${signed(row.changeValue)} ${row.unit}`
}

export default function FeedbackOutcomePanel({ sessionId, target, draft, outcome, snapshot, routeBase = '' }: {
  sessionId: string; target: Target; draft: Draft; outcome?: Outcome; snapshot?: SeriesDto; routeBase?: string
}) {
  const matches = (data: SeriesDto) => data.learningSessionId === sessionId && data.sessionTargetId === target.id && (!target.marketTargetId || data.marketTargetId === target.marketTargetId)
  const validOutcome = !!outcome && outcome.sessionTargetId === target.id && (!target.marketTargetId || outcome.marketTargetId === target.marketTargetId)
  const series = useQuery({
    queryKey: ['outcome-series', sessionId, target.id],
    enabled: validOutcome && !snapshot,
    retry: false,
    queryFn: async ({ signal }) => {
      const data = await api.series(sessionId, target.id, signal)
      if (!matches(data)) throw new ApiError(502, 'contract')
      return data
    },
  })
  if (!outcome) return <Notice title="관측 그래프를 표시할 자료가 없어요">확정된 관측값을 불러오면 그래프와 내 예측을 함께 볼 수 있어요.</Notice>
  if (!validOutcome) return <Notice title="이 대상의 관측 자료를 확인하지 못했어요" error>다른 대상의 관측값은 표시하지 않아요.</Notice>
  const data = snapshot ?? series.data
  const wrongSnapshot = !!data && !matches(data)
  const dates = outcome.observations.flatMap(o => [o.observationSessionDate, o.expectedObservationDate]).filter((date): date is string => !!date).sort()
  const end = dates.at(-1)
  const filtered = data && !wrongSnapshot ? { ...data, series: data.series.filter(p => (!outcome.baseline.baselineSessionDate || p.tradingDate >= outcome.baseline.baselineSessionDate) && (!end || p.tradingDate <= end)) } : undefined
  return <section className="min-w-0 space-y-5 border-y border-border-default py-6" aria-label="실제 움직임과 내 예측 비교">
    <div className="space-y-2"><h2 className="text-section">실제 움직임과 내 예측 · {target.name}</h2><p className="text-meta text-text-secondary">그래프에서 기준값과 기간별 변화를 확인하고, 아래 해설에서 예상과 달라진 이유를 살펴보세요.</p></div>
    {wrongSnapshot ? <Notice title="이 대상의 그래프를 확인하지 못했어요" error>다른 세션이나 대상의 자료는 표시하지 않아요.</Notice> : filtered && !filtered.series.length ? <Notice title="일별 추이 자료가 아직 없어요">아래의 확정 관측값으로 내 예측과 비교할 수 있어요. 없는 일별 값은 채우지 않아요.</Notice> : filtered ? <MarketSeriesChart data={filtered} outcome={outcome} valueLabel={target.kind === 'rate' ? '금리' : '관측값'} onRetry={snapshot ? undefined : () => { void series.refetch() }} /> : series.isError ? <Notice title="시장 추이를 불러오지 못했어요" error>피드백과 확정 관측값은 계속 볼 수 있어요.<Button variant="text" onClick={() => void series.refetch()}>그래프 다시 불러오기</Button></Notice> : <Notice title="시장 추이를 불러오고 있어요">확정된 관측값을 확인하고 있어요.</Notice>}
    <div className="grid gap-3 sm:grid-cols-3">{horizons.map(h => {
      const row = outcome.observations.find(o => o.horizon === h)
      return <section key={h} className="min-w-0 space-y-2 rounded-card bg-surface-subtle p-4">
        <h3 className="text-control font-medium">T{h} · {h}거래일</h3>
        <p className="text-meta text-text-secondary">내 예상 · {directionLabel(target, draft[target.id]?.[h]?.direction ?? null)}</p>
        <p className="font-mono text-control">실제 · {row ? actualChange(row, target) : '관측 정보 없음'}</p>
        <p className="text-meta text-text-muted">{row?.observationSessionDate ?? row?.unavailableReason ?? '확정 관측일 없음'}{row && row.observationDelaySessions > 0 ? ` · ${row.observationDelaySessions}거래일 지연` : ''}</p>
      </section>
    })}</div>
    <Link to={`${routeBase}/learning/${sessionId}/results`} className={`${linkClass} text-meta text-text-secondary`}>관측 결과와 중간 메모 자세히 보기</Link>
  </section>
}
