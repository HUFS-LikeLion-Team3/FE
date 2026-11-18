import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { PageTitle, Shell, Notice, TargetSwitcher, linkClass } from '../learning/components/PagePrimitives'
import { directionLabel, type Horizon } from '../learning/model'
import ReplayReflection from './ReplayReflection'
import ReplayPeriodSummary from './ReplayPeriodSummary'
import { formatReplayValue as format } from './result-format'
import { validReplayData, validReplaySeries } from './validation'
import type { ReplayData, ReplaySave, ReplayState } from './model'

const MarketSeriesChart = lazy(() => import('../learning/MarketSeriesChart'))
const stateCopy = {
  loading: ['과거 결과를 불러오고 있어요', '확정된 과거 기준값과 관측 결과를 확인하고 있어요.'],
  error: ['과거 결과를 불러오지 못했어요', '예측 기록은 유지했어요. 다시 조회해 주세요.'],
  locked: ['아직 결과를 공개하지 않았어요', '최초 AI 피드백을 확인한 뒤 실제 결과 보기를 선택해 주세요.'],
  unsupported: ['Replay 결과 기능을 준비하고 있어요', '지난 뉴스의 결과 공개와 통합 회고 저장이 연결되면 이용할 수 있어요.'],
  empty: ['이 Replay 자료를 열 수 없어요', '확인 가능한 결과가 없어요. 저장한 학습 기록을 확인해 주세요.'],
} as const

