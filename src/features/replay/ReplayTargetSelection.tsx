import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { linkClass, Notice, PageTitle, Shell } from '../learning/components/PagePrimitives'
import { replayTargets, type ReplayScenario } from './api'
import { newReplaySession, readReplaySession, saveReplaySession } from './preview-session'

/**
 * 개발 환경 데모: 시안용 시나리오의 관찰 대상 선택.
 * Replay 세션 생성 API가 연결되기 전까지 이 탭의 sessionStorage에만 저장한다.
 */
export default function ReplayTargetSelection({ scenario }: { scenario: ReplayScenario }) {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [session, setSession] = useState(() => readReplaySession(scenario.id) ?? newReplaySession(scenario))
  const [error, setError] = useState<string | null>(null)
  if (session.submittedAt) return <Navigate to={`/replay/${scenario.id}/feedback${search}`} replace />
  const candidates = replayTargets.filter(target => scenario.targetIds.some(id => id === target.id))
  const next = () => {
    if (!session.targetIds.length || session.targetIds.length > 3) { setError('관찰할 대상을 1~3개 선택해 주세요.'); return }
    try { saveReplaySession(session); navigate(`/replay/${scenario.id}/predict${search}`) }
    catch { setError('이 탭에 선택을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.') }
  }
  return <Shell section="/explore"><PageTitle label="REPLAY / TARGETS" title="무엇을 함께 관찰할까요?" description={`${scenario.title} · 최대 3개 대상을 선택할 수 있어요.`} />
    <div className="flex flex-wrap gap-2" aria-label="관찰 대상 선택">{candidates.map(target => <FilterChip key={target.id} className="min-w-60" selected={session.targetIds.some(id => id === target.id)} onClick={() => {
      setError(null)
      setSession(previous => ({ ...previous, targetIds: previous.targetIds.some(id => id === target.id) ? previous.targetIds.filter(id => id !== target.id) : [...previous.targetIds, target.id as typeof previous.targetIds[number]].slice(0, 3) }))
    }}>{target.name}</FilterChip>)}</div>
    <Notice title="발표 이후의 수치는 아직 숨겨요">후보는 당시 뉴스와 관련된 관찰 대상이에요. 선택은 정답이 아니며, 나중에 실제 결과와 함께 돌아봅니다.</Notice>
    {error && <Notice title="선택을 확인해 주세요" error>{error}</Notice>}
    <Button className="w-full" onClick={next}>선택한 대상 예측 작성</Button><Link to={`/replay/${scenario.id}${search}`} className={linkClass}>당시 뉴스로 돌아가기</Link>
  </Shell>
}
