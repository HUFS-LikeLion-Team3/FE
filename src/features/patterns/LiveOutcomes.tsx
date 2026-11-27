import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Notice, linkClass } from '@/features/learning/components/PagePrimitives'
import { getPatternOutcomes, type OutcomeCase } from './api'
import { horizons, markets } from './model'
import type { EvidenceView } from './PatternEvidence'
import type { Horizon } from '../learning/model'

type MarketOption = typeof markets[number]
const grid = 'grid grid-cols-[240px_240px_144px_140px_minmax(0,1fr)] gap-4 p-4'

function predictionLabel(item: OutcomeCase, market: MarketOption) {
  if (item.direction === 'neutral') return '큰 방향성 없음'
  if (market.key === 'rate') return item.direction === 'up' ? '금리 상승' : '금리 하락'
  if (market.key === 'fx') return item.direction === 'up' ? '환율 상승' : '환율 하락'
  return item.direction === 'up' ? '상승' : '하락'
}

/** 금리는 %p 변화폭, 그 밖의 대상은 변화율(%)로 보여준다. 값이 없으면 null. */
function change(item: OutcomeCase, market: MarketOption) {
  const points = market.key === 'rate' || item.unit === '%'
  const value = points ? item.changeValue : item.changePercent
  if (value === null) return null
  return { value, label: `${value.toLocaleString('ko-KR', { maximumFractionDigits: 2, signDisplay: 'exceptZero' })}${points ? '%p' : '%'}` }
}