// Production stays closed until Replay ID mapping, reveal and save APIs are agreed.
// Never treat the route's replayId as a live learning-session ID or use mock fallback.
export default function ReplayResultsPage() {
  return <ReplayResultsView state="unsupported" />
}
export function ReplayResultsView({ data, state = 'ready', save, retry, preview = false }: {
  data?: ReplayData; state?: ReplayState; save?: ReplaySave; retry?: () => void; preview?: boolean
}) {
  const [active, setActive] = useState('')
  const [horizon, setHorizon] = useState<Horizon>(1)
  // Gate before mounting the chart, summary cards or the reflection editor.
  const resolvedState = state !== 'ready' ? state : !data ? 'empty' : !data.resultsRevealedAt || Number.isNaN(Date.parse(data.resultsRevealedAt)) ? 'locked' : !validReplayData(data) ? 'error' : 'ready'
  if (resolvedState !== 'ready' || !data) {
    const copy = stateCopy[resolvedState === 'ready' ? 'empty' : resolvedState]
    return <Shell><div role={resolvedState === 'error' ? 'alert' : 'status'}><PageTitle label="REPLAY / OBSERVATION & REFLECTION" title={copy[0]} description={copy[1]} /></div>
      {resolvedState === 'loading' ? <Button disabled loading>불러오는 중</Button> : resolvedState === 'error' && retry ? <Button onClick={retry}>결과 다시 불러오기</Button> : null}
      <Link to="/learning" className={linkClass}>학습 기록 보기</Link>
    </Shell>
  }
  const target = data.targets.find(item => item.id === active) ?? data.targets[0]
  const outcome = data.outcomes.targets.find(item => item.sessionTargetId === target.id)
  const row = outcome?.observations.find(item => item.horizon === horizon)
  const baseline = outcome?.baseline
  const ready = baseline?.status === 'ready' && baseline.baselineValue !== null && row?.status === 'ready' && row.observedValue !== null
  const prediction = data.draft[target.id]?.[horizon]
  const series = data.series[target.id]
  const rate = target.kind === 'rate'
  const sourceUrl = row?.dataSourceUrl ?? baseline?.dataSourceUrl
  return <Shell><PageTitle label="REPLAY / OBSERVATION & REFLECTION" title="지난 변화에서, 다음 관점을 발견하다" description={`${data.title} · 지난 뉴스 학습 · 결과를 공개했어요`} />
    <div className="space-y-2 rounded-card bg-brand-subtle p-4"><p className="text-control font-medium">과거의 결과를 함께 살펴보세요</p><p className="text-meta text-text-muted">{preview ? '아래 수치는 시안용 예시입니다. 실제 학습에서는 당시 기준일과 출처가 확인된 결과를 보여드려요.' : '당시 기준일과 출처가 확인된 과거 결과예요. 현재 제출 시각으로 다시 계산하지 않아요.'}</p></div>
    <div className="[&_button]:min-w-[180px]"><TargetSwitcher targets={data.targets} active={target.id} onChange={setActive} /></div>
    <ReplayPeriodSummary data={data} target={target} active={horizon} onChange={setHorizon} />
    <section className="space-y-4" aria-labelledby="replay-observation-title">
      <h2 id="replay-observation-title" className="text-section">관찰된 변화 · {horizon}거래일</h2>
      {!ready ? <Notice title={row?.status === 'pending' ? '이 기간의 관측값을 확인하고 있어요' : '이 기간의 관측값이 없어요'}>{row?.unavailableReason ?? baseline?.unavailableReason ?? '해당 거래일의 자료가 없어 변화량과 그래프를 표시하지 않아요. 다른 기간은 확인하고 통합 회고를 남길 수 있어요.'}</Notice> : <div className="grid grid-cols-2 items-start gap-6">
        <div className="space-y-3"><div className="grid grid-cols-2 gap-4">{[[`당시 기준 ${rate ? '금리' : '종가'} · T0`, baseline.baselineValue], [`관측 ${rate ? '금리' : '종가'} · T${horizon}`, row.observedValue]].map(([label, value]) => <div key={String(label)} className="space-y-2 rounded-card bg-surface-subtle p-4"><p className="text-meta text-text-muted">{label}</p><p className="font-mono text-number">{format(value as number)}{rate ? baseline.unit : ''}</p></div>)}</div>
          <p className="text-meta text-text-secondary">{rate ? '변화폭은 위 기간 카드에서 확인해 주세요.' : `변화량 · ${format(row.changeValue, true)}${row.unit === 'pt' ? '포인트' : row.unit}`}</p>
          <p className="text-meta text-text-muted">{rate ? `금리 수준 ${baseline.unit} · 변화폭 %p · 변화율은 표시하지 않아요.` : `${target.name} 수준 · 변화량 / 변화율`}</p>
        </div>
        <div className="space-y-3"><Notice title="당시 기준일과 관측일"><dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1"><dt>기준일</dt><dd>{baseline.baselineSessionDate ?? '날짜 정보 없음'}</dd><dt>관측일</dt><dd>{row.observationSessionDate ?? '날짜 정보 없음'}</dd></dl><p className="mt-1">당시 기준 종가를 사용하며, 지금의 제출 시각으로 다시 계산하지 않아요.</p></Notice>
          {sourceUrl ? <a href={sourceUrl} className={`${linkClass} w-full`} target="_blank" rel="noopener noreferrer">데이터 출처 · {row.dataSourceName ?? baseline.dataSourceName ?? '당시 종가 자료 보기'} ↗<span className="sr-only"> (새 탭)</span></a> : <p className="py-3 text-center text-meta text-text-muted">데이터 출처 · {row.dataSourceName ?? baseline.dataSourceName ?? '정보 없음'}</p>}
        </div>
      </div>}
    </section>
    {ready && <section className="space-y-4" aria-labelledby="replay-chart-title"><h2 id="replay-chart-title" className="text-section">T0 이후 20거래일의 시장 추이</h2>
      <p className="text-meta text-text-muted">일별 {rate ? '금리' : '종가'} · {target.name}{preview ? ' · 시안용 예시' : ''}</p>
      {!series || !series.series.length ? <Notice title="일별 추이 자료가 없어요">확정된 관측값만 확인할 수 있어요. 없는 일별 값은 채우지 않아요.</Notice> : !validReplaySeries(data, target.id, series) ? <Notice title="그래프 자료를 확인하지 못했어요" error>대상·단위·기간 또는 확정 관측값이 다른 그래프는 표시하지 않아요.</Notice> : <Suspense fallback={<Notice title="시장 추이를 불러오고 있어요">잠시만 기다려 주세요.</Notice>}><MarketSeriesChart data={series} outcome={outcome!} valueLabel={rate ? '금리' : '종가'} replay /></Suspense>}
    </section>}
    <ReplayReflection key={`${data.replayId}:${data.receipt?.clientRequestId ?? 'draft'}`} data={data} save={save} prediction={{ label: `${horizon}거래일 · ${directionLabel(target, prediction?.direction ?? null)}`, reason: prediction?.reason || '판단 이유를 기록하지 않았어요.' }} />
  </Shell>
}
