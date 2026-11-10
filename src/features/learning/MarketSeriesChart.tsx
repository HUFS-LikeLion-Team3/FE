import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot, ReferenceLine } from 'recharts'
import type { OutcomesDto, SeriesDto } from './api/contracts'
import { Notice } from './components/PagePrimitives'

type Outcome = OutcomesDto['targets'][number]
export default function MarketSeriesChart({ data, outcome, valueLabel = '종가', replay = false }: { data: SeriesDto; outcome: Outcome; valueLabel?: string; replay?: boolean }) {
  const baseline = outcome.baseline
  const map = new Map(data.series.map(point => [point.tradingDate, point]))
  if (baseline.status === 'ready' && baseline.baselineValue !== null && baseline.baselineSessionDate) map.set(baseline.baselineSessionDate, { tradingDate: baseline.baselineSessionDate, closeValue: baseline.baselineValue, unit: baseline.unit, dataSourceName: baseline.dataSourceName ?? '', dataSourceUrl: baseline.dataSourceUrl })
  const points = [...map.values()].sort((a, b) => a.tradingDate.localeCompare(b.tradingDate))
  if (!points.length) return <Notice title="시장 추이가 아직 없어요">확정된 일별 종가를 확보하면 표시해요. 미래 구간은 그리지 않아요.</Notice>
  const readyRows = outcome.observations.filter(row => row.status === 'ready')
  return <div className="space-y-4">
    <div role="img" aria-label={`일별 ${valueLabel} 추이, ${points.length}개 확정 관측값`} className={replay ? 'h-[280px] w-full' : 'h-64 w-full'}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ top: 12, right: 24, bottom: 12, left: 8 }}>
        <CartesianGrid stroke="var(--color-border-default)" vertical={false} />
        <XAxis dataKey="tradingDate" tick={{ fontSize: 12 }} hide={replay} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
        <Tooltip formatter={value => [`${value} ${points[0].unit}`, valueLabel]} />
        <Line dataKey="closeValue" name={valueLabel} type="linear" stroke="var(--color-brand-primary)" strokeWidth={2} dot={replay ? false : { r: 3 }} isAnimationActive={false} />
        {replay && baseline.status === 'ready' && baseline.baselineValue !== null && baseline.baselineSessionDate && <><ReferenceLine x={baseline.baselineSessionDate} stroke="var(--color-border-control)" strokeDasharray="3 3" /><ReferenceDot x={baseline.baselineSessionDate} y={baseline.baselineValue} r={4} fill="var(--color-brand-primary)" /></>}
        {readyRows.filter(row => row.observationSessionDate && points.some(point => point.tradingDate === row.observationSessionDate)).map(row => <ReferenceDot key={row.horizon} x={row.observationSessionDate!} y={row.observedValue!} r={4} fill="var(--color-brand-primary)" label={replay ? undefined : `T${row.horizon}`} />)}
      </LineChart></ResponsiveContainer>
    </div>
    {replay ? <div className="grid grid-cols-4 gap-2 text-meta text-text-muted" aria-label="관측 마커 날짜">
      <span>T0 · {baseline.baselineSessionDate ?? '기준일 미확정'}</span>
      {([1, 5, 20] as const).map(horizon => <span key={horizon}>T{horizon} · {readyRows.find(row => row.horizon === horizon)?.observationSessionDate ?? '관측일 없음'}</span>)}
    </div> : <div className="flex flex-wrap gap-6 font-mono text-label text-text-secondary">
      {baseline.status === 'ready' && <span>T0 {baseline.baselineValue?.toLocaleString('ko-KR')} {baseline.unit}</span>}
      {readyRows.map(row => <span key={row.horizon}>T{row.horizon} {row.observedValue?.toLocaleString('ko-KR')} {row.unit}</span>)}
    </div>}
    {replay && <p className="text-meta text-text-muted">관측된 변화는 해당 뉴스만의 직접적인 영향을 뜻하지 않아요. 다른 동시기 요인도 함께 살펴보세요.</p>}
    <details className="text-meta"><summary className="min-h-11 cursor-pointer text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary">확정 {valueLabel} 표로 보기</summary>
      <table className="mt-4 w-full text-left"><thead><tr><th>거래일</th><th>{valueLabel}</th><th>출처</th></tr></thead><tbody>{points.map(point => <tr key={point.tradingDate} className="border-b border-border-default"><td className="py-2">{point.tradingDate}</td><td>{point.closeValue.toLocaleString('ko-KR')} {point.unit}</td><td>{point.dataSourceName || '정보 없음'}</td></tr>)}</tbody></table>
    </details>
    {!replay && <p className="text-meta text-text-secondary">대상별 거래일 달력 기준 · 미래 구간은 표시하지 않아요. 이 변화는 뉴스 하나의 직접적인 영향을 뜻하지 않아요.</p>}
  </div>
}
