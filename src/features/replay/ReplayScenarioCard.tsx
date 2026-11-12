import { useId } from 'react'
import type { ReplayScenario } from './api'

function formatReferenceMonth(value: string) {
  const [year, month] = value.split('-')
  return year && month ? `${year}년 ${Number(month)}월` : value
}

/** 결과 공개 전 시나리오 카드. 결과 수치·그래프·사후 보도는 표시하지 않는다. */
export function ReplayScenarioCard({ scenario, categoryLabel }: { scenario: ReplayScenario; categoryLabel: string }) {
  const titleId = useId()
  return (
    <article aria-labelledby={titleId} className="space-y-4 rounded-card border border-border-default bg-surface-canvas p-6">
      <span className="inline-flex rounded-pill border border-brand-primary bg-brand-subtle px-3 py-1 text-label text-brand-primary">Replay</span>
      <h2 id={titleId} className="text-section">{scenario.title}</h2>
      <p className="text-meta text-text-muted">{categoryLabel} · {formatReferenceMonth(scenario.referenceMonth)}</p>
      <p className="text-control font-medium text-brand-primary">결과는 예측을 제출한 뒤에만 확인할 수 있어요.</p>
      <p className="text-meta text-text-muted">학습용 시나리오 · 원문은 결과가 드러날 수 있어 주의</p>
    </article>
  )
}
