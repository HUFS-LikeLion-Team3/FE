import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { TextArea } from '@/components/ui/TextField'
import { PageTitle, Shell, TargetSwitcher, Notice, linkClass } from './components/PagePrimitives'
import { QueryState } from './components/QueryState'
import { Modal } from './components/Modal'
import { loadWorkbook, type WorkbookData } from './api/workbook'
import { learningApi as api } from './api/service'
import { formatTime } from './api/page-data'
import { horizons, directionLabel } from './model'
import type { ReflectionRequest } from './api/contracts'

const prompts = [{ key: 'learned', label: '배운 점' }, { key: 'missed_variable', label: '놓친 변수' }, { key: 'next_check', label: '다음에 확인할 점' }] as const
export default function FinalReflectionPage() {
  const { sessionId = '' } = useParams()
  const query = useQuery({ queryKey: ['workbook', sessionId], queryFn: ({ signal }) => loadWorkbook(sessionId, signal), retry: false, refetchOnWindowFocus: false })
  if (!query.data) return <QueryState loading={query.isPending} error={query.error} retry={() => void query.refetch()} />
  if (query.data.redirectTo !== null) {
    if (query.isFetching || query.isError) return <QueryState loading={query.isFetching} error={query.error} retry={() => void query.refetch()} />
    return <Navigate to={query.data.redirectTo} replace />
  }
  if (query.data.session.status === 'completed') return <Navigate to={`/learning/${sessionId}`} replace />
  if (query.data.session.status !== 'reflection_pending') return <Shell><Notice title="아직 최종 회고를 작성할 수 없어요">모든 대상의 관찰이 종료되면 작성할 수 있어요.</Notice><Link to={`/learning/${sessionId}/results`} className={linkClass}>관측 결과 보기</Link></Shell>
  return <FinalReflectionEditor key={sessionId} data={query.data} />
}
function FinalReflectionEditor({ data }: { data: WorkbookData }) {
  const sessionId = data.session.id
  const navigate = useNavigate()
  const client = useQueryClient()
  const [answers, setAnswers] = useState({ learned: '', missed_variable: '', next_check: '' })
  const [prompt, setPrompt] = useState<typeof prompts[number]['key']>('learned')
  const [all, setAll] = useState(false)
  const [active, setActive] = useState(data.targets[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const attempt = useRef<{ signature: string; request: ReflectionRequest } | null>(null)
  const allowNavigation = useRef(false)
  const dirty = Object.values(answers).some(value => value.trim())
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !allowNavigation.current && (busy || dirty) && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search))
  useBeforeUnload(event => { if ((dirty || busy) && !allowNavigation.current) { event.preventDefault(); event.returnValue = '' } })
  const target = data.targets.find(t => t.id === active) ?? data.targets[0]
  const outcome = data.outcomes.targets.find(t => t.sessionTargetId === target?.id)
  const save = async () => {
    if (busy || !dirty) return
    const payload = prompts.map(p => ({ promptKey: p.key, body: answers[p.key].trim() })).filter(a => a.body)
    const signature = JSON.stringify(payload)
    if (!attempt.current || attempt.current.signature !== signature) attempt.current = { signature, request: { clientRequestId: crypto.randomUUID(), reflectionType: 'final', answers: payload } }
    const request = attempt.current.request
    setBusy(true); setError(null)
    try {
      try {
        const result = await api.saveFinal(sessionId, request)
        if (result.clientRequestId !== request.clientRequestId || result.sessionStatus !== 'completed') throw new Error('저장 응답을 확인하지 못했어요.')
      } catch (error) {
        // Resolve a lost success response with the accepted clientRequestId, without submitting again.
        const [session, notes] = await Promise.all([api.session(sessionId), api.notes(sessionId)])
        if (session.status !== 'completed' || !notes.some(n => n.clientRequestId === request.clientRequestId && n.reflectionType === 'final')) throw error
      }
      allowNavigation.current = true
      void client.invalidateQueries({ queryKey: ['workbook', sessionId] })
      void client.invalidateQueries({ queryKey: ['assigned-page'] })
      void client.invalidateQueries({ queryKey: ['learning-sessions'] })
      navigate(`/learning/${sessionId}/final-feedback`, { replace: true })
    } catch (error) { setError(error instanceof Error ? error.message : '회고를 저장하지 못했어요. 입력은 유지했어요.') }
    finally { setBusy(false) }
  }
  return <Shell><PageTitle label="WORKBOOK / REFLECTION" title="처음의 생각과 지금의 관점을 잇다" description="모든 대상의 관찰이 종료됐어요. 하나의 질문에만 답해도 회고를 완료할 수 있어요." /><TargetSwitcher targets={data.targets} active={target?.id ?? ''} onChange={setActive} />
    <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,3fr)] items-start gap-12"><section className="space-y-6"><h2 className="text-section">이번 관찰에서 남기고 싶은 생각</h2><fieldset disabled={busy} className="space-y-6"><legend className="sr-only">최종 회고 질문</legend><div className="flex gap-2">{prompts.map(p => <FilterChip key={p.key} selected={prompt === p.key} onClick={() => setPrompt(p.key)}>{p.label}{answers[p.key].trim() ? ' · 작성됨' : ''}</FilterChip>)}</div>{prompts.filter(p => all || p.key === prompt).map(p => <TextArea key={p.key} label={`${p.label} · 선택한 질문`} value={answers[p.key]} onChange={event => { setAnswers(previous => ({ ...previous, [p.key]: event.target.value })); setError(null) }} rows={1} placeholder="처음의 판단과 관찰을 돌아보며 생각을 적어보세요." helperText="답변 1개 이상이면 저장할 수 있어요. 세 질문 모두 작성할 필요는 없습니다." />)}<Button variant="text" className="w-full" onClick={() => setAll(!all)}>{all ? '선택한 질문만 보기' : '다른 질문 작성 보기'}</Button></fieldset>
      {error && <Notice title="회고 저장 실패" error>{error} 답변은 유지했어요. 같은 답변을 다시 저장하면 동일한 요청으로 재시도해요.</Notice>}<Button className="w-full" disabled={!dirty} loading={busy} onClick={() => void save()}>회고 저장하기</Button><Link to={`/learning/${sessionId}/results`} className={`${linkClass} w-full`} aria-disabled={busy}>나중에 하기</Link>
    </section><aside className="space-y-6 rounded-card bg-surface-subtle p-6"><h2 className="text-section">당시 예측과 관찰</h2>{target && horizons.map(h => <div key={h} className="space-y-2"><p className="text-control">{h}거래일 · {directionLabel(target, data.draft[target.id]?.[h]?.direction ?? null)}</p><p className="whitespace-pre-wrap text-meta text-text-secondary">{data.draft[target.id]?.[h]?.reason || '판단 이유 미작성'}</p>{outcome?.observations.filter(o => o.horizon === h).map(o => <p key={o.horizon} className="text-meta text-text-secondary">{o.status === 'ready' ? `${o.observedValue?.toLocaleString('ko-KR') ?? '—'} ${o.unit} · ${o.observationSessionDate ?? '날짜 없음'}` : o.unavailableReason ?? '관측 자료 없음'}</p>)}</div>)}<h3 className="text-control">1·5거래일 중간 메모</h3>{data.notes.filter(n => n.sessionTargetId === target?.id).map(n => <p key={n.id} className="whitespace-pre-wrap text-meta">{n.body} · {formatTime(n.createdAt)}</p>)}<Link to={`/learning/${sessionId}/results`} className={`${linkClass} w-full border border-border-default bg-surface-canvas`}>관측 결과와 메모 보기</Link></aside></div>
    {blocker.state === 'blocked' && <Modal title="저장하지 않은 회고가 있어요" onClose={() => { if (!busy) blocker.reset() }}><p className="text-ui">저장하지 않고 나가면 답변이 사라져요.</p><Button disabled={busy} onClick={() => blocker.reset()}>계속 작성하기</Button><Button variant="secondary" disabled={busy} onClick={() => blocker.proceed()}>저장하지 않고 나가기</Button></Modal>}
  </Shell>
}