function formatValue(value: number | null, unit: string) {
  if (value === null) return '-'
  return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}${unit === '%' ? '%' : ''}`
}

function outcomeEvidence(item: OutcomeCase, market: MarketOption, horizon: Horizon): EvidenceView {
  const moved = change(item, market)
  return {
    title: `${market.key === 'rate' ? '금리 학습 기록' : '학습 기록'} · ${item.newsTitle}`,
    description: market.key === 'rate' ? '내 학습 기록 · 읽기 전용 · 변화폭은 %p로 표시해요.' : '내 학습 기록 · 읽기 전용',
    entries: [{ title: item.newsTitle, lines: [
      `${item.targetName} · ${horizon}거래일\n기준일 ${item.baselineDate ?? '-'} (${formatValue(item.baselineValue, item.unit)}) · 관측일 ${item.observationDate ?? '-'} (${formatValue(item.observedValue, item.unit)})\n내 예측 · ${predictionLabel(item, market)} / 관찰된 변화 · ${moved?.label ?? '-'}`,
      ...(item.reason ? [`판단 이유 원문\n${item.reason}`] : []),
      item.reflection ? `저장한 회고 원문\n${item.reflection}` : '아직 최종 회고를 남기지 않았어요.',
    ] }],
  }
}

export function LiveOutcomes({ market, horizon, onMarket, onHorizon, onEvidence }: {
  market: MarketOption; horizon: Horizon
  onMarket: (key: string) => void; onHorizon: (value: string) => void; onEvidence: (view: EvidenceView) => void
}) {
  const query = useQuery({
    queryKey: ['patterns', 'outcomes', market.code, horizon],
    queryFn: ({ signal }) => getPatternOutcomes(market.code, horizon, signal), retry: false,
  })
  const data = query.data
  const sufficient = data ? data.stage !== 'insufficient' : false
  return <>
    <div className="flex flex-wrap gap-x-12 gap-y-4">
      <div className="flex gap-2" role="group" aria-label="시장 범주">{markets.map(item => <FilterChip key={item.key} className={item.width} selected={market.key === item.key} onClick={() => onMarket(item.key)}>{item.label}</FilterChip>)}</div>
      <div className="flex gap-2" role="group" aria-label="비교 기간">{horizons.map(value => <FilterChip key={value} className="w-40" selected={horizon === value} onClick={() => onHorizon(String(value))}>{value}거래일</FilterChip>)}</div>
    </div>
    {query.isPending && <Notice title="기록의 흐름을 살펴보고 있어요">확정된 관측값과 연결된 학습 기록을 확인하고 있어요.<Button loading disabled>불러오는 중</Button></Notice>}
    {query.isError && <Notice title="사례를 불러오지 못했어요" error><p>{query.error.message} 저장한 예측·회고는 유지돼요.</p><Button variant="text" onClick={() => void query.refetch()}>다시 불러오기</Button></Notice>}
    {data && !query.isError && <>
      <Notice className="bg-brand-subtle" title={sufficient
        ? `${market.label} × ${horizon}거래일 · ${data.stage === 'repeated_tendency' ? '반복 경향' : '초기 관찰'} · 서로 다른 뉴스 ${data.distinctNewsCount}개`
        : `확정 관측이 있는 서로 다른 뉴스 ${data.distinctNewsCount}개 / 최소 ${data.minimumNewsCount}개`}>
        {sufficient
          ? `${data.stage === 'repeated_tendency' ? `서로 다른 뉴스 ${data.repeatedNewsCount}개 이상에서 관측된 사례예요.` : `최소 ${data.minimumNewsCount}개를 충족했지만 아직 작은 표본이에요.`} 같은 뉴스는 1개로 세며, 예측과 관측값을 나란히 보여드려요.`
          : '이 시장 범주와 기간에서는 아직 비교를 시작할 사례가 부족해요. 다른 조건을 선택하거나 관측이 끝난 뒤 다시 확인해 주세요.'}
      </Notice>
      {sufficient ? <>
        <div className="overflow-x-auto"><table className="block w-full min-w-[1000px]" aria-label={`${market.label} ${horizon}거래일 예측·관측·회고 사례`}>
          <thead className="block rounded-card bg-surface-subtle"><tr className={`${grid} text-left text-control font-medium`}>{['당시 뉴스', '대상·기준일·관측일', '내 예측', '관찰된 변화', '내 회고'].map(label => <th key={label} scope="col" className="font-medium">{label}</th>)}</tr></thead>
          <tbody className="block space-y-4 pt-4">{data.cases.map(item => {
            const moved = change(item, market)
            return <tr key={item.newsId} className={grid}>
              <th scope="row" className="space-y-2 text-left text-control font-medium">{item.newsTitle}<Button variant="text" className="w-full min-h-11 py-2" onClick={() => onEvidence(outcomeEvidence(item, market, horizon))}>기록 보기 →<span className="sr-only"> {item.newsTitle}</span></Button></th>
              <td className="space-y-2"><p className="text-control font-medium">{item.targetName}</p><p className="text-meta text-text-muted">기준일 {item.baselineDate ?? '-'}<br />관측일 {item.observationDate ?? '-'}</p></td>
              <td className="text-ui text-text-secondary">{predictionLabel(item, market)}</td>
              <td className={`font-mono text-xl leading-7 ${!moved || moved.value === 0 ? 'text-market-neutral' : moved.value > 0 ? 'text-market-up' : 'text-market-down'}`}>{moved?.label ?? '-'}</td>
              <td className="whitespace-pre-wrap break-words text-ui leading-[30px] text-text-secondary">{item.reflection ?? <span className="text-text-muted">아직 최종 회고를 남기지 않았어요.</span>}</td>
            </tr>
          })}</tbody>
        </table></div>
        <Notice title="수치와 회고를 함께 읽어보세요">‘큰 방향성 없음’도 관측된 변화량 그대로 보여드려요. 적중 여부·총점·승률로 바꾸지 않아요. 이 비교만으로 뉴스의 인과관계나 투자 결론을 내릴 수 없어요.</Notice>
        <Link to="/learning" className={`${linkClass} w-full border border-border-default`}>관련 학습 기록 보기</Link>
      </> : <Link to="/explore" className={`${linkClass} w-full`}>뉴스 살펴보고 기록하기</Link>}
    </>}
  </>
}
