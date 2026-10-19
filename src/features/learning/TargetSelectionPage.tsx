import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Notice, PageTitle, Shell } from './components/PagePrimitives'
import type { NewsView, Target } from './model'

type Props = { news: NewsView; candidates: Target[]; selected: string[]; onToggle: (id: string) => void; onContinue: () => void; onCancel?: () => void }
export default function TargetSelectionPage({ news, candidates, selected, onToggle, onContinue, onCancel }: Props) {
  return <Shell section="/explore"><PageTitle label="1 / 대상 선택 → 2 / 예측 작성 → 3 / 제출 검토" title="무엇을 함께 관찰할까요?" description="이 뉴스와 관련된 후보 중 1~3개를 선택해 주세요. 선택한 뒤 기간별 예측을 작성해요." />
    <Notice title="참조 뉴스">{news.title}</Notice>
    <div className="space-y-8" role="group" aria-label="관찰 대상 선택">{candidates.map(target => <article key={target.id} className="space-y-2 rounded-card bg-surface-subtle p-6"><FilterChip className="w-[360px]" selected={selected.includes(target.id)} disabled={!selected.includes(target.id) && selected.length >= 3} onClick={() => onToggle(target.id)}>{target.name}</FilterChip><p className="text-meta text-text-secondary">{target.rationale ?? '이 뉴스와 함께 관찰할 시장 대상이에요.'}</p></article>)}</div>
    {!candidates.length && <Notice title="관찰 후보가 아직 없어요">후보 데이터가 준비되면 예측을 작성할 수 있어요.</Notice>}
    <p role="status" className="text-meta text-text-secondary">{selected.length ? `${selected.length}개 선택 · 최대 3개까지 선택할 수 있어요.` : '대상을 한 개 이상 선택해 주세요.'}</p>
    <Button className="w-full" disabled={!selected.length || selected.length > 3} onClick={onContinue}>선택한 대상 작성하기</Button>
    {onCancel && <Button variant="text" className="w-full" onClick={onCancel}>작성 화면으로 돌아가기</Button>}
  </Shell>
}
