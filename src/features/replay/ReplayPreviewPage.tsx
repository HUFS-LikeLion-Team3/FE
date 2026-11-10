import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { ReplayResultsView } from './ReplayResultsPage'
import { replayFixture } from './fixtures'
import type { ReplayReceipt, ReplaySaveRequest, ReplayState } from './model'

const key = 'finsight.dev.replay-receipt'
const receiptSchema = z.object({ replayId:z.literal('preview-replay'), clientRequestId:z.string(), savedAt:z.string().datetime(), answers:z.array(z.object({promptKey:z.enum(['learned','missed_variable','next_check']),body:z.string().trim().min(1)})).min(1).max(3) }).refine(value=>new Set(value.answers.map(a=>a.promptKey)).size===value.answers.length)
const scenarios = ['ready','loading','error','locked','empty','missing-outcomes','unavailable','missing-series','invalid-series','save-error','lost-response','saved']
function readReceipt(): ReplayReceipt | null {
  try { const parsed=receiptSchema.safeParse(JSON.parse(sessionStorage.getItem(key) ?? 'null')); return parsed.success ? parsed.data : null } catch { return null }
}
export default function ReplayPreviewPage() {
  const [params,setParams] = useSearchParams()
  const scenario = scenarios.includes(params.get('scenario') ?? '') ? params.get('scenario')! : 'ready'
  const [persisted, setPersisted] = useState(readReceipt)
  const failures = useRef(new Set<string>())
  const accepted = useRef(new Map<string, ReplayReceipt>())
  const data = replayFixture(scenario)
  // Error/empty/locked scenarios never mount result data, even after an earlier save.
  data.receipt = data.receipt ?? persisted
  const retry = () => setParams({scenario:'ready'})
  const save = async (request: ReplaySaveRequest): Promise<ReplayReceipt> => {
    await new Promise(resolve=>setTimeout(resolve,600))
    if (request.replayId !== data.replayId) throw new Error('다른 Replay의 회고는 저장하지 않아요.')
    const existing = accepted.current.get(request.clientRequestId) ?? readReceipt()
    if (existing?.clientRequestId === request.clientRequestId) {
      if (JSON.stringify(existing.answers)!==JSON.stringify(request.answers)) throw new Error('동일한 요청의 답변이 달라졌어요.')
      setPersisted(existing)
      return existing
    }
    if (scenario==='save-error' && !failures.current.has(request.clientRequestId)) { failures.current.add(request.clientRequestId); throw new Error('개발 미리보기의 일시적인 저장 실패예요.') }
    const receipt = receiptSchema.parse({...request,savedAt:new Date().toISOString()})
    sessionStorage.setItem(key,JSON.stringify(receipt)); accepted.current.set(request.clientRequestId,receipt)
    if (scenario==='lost-response' && !failures.current.has(request.clientRequestId)) { failures.current.add(request.clientRequestId); throw new Error('저장 응답을 받지 못한 상황의 예시예요.') }
    setPersisted(receipt)
    return receipt
  }
  const state: ReplayState = ['loading','error','locked','empty'].includes(scenario) ? scenario as ReplayState : 'ready'
  return <>
    <aside className="border-b border-border-default bg-surface-subtle px-12 py-3 text-meta"><div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4"><strong>P1-03 개발 미리보기</strong><span>시안용 목 데이터 · 저장은 이 탭에서만 유지 · 실제 서버 저장 아님</span><label className="ml-auto flex items-center gap-2">상태<select className="min-h-11 rounded-control border border-border-control bg-surface-canvas px-3" value={scenario} onChange={event=>setParams({scenario:event.target.value})}>{scenarios.map(value=><option key={value}>{value}</option>)}</select></label>{persisted && <Button variant="text" onClick={()=>{sessionStorage.removeItem(key); location.reload()}}>미리보기 저장 초기화</Button>}</div></aside>
    <ReplayResultsView data={state==='ready'?data:undefined} state={state} retry={retry} save={save} preview />
  </>
}
