import { useRef, useState } from 'react'
import { Link, useBeforeUnload, useBlocker } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { TextArea } from '@/components/ui/TextField'
import { Modal } from '../learning/components/Modal'
import { Notice, linkClass } from '../learning/components/PagePrimitives'
import { formatTime } from '../learning/api/page-data'
import { matchesReplayReceipt, replayPrompts, type ReplayData, type ReplayPrompt, type ReplaySave, type ReplaySaveRequest } from './model'

export default function ReplayReflection({ data, save, prediction }: { data: ReplayData; save?: ReplaySave; prediction: { label: string; reason: string } }) {
  const [answers, setAnswers] = useState({ learned: '', missed_variable: '', next_check: '' })
  const [prompt, setPrompt] = useState<ReplayPrompt>('learned')
  const [all, setAll] = useState(false)
  const [receipt, setReceipt] = useState(data.receipt)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const attempt = useRef<{ signature: string; request: ReplaySaveRequest } | null>(null)
  const saved = useRef(!!data.receipt)
  const dirty = !receipt && Object.values(answers).some(value => value.trim())
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !saved.current && (dirty || inFlight.current) && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search))
  useBeforeUnload(event => { if (!saved.current && (dirty || inFlight.current)) { event.preventDefault(); event.returnValue = '' } })
  const submit = async () => {
    if (!save || inFlight.current || !dirty || saved.current) return
    const payload = replayPrompts.map(p => ({ promptKey: p.key, body: answers[p.key].trim() })).filter(a => a.body)
    const signature = JSON.stringify(payload)
    if (!attempt.current || attempt.current.signature !== signature) attempt.current = { signature, request: { replayId: data.replayId, clientRequestId: crypto.randomUUID(), answers: payload } }
    inFlight.current = true; setBusy(true); setError(null)
    try {
      const result = await save(attempt.current.request)
      if (!matchesReplayReceipt(result, attempt.current.request)) throw new Error('저장 응답을 확인하지 못했어요. 같은 내용으로 다시 저장해 주세요.')
      saved.current = true; setReceipt(result)
    } catch (error) { setError(error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.') }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,5fr)] items-start gap-12">
    <aside className="min-w-0 space-y-6 rounded-card bg-surface-subtle p-6" aria-label="내가 남긴 판단">
      <p className="font-mono text-label text-brand-primary">MY PREDICTION</p>
      <h2 className="text-section">내가 남긴 판단</h2>
      <div className="space-y-2"><h3 className="text-control font-medium">{prediction.label}</h3><p className="whitespace-pre-wrap break-words text-meta text-text-muted">{prediction.reason}</p></div>
    </aside>
    <section className="min-w-0 space-y-6" aria-label="통합 회고">
    {receipt ? <>
      <Notice title="Replay 학습 완료">1·5·20거래일 관찰을 묶어 통합 회고를 남겼어요.</Notice>
      <h2 className="text-section">저장한 통합 회고</h2>
      {receipt.answers.map(answer => <section key={answer.promptKey} className="space-y-3 rounded-card bg-surface-subtle p-4"><h3 className="text-control font-medium">{replayPrompts.find(p => p.key === answer.promptKey)?.label}</h3><p className="whitespace-pre-wrap break-words text-ui">{answer.body}</p></section>)}
      <p className="text-meta text-text-muted">{formatTime(receipt.savedAt)} · 저장한 회고 원문 · 읽기 전용</p>
      <Link to="/learning" className={`${linkClass} w-full bg-brand-primary text-surface-canvas`}>학습 기록 보기</Link>
    </> : <>
      <h2 className="text-section">세 기간을 한 번에 돌아보기</h2>
      <p className="text-ui text-text-secondary">1·5·20거래일의 차이를 살펴보고, 다음에 확인할 관점을 남겨보세요.</p>
      <fieldset disabled={busy || !save} className="min-w-0 space-y-6"><legend className="sr-only">통합 회고 질문</legend>
        <div className="flex flex-wrap gap-2">{replayPrompts.map(p => <FilterChip key={p.key} selected={p.key === prompt} onClick={() => setPrompt(p.key)}>{p.label}{answers[p.key].trim() ? ' · 작성됨' : ''}</FilterChip>)}</div>
        {replayPrompts.filter(p => all || p.key === prompt).map(p => <TextArea key={p.key} label={`${p.label} · 선택한 질문`} rows={5} className="min-h-32 border-border-default" value={answers[p.key]} onChange={event => { setAnswers(previous => ({ ...previous, [p.key]: event.target.value })); setError(null) }} placeholder="세 기간을 살펴보며 남기고 싶은 생각을 적어보세요." helperText="세 기간을 함께 돌아보며 한 질문 이상 답해주세요." />)}
        <Button variant="text" className="w-full" onClick={() => setAll(!all)}>{all ? '선택한 질문만 보기' : '다른 질문 작성 보기'}</Button>
      </fieldset>
      <Notice title={save ? '하나의 통합 회고로 저장해요' : '통합 회고 저장은 준비 중이에요'}>{save ? '1일·5일 메모를 따로 작성하지 않아요. 한 질문 이상 답하면 Replay 학습 기록으로 저장할 수 있어요.' : '서버 저장 기능이 연결되면 이곳에서 회고를 남길 수 있어요.'}</Notice>
      {error && <Notice title="통합 회고를 저장하지 못했어요" error>{error} 작성한 내용은 유지했어요. 같은 내용으로 다시 저장해 주세요.</Notice>}
      <Button className="w-full" disabled={!dirty || !save} loading={busy} loadingLabel="통합 회고를 저장하고 있어요…" onClick={() => void submit()}>{error ? '다시 저장하기' : '통합 회고 저장하기'}</Button>
      <Link to="/learning" onClick={event => { if (inFlight.current) event.preventDefault() }} aria-disabled={busy} className={`${linkClass} w-full`}>나중에 하기</Link>
    </>}
    {data.feedbackHref && <Link to={data.feedbackHref} onClick={event => { if (inFlight.current) event.preventDefault() }} aria-disabled={busy} className={`${linkClass} w-full`}>최초 AI 피드백 다시 보기</Link>}
    </section>
    {blocker.state === 'blocked' && <Modal title="작성 중인 회고를 남겨두고 나갈까요?" onClose={() => { if (!inFlight.current) blocker.reset() }}><p className="text-ui">저장하지 않은 내용은 사라져요. 계속 작성하거나 저장하지 않고 나갈 수 있어요.</p><Button disabled={busy} onClick={() => blocker.reset()}>계속 작성하기</Button><Button variant="secondary" disabled={busy} onClick={() => blocker.proceed()}>저장하지 않고 나가기</Button></Modal>}
  </div>
}
