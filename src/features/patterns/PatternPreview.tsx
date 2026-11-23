import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Notice, Shell, linkClass } from '@/features/learning/components/PagePrimitives'
import { PatternHeading, PatternNavigation } from './PatternNavigation'
import { PatternEvidence, type EvidenceView } from './PatternEvidence'
import { patternFixture } from './fixtures'
import { changeLabel, directionLabel, distinctOutcomeNews, distinctReasonNews, horizons, markets, type OutcomeRecord, type PreviewState } from './model'

const states: { key: PreviewState; label: string }[] = [
  { key: 'ready', label: '기본 · 초기 관찰' }, { key: 'repeated', label: '반복 경향 · 5개' },
  { key: 'insufficient', label: '표본 부족' }, { key: 'empty', label: '기록 없음' },
  { key: 'loading', label: '로딩' }, { key: 'error', label: '조회 실패' },
]
const groups = [
  { key: 'policy', title: '금리와 정책 기대', body: '판단 이유에서 정책 결정과 기대 변화를 함께 언급한 기록이 있었어요.' },
  { key: 'demand', title: '실적과 수요', body: '발표 실적과 이후 수요를 구분해 적어둔 사례가 있었어요.' },
]
function outcomeEntry(record: OutcomeRecord) {
  return { title: record.title, lines: [
    `${record.target} · ${record.horizon}거래일\n기준일 [T0 정규 거래일] · 관측일 [T${record.horizon} 정규 거래일]\n내 예측 · ${directionLabel(record)} / 관찰된 변화 · ${changeLabel(record)}`,
    `저장한 회고 원문\n${record.reflection}`,
  ] }
}

