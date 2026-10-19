import { useRef, useState } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/TextField'
import { Notice } from './components/PagePrimitives'
import { Modal } from './components/Modal'
import { learningApi as api } from './api/service'
import type { Horizon } from './model'
import type { ReflectionRequest } from './api/contracts'

export default function ReflectionForm({ sessionId, targetId, horizon, enabled, onSaved }: { sessionId: string; targetId: string; horizon: Horizon; enabled: boolean; onSaved: () => Promise<unknown> }) {
  const [bank, setBank] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const attempts = useRef(new Map<string, { signature: string; request: ReflectionRequest }>())
  const dirty = Object.values(bank).some(value => value.trim())
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (busy || dirty) && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search))
  useBeforeUnload(event => { if (dirty || busy) { event.preventDefault(); event.returnValue = '' } })
  const context = `${targetId}:${horizon}`
  const value = bank[context] ?? ''
  const save = async () => {
    if (busy || !enabled || !value.trim() || horizon === 20) return
    const signature = value.trim()
    let attempt = attempts.current.get(context)
    if (!attempt || attempt.signature !== signature) {
      attempt = { signature, request: { clientRequestId: crypto.randomUUID(), sessionTargetId: targetId, reflectionType: horizon === 1 ? 'day_1' : 'day_5', promptKey: horizon === 1 ? 'new_insight' : 'added_perspective', body: signature } }
      attempts.current.set(context, attempt)
    }
    setBusy(true); setError(null); setSuccess(null)
    try {
      const note = await api.saveNote(sessionId, attempt.request)
      if (note.sessionTargetId !== targetId || note.clientRequestId !== attempt.request.clientRequestId) throw new Error('저장 응답을 확인하지 못했어요. 같은 내용으로 다시 시도해 주세요.')
      setBank(previous => ({ ...previous, [context]: '' })); attempts.current.delete(context)
      setSuccess(context)
      await onSaved()
    } catch (error) { setError(error instanceof Error ? error.message : '저장하지 못했어요. 입력을 유지했어요.') }
    finally { setBusy(false) }
  }
  return <>{horizon !== 20 && <div className="space-y-4"><TextArea label={`${horizon === 1 ? '새롭게 확인한 점' : '추가된 관점'} · 선택`} rows={1} value={value} disabled={busy || !enabled} onChange={e => { setBank(previous => ({ ...previous, [context]: e.target.value })); setError(null); setSuccess(null) }} placeholder="판단에 참고한 요소를 기록해보세요." helperText={enabled ? '비워 두어도 괜찮아요. 저장한 메모는 수정하지 않고 새 메모를 추가해요.' : '해당 기간 관찰이 종료되면 메모를 추가할 수 있어요.'} /><Button variant="secondary" className="w-full" loading={busy} disabled={!enabled || !value.trim()} onClick={() => void save()}>새 메모 저장하기</Button>{error && <Notice title="메모 저장 실패" error>{error} 입력은 유지했어요.</Notice>}{success === context && <Notice title="메모를 저장했어요">저장된 기록에서 확인할 수 있어요.</Notice>}</div>}
    {blocker.state === 'blocked' && <Modal title="저장하지 않은 메모가 있어요" onClose={() => { if (!busy) blocker.reset() }}><p className="text-ui">저장하지 않고 나가면 작성 중인 메모가 사라져요.</p><Button disabled={busy} onClick={() => blocker.reset()}>계속 작성하기</Button><Button variant="secondary" disabled={busy} onClick={() => blocker.proceed()}>저장하지 않고 나가기</Button></Modal>}
  </>
}
