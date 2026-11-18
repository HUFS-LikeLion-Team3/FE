import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Notice, PageTitle, Shell, linkClass } from '../learning/components/PagePrimitives'
import { replayCategories, replayTargets, type ReplayScenario } from './api'
import { ReplayScenarioCard } from './ReplayScenarioCard'

const selectClass = 'min-h-12 rounded-control border border-border-default bg-surface-canvas px-4 text-control focus-visible:outline-2 focus-visible:outline-brand-primary'
export default function ReplayLibrary({ scenarios }: { scenarios: ReplayScenario[] }) {
  const [params, setParams] = useSearchParams()
  const category = replayCategories.find(item => item.key === params.get('category'))
  const period = ['2025', '2024', '2023'].includes(params.get('period') ?? '') ? params.get('period')! : 'all'
  const target = replayTargets.find(item => item.id === params.get('target'))
  const filtered = scenarios.filter(item => (!category || item.category === category.key) && (period === 'all' || item.referenceMonth.startsWith(period)) && (!target || item.targetIds.some(id => id === target.id)))
  const requested = Number(params.get('count') ?? 6)
  const shown = Number.isInteger(requested) && requested >= 6 ? Math.min(requested, scenarios.length) : 6
  const visible = filtered.slice(0, shown)
  const change = (key: string, value: string) => setParams(previous => {
    const next = new URLSearchParams(previous)
    if (value === 'all') next.delete(key); else next.set(key, value)
    next.delete('count')
    return next
  })
  const reset = () => setParams(previous => { const next = new URLSearchParams(previous); for (const key of ['category', 'period', 'target', 'count']) next.delete(key); return next })
  return <Shell section="/explore"><div className="space-y-6"><PageTitle label="REPLAY / LIBRARY" title={category ? `${category.label}의 지난 뉴스` : '지난 뉴스로, 한 번의 학습을 경험하다'} description="발표 당시의 사실에서 시작해 예측하고, 공개된 과거 결과와 함께 돌아보세요." />
    <nav className="flex gap-2" aria-label="뉴스 시점"><Link to="/explore" className={`${linkClass} min-w-40 rounded-pill border border-border-default`}>오늘의 뉴스</Link><Link to="/replay" aria-current="page" className={`${linkClass} min-w-40 rounded-pill border border-brand-primary bg-brand-subtle text-brand-primary`}>✓ 지난 뉴스</Link></nav>
    <p role="status" className="rounded-card bg-brand-subtle p-4 text-control">실제 결과는 예측·피드백을 확인한 뒤 직접 공개해요.</p>
    <section aria-label="지난 뉴스 필터" className="space-y-3 rounded-card border border-border-default p-4">
      <div className="flex flex-wrap gap-2"><FilterChip className="w-[100px]" selected={!category} onClick={() => change('category', 'all')}>전체</FilterChip>{replayCategories.map(item => <FilterChip key={item.key} className={{rate_policy:"w-[170px]",price:"w-[100px]",employment:"w-[130px]",fx_export:"w-[140px]",energy:"w-[180px]",semiconductor:"w-[150px]"}[item.key]} selected={category?.key === item.key} onClick={() => change('category', item.key)}>{item.label}</FilterChip>)}</div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative"><span className="sr-only">기간</span><select aria-label="기간" className={`${selectClass} w-[220px]`} value={period} onChange={event => change('period', event.target.value)}><option value="all">기간 · 전체</option>{['2025', '2024', '2023'].map(year => <option key={year} value={year}>{year}년</option>)}</select></label>
        <label><span className="sr-only">시장 대상</span><select aria-label="시장 대상" className={`${selectClass} w-[260px]`} value={target?.id ?? 'all'} onChange={event => change('target', event.target.value)}><option value="all">시장 대상 · 전체</option>{replayTargets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <Button variant="text" className="w-40" onClick={reset}>필터 초기화</Button>
        <p role="status" className="text-meta text-text-muted">{category?.label ?? '전체'} {filtered.length}개 · {visible.length}개 표시 · 시안용 예시</p>
      </div>
    </section>
    {visible.length ? <div className="grid grid-cols-2 gap-x-12 gap-y-6">{visible.map(item => <ReplayScenarioCard key={item.id} scenario={item} categoryLabel={replayCategories.find(category => category.key === item.category)!.label} search={params.size ? `?${params.toString()}` : ''} />)}</div>
      : <Notice title="조건에 맞는 지난 뉴스가 없어요">다른 분야·기간·대상을 선택하거나 필터를 초기화해 주세요.<Button variant="text" onClick={reset}>모든 지난 뉴스 보기</Button></Notice>}
    {visible.length < filtered.length && <Button variant="secondary" className="w-full" onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set('count', String(shown + 6)); return next }, { preventScrollReset: true })}>지난 뉴스 더 보기</Button>}
  </div></Shell>
}
