import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/lib/api-client'
import { Notice, Shell, linkClass } from '@/features/learning/components/PagePrimitives'
import { getPatternCategories, getPatternHorizons, getPatternReasons, getPatternSuggestions, type DirectionCounts, type VariablePattern } from './api'
import { PatternHeading, PatternNavigation } from './PatternNavigation'
import { PatternEvidence, type EvidenceView } from './PatternEvidence'
import { LiveOutcomes } from './LiveOutcomes'
import { horizons, markets } from './model'

function RequestState({ pending, error, retry }: { pending: boolean; error: Error | null; retry: () => void }) {
  const location = useLocation()
  if (error) return <Notice title="패턴을 불러오지 못했어요" error>
    <p>{error.message} 저장한 예측·회고는 유지돼요.</p>
    {error instanceof ApiError && error.status === 401
      ? <Link className={linkClass} to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>로그인하러 가기</Link>
      : <Button variant="text" onClick={retry}>다시 불러오기</Button>}
  </Notice>
  return pending ? <Notice title="기록의 흐름을 살펴보고 있어요">집계와 연결된 근거 기록을 확인하고 있어요.<Button loading disabled>불러오는 중</Button></Notice> : null
}

/** 마지막 글자의 받침. 한글이 아니면 null. */
function finalConsonant(word: string) {
  const code = word.trim().charCodeAt(word.trim().length - 1) - 0xac00
  return code >= 0 && code <= 11171 ? code % 28 : null
}
/** 받침에 맞는 조사. 한글이 아니면 둘 다 보여준다. */
const particle = (word: string, withBatchim: string, without: string) => {
  const batchim = finalConsonant(word)
  return batchim === null ? `${withBatchim}(${without})` : batchim ? withBatchim : without
}
/** '으로/로': 받침이 없거나 ㄹ 받침이면 '로'. */
const directionParticle = (word: string) => {
  const batchim = finalConsonant(word)
  return batchim === null ? '(으)로' : batchim && batchim !== 8 ? '으로' : '로'
}

/** 카드마다 대표 예시 문장이 겹치지 않도록, 앞 카드에서 이미 대표로 쓴 문장은 뒤로 미룬다. */
function withDistinctLeadExamples(values: VariablePattern[]) {
  const used = new Set<string>()
  return values.map(value => {
    const lead = value.exampleTexts.find(text => !used.has(text.trim()))
    if (lead === undefined) return value
    used.add(lead.trim())
    return { ...value, exampleTexts: [lead, ...value.exampleTexts.filter(text => text !== lead)] }
  })
}

/** 많이 쓴 순서로 한 줄 요약. 점수나 평가 없이 횟수만 적는다. */
function KeywordSummary({ values }: { values: VariablePattern[] }) {
  const [top, ...rest] = values
  if (!top) return null
  const others = rest.slice(0, 2).map(value => `${value.variableName}${particle(value.variableName, '은', '는')} ${value.mentionCount}개`).join(', ')
  return <p className="text-ui text-text-secondary">가장 자주 쓴 판단 키워드는 ‘{top.variableName}’{particle(top.variableName, '이에요', '예요')}(뉴스 {top.mentionCount}개).{others && ` 이어서 ${others} 뉴스에서 썼어요.`}</p>
}

function VariableCards({ values, reflection = false, onEvidence }: { values: VariablePattern[]; reflection?: boolean; onEvidence: (view: EvidenceView) => void }) {
  return <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
    {withDistinctLeadExamples(values).map(value => <article key={value.variable} className="space-y-2 rounded-card bg-surface-subtle p-4">
      <h3 className="text-control font-medium">{reflection ? `${value.mentionCount}개 뉴스의 회고에서 ‘${value.variableName}’${particle(value.variableName, '을', '를')} 돌아봤어요` : `${value.mentionCount}개 뉴스에서 ‘${value.variableName}’${directionParticle(value.variableName)} 판단했어요`}</h3>
      <p className="text-meta text-text-muted">{reflection ? '놓친 변수에 대한 최종 회고에서 직접 언급한 키워드예요.' : '판단 이유에 직접 쓴 키워드예요. 문맥이나 예측의 정오를 평가하지 않아요.'}</p>
      {value.exampleTexts.length > 0 && <div className="space-y-2 rounded-card border border-border-default bg-surface-canvas p-6">
        <p className="text-control font-medium">{reflection ? '최종 회고' : '판단 이유'} 원문 예시</p>
        <blockquote className="whitespace-pre-wrap break-words text-ui text-text-secondary">“{value.exampleTexts[0]}”</blockquote>
        <Button variant="text" className="w-full" onClick={() => onEvidence({
          title: `${value.variableName} · 원문 예시 ${value.exampleTexts.length}개`,
          description: `서로 다른 뉴스 ${value.mentionCount}개에서 쓴 키워드예요. 원문 예시는 최대 3개이며 읽기 전용이에요.`,
          entries: value.exampleTexts.map((body, index) => ({ title: `${reflection ? '최종 회고' : '판단 이유'} 원문 ${index + 1}`, lines: [body] })),
        })}>원문 예시 {value.exampleTexts.length}개 보기</Button>
      </div>}
    </article>)}
  </div>
}

