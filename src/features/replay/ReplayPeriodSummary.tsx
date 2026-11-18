import { cn } from '@/lib/cn'
import { directionLabel, horizons, type Horizon, type Target } from '../learning/model'
import type { ReplayData } from './model'
import { formatReplayValue, replayChangeClass } from './result-format'

export default function ReplayPeriodSummary({ data, target, active, onChange }: {
  data: ReplayData; target: Target; active: Horizon; onChange: (horizon: Horizon) => void
}) {
  const outcome = data.outcomes.targets.find(item => item.sessionTargetId === target.id)
  const rate = target.kind === 'rate'
  return <section className="space-y-4" aria-labelledby="replay-period-title">
    <h2 id="replay-period-title" className="text-section">세 기간의 변화, 나란히 살펴보기</h2>
    <p className="text-meta text-text-muted">{rate ? '금리 변화폭은 %p로 읽어요. 기간을 선택하면 당시 금리와 판단 이유를 확인할 수 있어요.' : '기간별 변화율과 내 예상을 함께 살펴보세요. 카드를 선택하면 당시 수치와 판단 이유를 확인할 수 있어요.'}</p>
    <div className="grid grid-cols-3 gap-6" aria-label="Replay 관찰 기간">{horizons.map(horizon => {
      const row = outcome?.observations.find(item => item.horizon === horizon)
      const ready = outcome?.baseline.status === 'ready' && row?.status === 'ready'
      const value = ready ? rate ? row.changeValue : row.changePercent : null
      const hasValue = value != null && Number.isFinite(value)
      const status = row?.status === 'unavailable' || outcome?.baseline.status === 'unavailable' ? '관측 불가' : '확인 중'
      return <button key={horizon} type="button" aria-pressed={active === horizon} onClick={() => onChange(horizon)} className={cn('min-h-[140px] min-w-0 space-y-3 rounded-card border border-border-default bg-surface-subtle p-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary', active === horizon && 'border-brand-primary bg-brand-subtle')}>
        <span className="block text-meta text-text-muted">{horizon}거래일 · {rate ? '금리 변화폭' : '변화율'}</span>
        <span className={cn('block font-mono text-number', replayChangeClass(value))}>{hasValue ? `${formatReplayValue(value, true)}${rate ? '%p' : '%'}` : ready ? '변화 정보 없음' : status}</span>
        <span className="block break-words text-meta text-text-muted">내 예상 · {directionLabel(target, data.draft[target.id]?.[horizon]?.direction ?? null)}</span>
      </button>
    })}</div>
  </section>
}
