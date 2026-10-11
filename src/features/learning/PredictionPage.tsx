import { useRef, useState } from 'react'
import { Link, useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Choice } from '@/components/ui/Choice'
import { TextArea } from '@/components/ui/TextField'
import { Modal } from './components/Modal'
import { linkClass, Notice, PageTitle, Shell, TargetSwitcher } from './components/PagePrimitives'
import type { NewsView } from './model'
import { directionLabel, horizons, validateDraft, type Direction, type Horizon, type Target } from './model'
import type { Session } from './session-context'

type Props = { news: NewsView; newsHref: string; feedbackHref: string; session: Session; targets: Target[]; onRequestTargetChange: () => void; onSave: () => Promise<void>; onSubmit: () => Promise<void> }
export default function PredictionPage({ news, newsHref, feedbackHref, session, targets, onRequestTargetChange, onSave, onSubmit }: Props) {
  const navigate = useNavigate()
  const [active, setActive] = useState(targets[0].id)
  const [review, setReview] = useState(false)
  const [expanded, setExpanded] = useState(targets[0].id)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'save' | 'submit' | null>(null)
  const allowNavigation = useRef(false)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => session.dirty && !allowNavigation.current && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload(event => { if (session.dirty && !allowNavigation.current) { event.preventDefault(); event.returnValue = '' } })
  const target = targets.find(t => t.id === active) ?? targets[0]
  const index = targets.findIndex(t => t.id === target.id)
  const nextTarget = targets[index + 1]
  const update = (h: Horizon, patch: { direction?: Direction; reason?: string }) => {
    session.setDraft({ ...session.draft, [target.id]: { ...session.draft[target.id], [h]: { ...session.draft[target.id][h], ...patch } } })
    setError(null)
    setActionError(null)
  }
  const save = async (leave = false) => {
    setBusy('save'); setActionError(null)
    try { await onSave() } catch { setBusy(null); setActionError('임시 저장하지 못했어요. 작성 내용은 유지했어요. 다시 시도해 주세요.'); return }
    setBusy(null)
    if (leave && blocker.state === 'blocked') blocker.proceed()
  }
  const openReview = () => {
    const message = validateDraft(session.draft, targets)
    setError(message)
    if (message) return
    setActionError(null); setExpanded(targets[0].id); setReview(true)
  }
  const submit = async () => {
    if (busy) return
    const message = validateDraft(session.draft, targets)
    if (message) { setReview(false); setError(message); return }
    setBusy('submit'); setActionError(null)
    try { await onSubmit() } catch { setBusy(null); setActionError('예측을 확정하지 못했어요. 대상·방향·이유를 유지했어요. 다시 제출해 주세요.'); return }
    allowNavigation.current = true
    setBusy(null)
    navigate(feedbackHref)
  }
  const closeReview = () => { if (!busy) { setReview(false); setActionError(null) } }
  return <Shell><PageTitle label="WORKBOOK / PREDICTION" title="나의 생각을 기록해 보세요" description="먼저 내 관점으로 예상하고, 제출 후 AI 피드백을 살펴보세요." />
    <div className="text-center"><Link to={newsHref} className={linkClass}>← 작성 화면 나가기</Link></div>
    <fieldset disabled={!!busy} className="min-w-0 space-y-8"><legend className="sr-only">대상별 예측 작성</legend>
      <TargetSwitcher targets={targets} active={target.id} onChange={setActive}><Button variant="text" onClick={onRequestTargetChange}>대상 변경</Button></TargetSwitcher>
      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,3fr)] items-start gap-12">
        <div className="min-w-0 space-y-6"><h2 className="text-section">대상 {index + 1}/{targets.length} · {target.name}</h2>
          {horizons.map(h => <fieldset key={`${target.id}-${h}`} className="space-y-4 border-b border-border-default pb-6"><legend className="mb-4 flex w-full justify-between"><span className="text-section">{h}거래일</span><span className="self-center text-meta text-text-muted">방향 필수</span></legend>
            <div className="grid grid-cols-3 gap-3">{(['up', 'down', 'neutral'] as const).map(direction => <Choice key={direction} type="radio" name={`${target.id}-${h}`} value={direction} className="[&>span]:border-border-control [&>span]:peer-checked:border-brand-primary" label={directionLabel(target, direction)} checked={session.draft[target.id][h].direction === direction} onChange={() => update(h, { direction })} />)}</div>
            <TextArea label="판단 이유 · 개별 선택" rows={2} value={session.draft[target.id][h].reason} onChange={event => update(h, { reason: event.target.value })} placeholder="판단에 참고한 요소를 기록해보세요." helperText="금리·환율·수급·실적처럼 참고한 요소를 적어보세요. 전체 예측 중 이유 하나 이상이 필요해요." />
          </fieldset>)}
          <p className="text-meta text-brand-primary">선택한 대상 {targets.length}개 · 각 대상의 방향을 모두 선택하고, 전체 이유를 하나 이상 작성해 주세요.</p>
          {error && <Notice title={error} error>입력한 내용은 유지했어요. 대상별 작성 내용을 확인해 주세요.</Notice>}
          <Button className="w-full" onClick={nextTarget ? () => { setActive(nextTarget.id); window.scrollTo({ top: 0, behavior: 'instant' }) } : openReview}>{nextTarget ? '다음 대상 작성' : '예측 제출 검토'}</Button>
        </div>
        <aside className="space-y-6 rounded-card bg-surface-subtle p-6"><h2 className="text-control font-medium">참조 뉴스</h2><p className="text-news-title">{news.title}</p><Link to={newsHref} className={`${linkClass} w-full`}>뉴스 다시 보기</Link><div className="border-t border-border-default pt-6"><h3 className="mb-6 text-control font-medium">기준 시점과 관찰 기간</h3><p className="text-meta text-text-secondary">제출 후 최초로 확정되는 정규 거래 세션 종가(T0)를 기준으로 1·5·20거래일을 관찰해요. 휴장일은 제외하며 대상별 날짜는 다를 수 있어요.</p></div>
          <Button variant="secondary" className="w-full" loading={busy === 'save'} onClick={() => void save()}>임시 저장</Button>
          <p role="status" className="whitespace-pre-line text-meta text-text-muted">자동 저장하지 않습니다.{`\n`}{session.savedAt ? `마지막 저장 ${session.savedAt}` : '아직 저장하지 않았어요'}{session.dirty ? ' · 저장되지 않은 변경 있음' : ''}</p>
          {actionError && !review && blocker.state !== 'blocked' && <Notice title="저장 실패" error>{actionError}</Notice>}
          <p className="text-meta text-text-secondary">확정 후 대상·방향·이유를 바꿀 수 없습니다. 회고 메모는 별도로 추가할 수 있어요.</p>
        </aside>
      </div>
    </fieldset>
    {review && <Modal title="예측을 확정하기 전에" onClose={closeReview}><p className="text-ui text-text-secondary">선택한 대상 {targets.length}개 · 필수 방향 {targets.length * 3}/{targets.length * 3}</p>
      {targets.map(t => <section key={t.id} className="rounded-card bg-surface-subtle p-4"><Button variant="text" className="w-full" aria-expanded={expanded === t.id} aria-controls={`review-${t.id}`} disabled={!!busy} onClick={() => setExpanded(expanded === t.id ? '' : t.id)}>{expanded === t.id ? '⌄' : '›'} {t.name}</Button>
        <div id={`review-${t.id}`} hidden={expanded !== t.id} className="space-y-4 pt-6">{horizons.map(h => <div key={h}><p className="text-control font-medium">{h}거래일 · {directionLabel(t, session.draft[t.id][h].direction)}</p><p className="mt-2 whitespace-pre-wrap break-words text-meta text-text-secondary">{session.draft[t.id][h].reason.trim() ? session.draft[t.id][h].reason : '판단 이유를 기록하지 않았어요.'}</p></div>)}<Button variant="text" className="w-full" disabled={!!busy} onClick={() => { setActive(t.id); closeReview() }}>이 대상 수정하기</Button></div>
        {expanded !== t.id && <p className="mt-2 text-meta text-text-secondary">{horizons.map(h => `${h}일 ${directionLabel(t, session.draft[t.id][h].direction)}`).join(' / ')}</p>}
      </section>)}
      <Notice title="확정 후에는 수정할 수 없어요.">예측 대상·방향·이유는 확정한 상태로 보존됩니다.</Notice>{actionError && <Notice title="제출 실패" error>{actionError}</Notice>}
      <Button className="w-full" loading={busy === 'submit'} onClick={() => void submit()}>예측 확정하기</Button><Button variant="secondary" className="w-full" disabled={!!busy} onClick={closeReview}>계속 수정하기</Button>
    </Modal>}
    {blocker.state === 'blocked' && <Modal title="저장하지 않은 변경이 있어요" onClose={() => { if (!busy) { blocker.reset(); setActionError(null) } }}><p className="text-ui text-text-secondary">마지막 저장 이후 바꾼 내용은 나가면 사라집니다. 한 번도 저장하지 않았다면 현재 입력 전체가 사라집니다.</p>{actionError && <Notice title="저장 실패" error>{actionError}</Notice>}<Button className="w-full" disabled={!!busy} onClick={() => { blocker.reset(); setActionError(null) }}>계속 작성하기</Button><Button variant="secondary" className="w-full" loading={busy === 'save'} onClick={() => void save(true)}>임시 저장하고 나가기</Button><Button variant="text" className="w-full" disabled={!!busy} onClick={() => { session.discard(); blocker.proceed() }}>저장하지 않고 나가기</Button></Modal>}
  </Shell>
}