function DirectionSummary({ counts }: { counts: DirectionCounts }) {
  return <span className="text-meta text-text-secondary">상승 {counts.up}건 · 하락 {counts.down}건 · 큰 방향성 없음 {counts.neutral}건</span>
}

export default function LivePatterns() {
  const [params, setParams] = useSearchParams()
  const kind = params.get('pattern') === 'outcome' ? 'outcome' : 'reasoning'
  const selectedCategory = params.get('category')?.trim() || undefined
  const category = selectedCategory && selectedCategory.length <= 255 ? selectedCategory : undefined
  const reasoning = kind === 'reasoning'
  const market = markets.find(item => item.key === params.get('market')) ?? markets[1]
  const horizon = horizons.find(value => String(value) === params.get('horizon')) ?? 5
  const [evidence, setEvidence] = useState<EvidenceView | null>(null)
  const reasons = useQuery({ queryKey: ['patterns', 'reasons'], enabled: reasoning, queryFn: ({ signal }) => getPatternReasons(signal), retry: false })
  const suggestions = useQuery({ queryKey: ['patterns', 'suggestions'], enabled: reasoning, queryFn: ({ signal }) => getPatternSuggestions(signal), retry: false })
  const categories = useQuery({ queryKey: ['patterns', 'categories'], queryFn: ({ signal }) => getPatternCategories(signal), retry: false })
  const periods = useQuery({ queryKey: ['patterns', 'horizons', category], queryFn: ({ signal }) => getPatternHorizons(category, signal), retry: false })
  const setParam = (key: string, value?: string) => {
    setEvidence(null)
    setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next }, { preventScrollReset: true })
  }
  return <Shell section="/learning"><div className="space-y-6">
    <PatternHeading title={kind === 'reasoning' ? '기록에서, 반복되는 생각을 발견하다' : '예상과 관찰을, 나란히 살펴보다'} description={kind === 'reasoning' ? '정답이나 점수 대신 내가 쌓아온 판단의 흐름을 돌아보세요.' : market.key === 'rate' ? '금리 범주와 기간을 맞춰 관측된 변화폭과 당시 판단을 함께 살펴보세요.' : '시장 범주와 기간을 맞춰 서로 다른 뉴스의 사례를 비교해 보세요.'} />
    <PatternNavigation kind={kind} onChange={value => setParam('pattern', value)} />

    {kind === 'reasoning' ? <>
      <RequestState pending={reasons.isPending} error={reasons.error} retry={() => void reasons.refetch()} />
      {reasons.data && !reasons.isError && <>
        <Notice className="bg-brand-subtle" title={`판단 이유가 있는 예측 ${reasons.data.analyzedPredictionCount}건 · 놓친 변수 최종 회고 ${reasons.data.analyzedReflectionCount}건`}>
          판단 이유를 남긴 기록만 사용해요. 위 건수는 예측·회고 기록 수이며, 서로 다른 뉴스 수와 달라요. 결과 도착 전에도 살펴볼 수 있어요.
        </Notice>
        {reasons.data.analyzedPredictionCount === 0 ? <Notice title="아직 이유를 남긴 기록이 없어요">판단 이유를 적은 서로 다른 뉴스 5개가 쌓이면 판단 키워드를 보여드려요.<Link to="/explore" className={`${linkClass} w-full`}>뉴스 살펴보기</Link></Notice>
          : suggestions.data?.insufficientData && !suggestions.isError ? <Notice title="조금 더 쌓이면, 흐름을 살펴볼 수 있어요">판단 이유를 적은 서로 다른 뉴스 5개가 필요해요. 같은 뉴스의 여러 대상·기간은 한 개로 세어요.<Link to="/explore" className={`${linkClass} w-full`}>뉴스 살펴보고 기록하기</Link></Notice>
          : !suggestions.data || suggestions.isError ? null : <>
            <h2 className="text-section">나의 판단 키워드</h2>
            {reasons.data.consideredVariables.length > 0 && <KeywordSummary values={[...reasons.data.consideredVariables].sort((a, b) => b.mentionCount - a.mentionCount)} />}
            {reasons.data.consideredVariables.length ? <VariableCards values={[...reasons.data.consideredVariables].sort((a, b) => b.mentionCount - a.mentionCount)} onEvidence={setEvidence} /> : <Notice title="아직 요약할 키워드가 없어요">판단 이유에 쓴 키워드가 모이면 표시해요. 기록에 쓰지 않았다고 고려하지 않은 것으로 판단하지 않아요.</Notice>}
            {reasons.data.missedVariables.length > 0 && <><h2 className="text-section">회고에서 돌아본 키워드</h2><VariableCards values={reasons.data.missedVariables} reflection onEvidence={setEvidence} /></>}
          </>}
      </>}
      <h2 className="text-section">함께 살펴볼 관점</h2>
      <RequestState pending={suggestions.isPending} error={suggestions.error} retry={() => void suggestions.refetch()} />
      {suggestions.data && !suggestions.isError && (suggestions.data.insufficientData
        ? <Notice title="다음 학습 제안을 준비하고 있어요">판단 이유가 있는 서로 다른 뉴스 5개가 쌓이면, 기록에 근거한 제안을 보여드려요.</Notice>
        : suggestions.data.suggestions.length ? <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">{suggestions.data.suggestions.map(item => <article key={item.suggestionId} className="space-y-2 rounded-card bg-surface-subtle p-4">
          <h3 className="text-control font-medium">{item.title}</h3><p className="text-meta text-text-muted">{item.description}</p>
          <p className="text-meta text-text-secondary">{item.reason}</p>
          <Button variant="text" disabled={!item.evidence.exampleTexts.length} onClick={() => setEvidence({
            title: item.title, description: `${item.evidence.type === 'missed_variable' ? '놓친 변수 최종 회고' : '예측 판단 이유'} · 서로 다른 뉴스 ${item.evidence.count}개 · 원문 예시`,
            entries: item.evidence.exampleTexts.map((body, index) => ({ title: `원문 예시 ${index + 1}`, lines: [body] })),
          })}>제안 근거 보기</Button>
        </article>)}</div> : <Notice title="새로 제안할 관점이 없어요">분석 조건은 충족했지만, 반복해서 확인할 요소가 아직 없어요. 기록을 이어가며 다음에 다시 살펴보세요.</Notice>)}
    </> : <>
      <LiveOutcomes market={market} horizon={horizon} onMarket={value => setParam('market', value)} onHorizon={value => setParam('horizon', value)} onEvidence={setEvidence} />
      {import.meta.env.DEV && <Link className={linkClass} to="/learning?tab=patterns&preview=1&pattern=outcome">관측 결과 시안 미리보기</Link>}
    </>}

    <details className="space-y-6 rounded-card border border-border-default p-6">
      <summary className="cursor-pointer text-section focus-visible:outline-2 focus-visible:outline-brand-primary">분야·기간별 예측 기록</summary>
      <p className="text-meta text-text-muted">뉴스 분야별 제출 세션과 예측 건수예요. 한 뉴스의 여러 대상·기간은 예측 건수에 각각 포함돼요. 시장 범주별 관측 결과와는 다른 집계예요.</p>
      <RequestState pending={categories.isPending} error={categories.error} retry={() => void categories.refetch()} />
      {categories.data && !categories.isError && <>
        <p className="text-control">제출 세션 {categories.data.totalSessions}개 · 예측 {categories.data.totalPredictions}건</p>
        {categories.data.categories.length ? <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">{categories.data.categories.map(item => <li key={item.category} className="space-y-2 rounded-card bg-surface-subtle p-4">
          <p className="text-control font-medium">{item.categoryName} · 세션 {item.sessionCount}개 · 예측 {item.predictionCount}건</p><DirectionSummary counts={item.directionCounts} />
        </li>)}</ul> : <p className="text-meta text-text-muted">아직 제출한 예측 기록이 없어요.</p>}
        <label className="block space-y-2 text-control"><span>기간별 집계의 뉴스 분야</span>
          <select className="block min-h-12 w-64 rounded-control border border-border-control bg-surface-canvas px-4 focus-visible:outline-2 focus-visible:outline-brand-primary" value={category ?? ''} onChange={event => setParam('category', event.target.value || undefined)}>
            <option value="">전체 분야</option>
            {category && !categories.data.categories.some(item => item.category === category) && <option value={category}>{category}</option>}
            {categories.data.categories.map(item => <option key={item.category} value={item.category}>{item.categoryName}</option>)}
          </select>
        </label>
      </>}
      <RequestState pending={periods.isPending} error={periods.error} retry={() => void periods.refetch()} />
      {periods.data && !periods.isError && <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[...periods.data.horizons].sort((a, b) => a.tradingDays - b.tradingDays).map(item => <li key={item.horizon} className="space-y-2 rounded-card bg-surface-subtle p-4">
        <p className="text-control font-medium">{item.tradingDays}거래일 · 예측 {item.predictionCount}건</p><DirectionSummary counts={item.directionCounts} />
      </li>)}</ul>}
    </details>
    <p className="text-meta text-text-muted">기록에 적힌 내용의 경향이며 능력 평가나 투자 판단이 아니에요. 표본이 바뀌면 요약도 달라질 수 있어요.</p>
    {import.meta.env.DEV && <Link className={linkClass} to="/learning?tab=patterns&preview=1">피그마 학습 패턴 시안 미리보기</Link>}
    {evidence && <PatternEvidence view={evidence} onClose={() => setEvidence(null)} />}
  </div></Shell>
}
