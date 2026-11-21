import { useRef, useState } from 'react'
import { Link, Navigate, useBeforeUnload, useBlocker, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { TextArea } from '@/components/ui/TextField'
import { Modal } from '../learning/components/Modal'
import { Notice, PageTitle, Shell, TargetSwitcher, linkClass } from '../learning/components/PagePrimitives'
import { directionLabel, horizons, validateDraft, type Direction, type Draft, type Horizon } from '../learning/model'
import { replayTargets, type ReplayScenario } from './api'
import { readReplaySession, saveReplaySession } from './preview-session'

export default function ReplayPrediction({ scenario }: { scenario: ReplayScenario }) {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [params] = useSearchParams()
  const [session, setSession] = useState(() => readReplaySession(scenario.id))
  const [draft, setDraft] = useState<Draft>(() => readReplaySession(scenario.id)?.draft ?? {})
  const [active, setActive] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedText, setSavedText] = useState<string | null>(null)
  const inFlight = useRef(false)
  const leaving = useRef(false)
  const failures = useRef(new Set<string>())
  const [savedSignature, setSavedSignature] = useState(() => JSON.stringify(session?.draft ?? {}))
  const dirty = JSON.stringify(draft) !== savedSignature
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !leaving.current && (dirty || inFlight.current) && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search))
  useBeforeUnload(event => { if (!leaving.current && (dirty || inFlight.current)) { event.preventDefault(); event.returnValue = '' } })
  if (!session?.targetIds.length) return <Navigate to={`/replay/${scenario.id}/targets${search}`} replace />
  if (session.submittedAt) return <Navigate to={`/replay/${scenario.id}/feedback${search}`} replace />
  const targets = replayTargets.filter(target => session.targetIds.some(id => id === target.id))
  const target = targets.find(item => item.id === active) ?? targets[0]
  const change = (horizon: Horizon, patch: { direction?: Direction; reason?: string }) => {
    setDraft(previous => ({ ...previous, [target.id]: { ...previous[target.id], [horizon]: { ...previous[target.id][horizon], ...patch } } }))
    setError(null); setSavedText(null)
  }
  const save = async (submit: boolean) => {
    if (inFlight.current) return
    const validation = submit ? validateDraft(draft, targets) : null
    if (validation) { setError(validation); return }
    inFlight.current = true; setBusy(true); setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 350))
      const failure = submit ? 'submit-error' : 'save-error'
      if (params.get('state') === failure && !failures.current.has(failure)) { failures.current.add(failure); throw new Error(submit ? '예측을 제출하지 못했어요. 입력은 유지했어요.' : '임시 저장하지 못했어요. 입력은 유지했어요.') }
      const next = saveReplaySession({ ...session, draft, savedAt: new Date().toISOString(), submittedAt: submit ? new Date().toISOString() : null })
      setSavedSignature(JSON.stringify(draft))
      setSession(next); setSavedText('이 탭에 임시 저장했어요.')
      if (submit) { leaving.current = true; navigate(`/replay/${scenario.id}/feedback${search}`) }
    } catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했어요. 입력을 유지했어요.') }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <Shell section="/explore"><PageTitle label="REPLAY / PREDICTION" title="결과를 보기 전, 내 생각부터 남기다" description={`${scenario.title} · ${target.name} · 과거 기준 시점의 정보로 판단해 주세요.`} />
    <Notice title="당시 뉴스만 보고 생각해 보세요" className="bg-brand-subtle">실제 과거 결과와 그래프는 아직 공개하지 않아요. 대상별 방향을 모두 고르고 전체에서 이유 하나 이상을 남겨 주세요.</Notice>
    <fieldset disabled={busy} className="min-w-0"><legend className="sr-only">예측 작성 대상</legend><TargetSwitcher targets={targets} active={target.id} onChange={setActive} /></fieldset>
    <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,3fr)] items-start gap-12">
      <fieldset disabled={busy} className="min-w-0 space-y-8"><legend className="sr-only">{target.name}의 기간별 예측</legend>{horizons.map(horizon => <section key={horizon} className="space-y-4"><h2 className="text-section">{horizon}거래일 · 방향 필수</h2>
        <div className="flex gap-2" role="group" aria-label={`${horizon}거래일 방향`}>{(['up', 'down', 'neutral'] as const).map(direction => <FilterChip key={direction} className="min-w-[180px]" selected={draft[target.id][horizon].direction === direction} onClick={() => change(horizon, { direction })}>{directionLabel(target, direction)}</FilterChip>)}</div>
        <TextArea label={`${horizon}거래일 판단 이유 · 개별 선택`} rows={4} maxLength={3000} className="min-h-32 border-border-default" value={draft[target.id][horizon].reason} onChange={event => change(horizon, { reason: event.target.value })} helperText="세 기간 중 판단 이유를 하나 이상 남겨 주세요." placeholder="당시 뉴스에서 어떤 사실과 이유를 연결했는지 적어보세요." />
      </section>)}</fieldset>
      <aside className="min-w-0 space-y-6"><h2 className="text-section">참조 뉴스</h2><Link to={`/replay/${scenario.id}${search}`} className="text-ui text-brand-primary underline">{scenario.title}</Link><p className="text-meta text-text-muted">당시 기준일과 거래일 달력을 기준으로 1·5·20거래일을 비교해요. 이번 제출 시각의 현재 종가를 과거 기준값으로 사용하지 않아요.</p>
        <Link to={`/replay/${scenario.id}/targets${search}`} className={linkClass}>대상 선택 다시 보기</Link>
        {error && <Notice title="입력을 확인해 주세요" error>{error}</Notice>}{savedText && <Notice title="임시 저장 완료">{savedText}</Notice>}
        <Button variant="secondary" className="w-full" loading={busy && !reviewOpen} disabled={busy} onClick={() => void save(false)}>임시 저장</Button>
        <Button className="w-full" disabled={busy} onClick={() => { const message = validateDraft(draft, targets); if (message) setError(message); else { setError(null); setReviewOpen(true) } }}>예측 제출 검토</Button>
        <p className="text-meta text-text-muted">확정 후 대상·방향·이유를 수정할 수 없어요. 새 생각은 결과 공개 후 통합 회고로 남겨요.</p>
      </aside>
    </div>
    {reviewOpen && <Modal title="예측을 확정할까요?" onClose={() => { if (!busy) setReviewOpen(false) }}><p className="text-ui">선택한 모든 대상과 세 기간의 예측을 확인해 주세요. 확정 후에는 수정할 수 없어요.</p>{targets.map(item => <section key={item.id} className="space-y-3"><h3 className="text-control font-medium">{item.name}</h3>{horizons.map(horizon => <div key={horizon} className="space-y-1 rounded-control bg-surface-subtle p-3"><p className="text-control">{horizon}거래일 · {directionLabel(item, draft[item.id][horizon].direction)}</p><p className="whitespace-pre-wrap break-words text-meta text-text-secondary">{draft[item.id][horizon].reason.trim() || '판단 이유 미작성'}</p></div>)}</section>)}{error && <Notice title="제출하지 못했어요" error>{error}</Notice>}<Button loading={busy} onClick={() => void save(true)}>예측 확정하기</Button><Button variant="secondary" disabled={busy} onClick={() => setReviewOpen(false)}>계속 수정하기</Button></Modal>}
    {blocker.state === 'blocked' && <Modal title="작성 중인 예측을 남겨두고 나갈까요?" onClose={() => { if (!busy) blocker.reset() }}><p className="text-ui">임시 저장하지 않은 변경은 사라져요.</p><Button disabled={busy} onClick={() => blocker.reset()}>계속 작성하기</Button><Button disabled={busy} variant="secondary" onClick={() => blocker.proceed()}>저장하지 않고 나가기</Button></Modal>}
  </Shell>
}
