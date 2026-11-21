import { Link } from 'react-router-dom'
import { linkClass } from '../learning/components/PagePrimitives'
import { formatReferenceMonth, type ReplayScenario } from './api'

export function ReplayScenarioCard({ scenario, categoryLabel, search }: { scenario: ReplayScenario; categoryLabel: string; search: string }) {
  return <article className="min-w-0 space-y-4 rounded-card bg-surface-subtle p-6">
    <p className="text-meta text-text-muted">{categoryLabel} · {formatReferenceMonth(scenario.referenceMonth)}</p>
    <h2 className="text-section">{scenario.title}</h2>
    <p className="text-control font-medium">{scenario.keywords}</p>
    <p className="text-ui text-text-secondary">{scenario.summary}</p>
    <Link to={`/replay/${scenario.id}${search}`} className={`${linkClass} w-full border border-border-default bg-surface-canvas`}>당시 뉴스 살펴보기<span className="sr-only"> · {scenario.title}</span></Link>
  </article>
}
