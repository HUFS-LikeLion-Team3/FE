import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Notice, Shell, linkClass } from '../learning/components/PagePrimitives'
import { ReplayResultsView } from './ReplayResultsPage'
import { replayFixture } from './results-fixtures'
import { readReplaySession, type ReplayPreviewSession } from './preview-session'
import type { ReplayReceipt, ReplaySaveRequest, ReplayState } from './model'

const receiptSchema = z.object({ replayId:z.string().min(1), clientRequestId:z.string().min(1), savedAt:z.string().datetime(), answers:z.array(z.object({promptKey:z.enum(['learned','missed_variable','next_check']),body:z.string().trim().min(1)})).min(1).max(3) }).refine(value=>new Set(value.answers.map(a=>a.promptKey)).size===value.answers.length)
const scenarios = ['ready','loading','error','locked','empty','missing-outcomes','unavailable','missing-series','invalid-series','save-error','lost-response','saved']
function readReceipt(key: string, replayId: string): ReplayReceipt | null {
  try { const parsed=receiptSchema.safeParse(JSON.parse(sessionStorage.getItem(key) ?? 'null')); return parsed.success && parsed.data.replayId === replayId ? parsed.data : null } catch { return null }
}
export default function ReplayPreviewPage() {
  const [params] = useSearchParams()
  const from = params.get('from')
  const flow = from ? readReplaySession(from) : null
  if (from && (!flow || flow.id !== params.get('session'))) return <Shell section="/explore"><Notice title="이 Replay의 학습 기록을 확인할 수 없어요">지난 뉴스에서 예측을 제출한 뒤 결과를 열어주세요.</Notice><Link to="/replay" className={linkClass}>지난 뉴스 목록으로</Link></Shell>
  return <PreviewSessionResults key={flow?.id ?? 'standalone'} flow={flow ?? undefined} />
}
function PreviewSessionResults({ flow }: { flow?: ReplayPreviewSession }) {
  const [params,setParams] = useSearchParams()
  const scenario = scenarios.includes(params.get('scenario') ?? '') ? params.get('scenario')! : 'ready'
  const replayId = flow?.id ?? 'preview-replay'
  const key = flow ? `finsight.dev.replay-receipt:${replayId}` : 'finsight.dev.replay-receipt'
  const [persisted, setPersisted] = useState(() => readReceipt(key, replayId))
  const failures = useRef(new Set<string>())
  const accepted = useRef(new Map<string, ReplayReceipt>())
  const data = replayFixture(scenario, flow)
  data.receipt = data.receipt ?? persisted
  const changeScenario = (value: string) => setParams(previous => { const next = new URLSearchParams(previous); next.set('scenario',value); return next })
  const save = async (request: ReplaySaveRequest): Promise<ReplayReceipt> => {
    await new Promise(resolve=>setTimeout(resolve,350))
    if (request.replayId !== data.replayId) throw new Error('다른 Replay의 회고는 저장하지 않아요.')
    const existing = accepted.current.get(request.clientRequestId) ?? readReceipt(key, replayId)
    if (existing?.clientRequestId === request.clientRequestId) {
      if (JSON.stringify(existing.answers)!==JSON.stringify(request.answers)) throw new Error('동일한 요청의 답변이 달라졌어요.')
      setPersisted(existing); return existing
    }
    if (existing) throw new Error('이미 저장된 회고가 있어요. 새로고침해서 저장한 원문을 확인해 주세요.')
    if (scenario==='save-error' && !failures.current.has(request.clientRequestId)) { failures.current.add(request.clientRequestId); throw new Error('개발 미리보기의 일시적인 저장 실패예요.') }
    const receipt = receiptSchema.parse({...request,savedAt:new Date().toISOString()})
    sessionStorage.setItem(key,JSON.stringify(receipt)); accepted.current.set(request.clientRequestId,receipt)
    if (scenario==='lost-response' && !failures.current.has(request.clientRequestId)) { failures.current.add(request.clientRequestId); throw new Error('저장 응답을 받지 못한 상황의 예시예요.') }
    setPersisted(receipt); return receipt
  }
  const state: ReplayState = flow && (!flow.submittedAt || !flow.feedbackReadAt || !flow.resultsRevealedAt) ? 'locked' : ['loading','error','locked','empty'].includes(scenario) ? scenario as ReplayState : 'ready'
  return <>
    <aside className="border-b border-border-default bg-surface-subtle px-12 py-3 text-meta"><div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4"><strong>P1-03 개발 미리보기</strong><span>가상 관측값·거래일 · 저장은 이 탭에서만 유지 · 실제 서버 저장 아님</span><label className="ml-auto flex items-center gap-2">상태<select className="min-h-11 rounded-control border border-border-control bg-surface-canvas px-3" value={scenario} onChange={event=>changeScenario(event.target.value)}>{scenarios.map(value=><option key={value}>{value}</option>)}</select></label>{persisted && <Button variant="text" onClick={()=>{sessionStorage.removeItem(key);location.reload()}}>미리보기 저장 초기화</Button>}</div></aside>
    <ReplayResultsView data={state==='ready'?data:undefined} state={state} retry={()=>changeScenario('ready')} save={save} preview />
    {flow && <nav className="mx-auto max-w-[1200px] py-6"><Link to="/replay" className={linkClass}>지난 뉴스 목록으로</Link></nav>}
  </>
}
