import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts'
import type { OutcomesDto, SeriesDto } from './api/contracts'
import { Notice } from './components/PagePrimitives'

type Outcome = OutcomesDto['targets'][number]
export default function MarketSeriesChart({ data, outcome }: { data: SeriesDto; outcome: Outcome }) {
  const baseline = outcome.baseline
  const map = new Map(data.series.map(p => [p.tradingDate, p]))
  if (baseline.status === 'ready' && baseline.baselineValue !== null && baseline.baselineSessionDate) map.set(baseline.baselineSessionDate, { tradingDate: baseline.baselineSessionDate, closeValue: baseline.baselineValue, unit: baseline.unit, dataSourceName: baseline.dataSourceName ?? '', dataSourceUrl: baseline.dataSourceUrl })
  const points = [...map.values()].sort((a, b) => a.tradingDate.localeCompare(b.tradingDate))
  if (!points.length) return <Notice title="시장 추이가 아직 없어요">확정된 일별 종가를 확보하면 표시해요. 미래 구간은 그리지 않아요.</Notice>
  return <div className="space-y-4"><div role="img" aria-label={`일별 종가 추이, ${points.length}개 확정 관측값`} className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ top: 12, right: 24, bottom: 12, left: 8 }}><CartesianGrid stroke="var(--color-border-default)" vertical={false} /><XAxis dataKey="tradingDate" tick={{ fontSize: 12 }} /><YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => [`${value} ${points[0].unit}`, '종가']} /><Line dataKey="closeValue" name="종가" type="linear" stroke="var(--color-brand-primary)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />{outcome.observations.filter(o => o.status === 'ready' && o.observationSessionDate && points.some(p => p.tradingDate === o.observationSessionDate)).map(o => <ReferenceDot key={o.horizon} x={o.observationSessionDate!} y={o.observedValue!} r={4} fill="var(--color-brand-primary)" label={`T${o.horizon}`} />)}</LineChart></ResponsiveContainer></div>
    <div className="flex flex-wrap gap-6 font-mono text-label text-text-secondary">{baseline.status === 'ready' && <span>T0 {baseline.baselineValue?.toLocaleString('ko-KR')} {baseline.unit}</span>}{outcome.observations.filter(o => o.status === 'ready').map(o => <span key={o.horizon}>T{o.horizon} {o.observedValue?.toLocaleString('ko-KR')} {o.unit}</span>)}</div><details className="text-meta"><summary className="cursor-pointer text-brand-primary">확정 종가 표로 보기</summary><table className="mt-4 w-full text-left"><thead><tr><th>거래일</th><th>종가</th><th>출처</th></tr></thead><tbody>{points.map(p => <tr key={p.tradingDate} className="border-b border-border-default"><td className="py-2">{p.tradingDate}</td><td>{p.closeValue.toLocaleString('ko-KR')} {p.unit}</td><td>{p.dataSourceName || '정보 없음'}</td></tr>)}</tbody></table></details>
    <p className="text-meta text-text-secondary">대상별 거래일 달력 기준 · 미래 구간은 표시하지 않아요. 이 변화는 뉴스 하나의 직접적인 영향을 뜻하지 않아요.</p>
  </div>
}