export default function PatternPreview() {
  const [params, setParams] = useSearchParams()
  const kind = params.get('pattern') === 'outcome' ? 'outcome' : 'reasoning'
  const market = markets.find(item => item.key === params.get('market')) ?? markets[1]
  const horizon = horizons.find(value => String(value) === params.get('horizon')) ?? 5
  const state = states.find(item => item.key === params.get('state'))?.key ?? 'ready'
  const data = patternFixture(state)
  const reasons = distinctReasonNews(data.reasons)
  const outcomes = distinctOutcomeNews(data.outcomes, market.key, horizon)
  const sufficient = kind === 'reasoning' ? reasons.length >= 5 : outcomes.length >= 3
  const unavailable = state === 'loading' || state === 'error'
  const change = (key: string, value?: string) => setParams(previous => {
    const next = new URLSearchParams(previous)
    next.delete('group'); next.delete('record')
    if (value) next.set(key, value); else next.delete(key)
    return next
  })
  let evidence: EvidenceView | null = null
  const group = kind === 'reasoning' ? groups.find(item => item.key === params.get('group')) : undefined
  if (group && sufficient && !unavailable) {
    const linked = distinctReasonNews(data.reasons.filter(record => record.variables.includes(group.key)))
    evidence = {
      title: `${group.title} · 연결된 판단 ${linked.length}개`,
      description: `서로 다른 뉴스 ${reasons.length}개 중 이 요약에 연결된 ${linked.length}개예요. 한 뉴스가 여러 관점에 함께 포함될 수 있어요. 시안용 기록 예시이며 읽기 전용이에요.`,
      entries: linked.map(record => ({ title: record.title, lines: [`${record.target} · ${record.horizon}거래일 · 판단 이유 원문`, record.reason] })),
    }
  }
  const selectedRecord = kind === 'outcome' && sufficient && !unavailable ? outcomes.find(record => record.newsId === params.get('record')) : undefined
  if (selectedRecord) evidence = {
    title: `${market.key === 'rate' ? '금리 학습 기록' : '학습 기록'} · ${selectedRecord.title}`,
    description: market.key === 'rate' ? '시안용 학습 기록 예시 · 읽기 전용 · 변화폭은 %p로 표시해요.' : '시안용 학습 기록 예시 · 읽기 전용',
    entries: [outcomeEntry(selectedRecord)],
  }
  const title = kind === 'reasoning'
    ? sufficient ? '기록에서, 반복되는 생각을 발견하다' : '조금 더 쌓이면, 흐름을 살펴볼 수 있어요'
    : sufficient ? '예상과 관찰을, 나란히 살펴보다' : '이 조건의 사례를 더 기다리고 있어요'
  return <>
    <Shell section="/learning"><div className="space-y-6" aria-label="학습 패턴 시안 미리보기">
      <PatternHeading title={title} description={kind === 'reasoning'
        ? sufficient ? '정답이나 점수 대신 내가 쌓아온 판단의 흐름을 돌아보세요.' : '판단 이유를 적은 서로 다른 뉴스가 더 필요해요.'
        : market.key === 'rate' ? '금리 범주와 기간을 맞춰 관측된 변화폭과 당시 판단을 함께 살펴보세요.' : '시장 범주와 기간을 맞춰 서로 다른 뉴스의 사례를 비교해 보세요.'} />
      <PatternNavigation kind={kind} onChange={value => change('pattern', value)} />
      {kind === 'outcome' && <div className="flex gap-12">
        <div className="flex gap-2" role="group" aria-label="시장 범주">{markets.map(item => <FilterChip key={item.key} className={item.width} selected={market.key === item.key} onClick={() => change('market', item.key)}>{item.label}</FilterChip>)}</div>
        <div className="flex gap-2" role="group" aria-label="비교 기간">{horizons.map(value => <FilterChip key={value} className="w-40" selected={horizon === value} onClick={() => change('horizon', String(value))}>{value}거래일</FilterChip>)}</div>
      </div>}

      {unavailable ? <section className="max-w-[720px] space-y-6 rounded-card bg-surface-subtle p-8" aria-busy={state === 'loading'} role={state === 'error' ? 'alert' : 'status'}>
        <p className="font-mono text-label text-brand-primary">P1-02 / {state === 'loading' ? '패턴 로딩' : '패턴 조회 실패'}</p>
        <h2 className="text-section">{state === 'loading' ? '기록의 흐름을 살펴보고 있어요' : '패턴을 불러오지 못했어요'}</h2>
        <p className="text-ui text-text-secondary">{state === 'loading' ? '집계와 연결된 근거 기록을 확인하고 있어요.' : '저장한 예측·회고는 유지돼요. 다시 조회해 주세요.'}</p>
        <Button className="w-full" loading={state === 'loading'} onClick={() => change('state')}>{state === 'loading' ? '불러오는 중' : '다시 불러오기'}</Button>
      </section> : kind === 'reasoning' ? <>
        <Notice className="bg-brand-subtle" title={sufficient ? `판단 이유 패턴 · 서로 다른 뉴스 ${reasons.length}개 · 최소 5개 충족` : `현재 ${reasons.length}개 / 필요한 뉴스 5개`}>
          {sufficient ? '판단 이유를 남긴 기록만 사용해요. 같은 뉴스의 여러 대상·기간은 1개로 세며, 결과 도착 전에도 살펴볼 수 있어요. 시안용 예시예요.' : `판단 이유가 있는 서로 다른 뉴스 ${5 - reasons.length}개를 더 기록하면 요약을 보여드려요. 이유가 없는 기록과 같은 뉴스의 여러 기간은 개수를 늘리지 않아요. 시안용 예시예요.`}
        </Notice>
        {sufficient ? <>
          <h2 className="text-section">자주 고려한 요소</h2>
          <div className="grid grid-cols-2 items-start gap-12">{groups.map(item => {
            const linked = distinctReasonNews(data.reasons.filter(record => record.variables.includes(item.key)))
            return <article key={item.key} className="space-y-2 rounded-card bg-surface-subtle p-4">
              <h3 className="text-control font-medium">{item.title} · {reasons.length}개 중 {linked.length}개</h3>
              <p className="text-meta text-text-muted">{item.body}</p>
              <div className="space-y-2 rounded-card border border-border-default bg-surface-canvas p-6">
                <p className="text-control font-medium">연결 기록 예시 · {linked[0].title}</p>
                <blockquote className="text-ui text-text-secondary">“{linked[0].reason}”</blockquote>
                <Button variant="text" className="w-full" onClick={() => change('group', item.key)}>연결된 판단 {linked.length}개 모두 보기</Button>
              </div>
            </article>
          })}</div>
          <h2 className="text-section">함께 살펴볼 관점</h2>
          <div className="grid grid-cols-2 items-start gap-12">
            <Notice title="비슷한 기간의 다른 사건">일부 이유에서는 같은 시점의 다른 지표를 함께 확인했는지 기록에서 알기 어려웠어요. 실제로 고려하지 않았다는 뜻은 아니에요.</Notice>
            <Notice title="다음 기록에 남겨볼 질문">반대 시나리오는 무엇이었을까? 이미 반영된 기대와 새 정보를 어떻게 나누었을까?</Notice>
          </div>
          <p className="text-meta text-text-muted">기록에 적힌 내용의 경향이며 능력 평가나 투자 판단이 아니에요. 표본이 바뀌면 요약도 달라질 수 있어요.</p>
        </> : <>
          {reasons.length === 0 && <Notice title="아직 이유를 남긴 기록이 없어요">판단 이유를 적은 서로 다른 뉴스 5개가 쌓이면 이유 패턴을 보여드려요.</Notice>}
          <Link to="/explore" className={`${linkClass} w-full bg-brand-primary text-surface-canvas`}>뉴스 살펴보고 기록하기</Link>
          <Link to="/learning" className={`${linkClass} w-full`}>내 학습 기록 보기</Link>
        </>}
      </> : <>
        <Notice className="bg-brand-subtle" title={sufficient
          ? `${market.label} × ${horizon}거래일 · ${outcomes.length >= 5 ? '반복 경향' : '초기 관찰'} · 서로 다른 뉴스 ${outcomes.length}개`
          : `확정 관측이 있는 서로 다른 뉴스 ${outcomes.length}개 / 최소 3개`}>
          {sufficient ? `${outcomes.length >= 5 ? '서로 다른 뉴스 5개 이상에서 관측된 사례예요.' : '최소 3개를 충족했지만 아직 작은 표본이에요.'} 같은 뉴스는 1개로 세며, 예측과 관측값을 나란히 보여드려요. 시안용 예시예요.`
            : '이 시장 범주와 기간에서는 아직 비교를 시작할 사례가 부족해요. 다른 조건을 선택하거나 관측이 끝난 뒤 다시 확인해 주세요. 시안용 예시예요.'}
        </Notice>
        {sufficient ? <>
          <table className="block w-full" aria-label={`${market.label} ${horizon}거래일 예측·관측·회고 사례`}>
            <thead className="block rounded-card bg-surface-subtle"><tr className="grid grid-cols-[240px_240px_144px_140px_minmax(0,1fr)] gap-4 p-4 text-left text-control font-medium">{['당시 뉴스', '대상·기준일·관측일', '내 예측', '관찰된 변화', '내 회고'].map(label => <th key={label} scope="col" className="font-medium">{label}</th>)}</tr></thead>
            <tbody className="block space-y-4 pt-4">{outcomes.map(record => <tr key={record.newsId} className="grid grid-cols-[240px_240px_144px_140px_minmax(0,1fr)] gap-4 p-4">
              <th scope="row" className="space-y-2 text-left text-control font-medium">{record.title}<Button variant="text" className="w-full min-h-11 py-2" onClick={() => change('record', record.newsId)}>기록 보기 →<span className="sr-only"> {record.title}</span></Button></th>
              <td className="space-y-2"><p className="text-control font-medium">{record.target}</p><p className="text-meta text-text-muted">기준일 [T0 정규 거래일]<br />관측일 [T{horizon} 정규 거래일]</p></td>
              <td className="text-ui text-text-secondary">{directionLabel(record)}</td>
              <td className={`font-mono text-xl leading-7 ${record.change > 0 ? 'text-market-up' : record.change < 0 ? 'text-market-down' : 'text-market-neutral'}`}>{changeLabel(record)}</td>
              <td className="text-ui leading-[30px] text-text-secondary">{record.reflection}</td>
            </tr>)}</tbody>
          </table>
          <Notice title="수치와 회고를 함께 읽어보세요">‘큰 방향성 없음’도 관측된 변화량 그대로 보여드려요. 적중 여부·총점·승률로 바꾸지 않아요. 이 비교만으로 뉴스의 인과관계나 투자 결론을 내릴 수 없어요.</Notice>
          <Link to="/learning" className={`${linkClass} w-full border border-border-default`}>관련 학습 기록 보기</Link>
        </> : <Button className="w-full" onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="시장 범주"] button')?.focus()}>다른 조건 살펴보기</Button>}
      </>}
      {evidence && <PatternEvidence view={evidence} onClose={() => change('group')} />}
    </div></Shell>
    <aside aria-label="학습 패턴 개발 도구" className="mx-auto my-6 max-w-[1200px] space-y-3 rounded-card border border-border-default bg-surface-subtle p-4">
      <p className="text-control font-medium">개발 미리보기 · 가상 학습 패턴</p><p className="text-meta text-text-muted">피그마 시안용 예시이며 실제 사용자 기록·AI 분석·시장 관측값이 아니에요. 실제 API는 호출하지 않아요.</p>
      <label className="flex items-center gap-3 text-control">화면 상태<select className="min-h-12 rounded-control border border-border-control bg-surface-canvas px-4" value={state} onChange={event => change('state', event.target.value)}>{states.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
      <Link className={linkClass} to="/learning?tab=patterns">실제 API 화면으로</Link>
    </aside>
  </>
}
