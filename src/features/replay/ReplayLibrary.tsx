import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Notice, PageTitle, Shell, linkClass } from '../learning/components/PagePrimitives'
import { readReplayFilters, replayCategories, replayYears, type ReplayNewsItem, type ReplayTargetOption } from './api'
import { ReplayErrorNotice } from './ReplayErrorNotice'
import { ReplayScenarioCard } from './ReplayScenarioCard'

const selectClass = 'min-h-12 rounded-control border border-border-default bg-surface-canvas px-4 text-control focus-visible:outline-2 focus-visible:outline-brand-primary'

type Props = {
  state: 'loading' | 'error' | 'ready'
  error: Error | null
  retry: () => void
  retrying: boolean
  items: ReplayNewsItem[]
  totalElements: number | null
  hasNext: boolean
  loadingMore: boolean
  moreError: boolean
  onMore: () => void
  /** 시장 대상 옵션. 조회 중·실패·빈 목록이면 빈 배열이고, 이때 시장 대상 필터를 숨긴다. */
  targetOptions: readonly ReplayTargetOption[]
  fixtures: boolean
}

function LibrarySkeleton() {
  return <div role="status" aria-label="지난 뉴스를 불러오는 중" className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
    {[0, 1, 2, 3].map(index => <div key={index} aria-hidden="true" className="space-y-4 rounded-card bg-surface-subtle p-6 motion-safe:animate-pulse">
      <div className="h-5 w-40 rounded-control bg-surface-canvas" /><div className="h-8 w-3/4 rounded-control bg-surface-canvas" /><div className="h-12 rounded-control bg-surface-canvas" />
    </div>)}
  </div>
}

export default function ReplayLibrary({ state, error, retry, retrying, items, totalElements, hasNext, loadingMore, moreError, onMore, targetOptions, fixtures }: Props) {
  const [params, setParams] = useSearchParams()
  const filters = readReplayFilters(params, targetOptions)
  const category = replayCategories.find(item => item.key === filters.category)
  const filtered = !!(filters.category || filters.year || filters.targetId)
  const change = (key: 'category' | 'period' | 'target', value: string) => setParams(previous => {
    const next = new URLSearchParams(previous)
    if (value === 'all') next.delete(key); else next.set(key, value)
    return next
  }, { preventScrollReset: true })
  const reset = () => setParams(previous => { const next = new URLSearchParams(previous); for (const key of ['category', 'period', 'target']) next.delete(key); return next }, { preventScrollReset: true })
  const search = params.size ? `?${params.toString()}` : ''
  const label = category?.label ?? '전체'
  const status = state === 'loading' ? `${label} · 불러오는 중` : state === 'error' ? `${label} · 불러오지 못함`
    : `${label} ${totalElements !== null ? `${totalElements}개 중 ` : ''}${items.length}개 표시${fixtures ? ' · 시안용 예시' : ''}`
  return <Shell section="/explore"><div className="space-y-6"><PageTitle label="REPLAY / LIBRARY" title={category ? `${category.label}의 지난 뉴스` : '지난 뉴스로, 한 번의 학습을 경험하다'} description="발표 당시의 사실에서 시작해 예측하고, 공개된 과거 결과와 함께 돌아보세요." />
    <nav className="flex gap-2" aria-label="뉴스 시점"><Link to="/explore" className={`${linkClass} min-w-40 rounded-pill border border-border-default`}>오늘의 뉴스</Link><Link to="/replay" aria-current="page" className={`${linkClass} min-w-40 rounded-pill border border-brand-primary bg-brand-subtle text-brand-primary`}>✓ 지난 뉴스</Link></nav>
    <p role="status" className="rounded-card bg-brand-subtle p-4 text-control">실제 결과는 예측·피드백을 확인한 뒤 직접 공개해요.</p>
    <section aria-label="지난 뉴스 필터" className="space-y-3 rounded-card border border-border-default p-4">
      <div className="flex flex-wrap gap-2"><FilterChip className="min-w-25" selected={!category} onClick={() => change('category', 'all')}>전체</FilterChip>{replayCategories.map(item => <FilterChip key={item.key} className="min-w-25" selected={category?.key === item.key} onClick={() => change('category', item.key)}>{item.label}</FilterChip>)}</div>
      <div className="flex flex-wrap items-center gap-3">
        <label><span className="sr-only">기간</span><select aria-label="기간" className={`${selectClass} w-55`} value={filters.year ?? 'all'} onChange={event => change('period', event.target.value)}><option value="all">기간 · 전체</option>{replayYears.map(year => <option key={year} value={year}>{year}년</option>)}</select></label>
        {targetOptions.length > 0 && <label><span className="sr-only">시장 대상</span><select aria-label="시장 대상" className={`${selectClass} w-65`} value={filters.targetId ?? 'all'} onChange={event => change('target', event.target.value)}><option value="all">시장 대상 · 전체</option>{targetOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <Button variant="text" className="w-40" onClick={reset}>필터 초기화</Button>
        <p role="status" className="text-meta text-text-muted">{status}</p>
      </div>
    </section>
    {state === 'loading' ? <LibrarySkeleton />
      : state === 'error' && error ? <ReplayErrorNotice error={error} titles={{ unsupported: '지난 뉴스 검색이 아직 준비되지 않았어요', notFound: '선택한 시장 대상을 찾을 수 없어요', other: '지난 뉴스를 불러오지 못했어요' }} retry={retry} busy={retrying}>{filtered && <Button variant="text" onClick={reset}>필터 초기화</Button>}</ReplayErrorNotice>
      : items.length ? <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">{items.map(item => <ReplayScenarioCard key={item.id} news={item} search={search} />)}</div>
      : filtered ? <Notice title="조건에 맞는 지난 뉴스가 없어요">다른 분야·기간·대상을 선택하거나 필터를 초기화해 주세요.<Button variant="text" onClick={reset}>모든 지난 뉴스 보기</Button></Notice>
      : <Notice title="아직 지난 뉴스가 없어요">학습할 수 있는 지난 뉴스가 준비되면 이곳에서 확인할 수 있어요.</Notice>}
    {state === 'ready' && moreError && <Notice title="추가 뉴스를 불러오지 못했어요" error>표시된 뉴스는 그대로 유지했어요.</Notice>}
    {state === 'ready' && (hasNext || moreError) && <Button variant="secondary" className="w-full" loading={loadingMore} onClick={onMore}>{moreError ? '추가 뉴스 다시 불러오기' : '지난 뉴스 더 보기'}</Button>}
  </div></Shell>
}
