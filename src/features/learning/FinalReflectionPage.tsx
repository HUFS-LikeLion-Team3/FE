import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
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
  const notes = data.notes.filter(note => note.sessionTargetId === target?.id && (note.reflectionType === 'day_1' || note.reflectionType === 'day_5'))
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
  return <Shell responsive>
    <PageTitle label="WORKBOOK / REFLECTION" title="처음의 생각과 지금의 관점을 잇다" description="뉴스와 이전 판단을 돌아보고, 관찰을 통해 달라진 생각을 기록해 보세요." />
    <section aria-labelledby="reflection-summary" className="space-y-6 rounded-card bg-surface-subtle p-4 sm:p-6">
      <h2 id="reflection-summary" className="text-section">당시 예측과 관찰</h2>
      <p className="break-words text-control font-medium">{data.news.title}</p>
      <TargetSwitcher targets={data.targets} active={target?.id ?? ''} onChange={setActive} />
      {target && <div className="grid gap-4 md:grid-cols-3">
        {horizons.map(horizon => {
          const prediction = data.draft[target.id]?.[horizon]
          const observation = outcome?.observations.find(item => item.horizon === horizon)
          return <article key={horizon} className="min-w-0 space-y-3 rounded-card bg-surface-canvas p-4">
            <h3 className="text-control font-medium">{horizon}거래일</h3>
            <dl className="space-y-3 break-words text-meta">
              <div><dt className="font-medium">예측 방향</dt><dd>{directionLabel(target, prediction?.direction ?? null)}</dd></div>
              <div><dt className="font-medium">판단 이유</dt><dd className="whitespace-pre-wrap">{prediction?.reason || '판단 이유 미작성'}</dd></div>
              <div><dt className="font-medium">실제 관측 결과</dt><dd>{
                observation?.status === 'ready'
                  ? `${observation.observedValue?.toLocaleString('ko-KR') ?? '—'} ${observation.unit} · ${observation.observationSessionDate ?? '날짜 없음'}`
                  : observation?.unavailableReason ?? (observation?.status === 'pending' ? '관측 결과 확인 중' : '관측 자료 없음')
              }</dd></div>
            </dl>
          </article>
        })}
      </div>}
      <div className="space-y-2">
        <h3 className="text-control font-medium">1·5거래일 중간 메모</h3>
        {notes.length ? notes.map(note => <p key={note.id} className="whitespace-pre-wrap break-words text-meta">{note.body} · {formatTime(note.createdAt)}</p>) : <p className="text-meta text-text-muted">아직 저장된 메모가 없어요.</p>}
      </div>
      <Link to={`/learning/${sessionId}/results`} className={`${linkClass} w-full border border-border-default bg-surface-canvas`}>관측 결과와 메모 보기</Link>
    </section>
    <section aria-labelledby="reflection-questions" className="space-y-6">
      <h2 id="reflection-questions" className="text-section">이번 관찰에서 남기고 싶은 생각</h2>
      <p id="reflection-help" className="text-meta text-text-secondary">세 항목 중 하나만 작성해도 저장할 수 있어요.</p>
      <fieldset disabled={busy} aria-describedby="reflection-help" className="space-y-4">
        <legend className="sr-only">최종 회고 질문</legend>
        {prompts.map(({ key, label }) => <TextArea key={key} label={label} value={answers[key]} onChange={event => {
          setAnswers(previous => ({ ...previous, [key]: event.target.value }))
          setError(null)
        }} rows={3} />)}
      </fieldset>
      {error && <Notice title="회고 저장 실패" error>{error} 답변은 유지했어요. 같은 답변을 다시 저장하면 동일한 요청으로 재시도해요.</Notice>}
      <Button className="w-full" disabled={!dirty} loading={busy} onClick={() => void save()}>회고 저장하기</Button>
      <Link to={`/learning/${sessionId}/results`} className={`${linkClass} w-full`} aria-disabled={busy}>나중에 하기</Link>
    </section>
    {blocker.state === 'blocked' && <Modal title="저장하지 않은 회고가 있어요" onClose={() => { if (!busy) blocker.reset() }}><p className="text-ui">저장하지 않고 나가면 답변이 사라져요.</p><Button disabled={busy} onClick={() => blocker.reset()}>계속 작성하기</Button><Button variant="secondary" disabled={busy} onClick={() => blocker.proceed()}>저장하지 않고 나가기</Button></Modal>}
  </Shell>
}
