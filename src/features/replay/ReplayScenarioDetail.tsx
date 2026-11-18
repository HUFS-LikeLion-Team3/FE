import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { Modal } from '../learning/components/Modal'
import { linkClass, Notice, PageTitle, Shell } from '../learning/components/PagePrimitives'
import { formatReferenceMonth, replayCategories, replayTargets, type ReplayScenario } from './api'
import { newReplaySession, readReplaySession, saveReplaySession } from './preview-session'

export default function ReplayScenarioDetail({ scenario, selecting }: { scenario: ReplayScenario; selecting: boolean }) {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [session, setSession] = useState(() => readReplaySession(scenario.id) ?? newReplaySession(scenario))
  const [sourceOpen, setSourceOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (selecting && session.submittedAt) return <Navigate to={`/replay/${scenario.id}/feedback${search}`} replace />
  const candidates = replayTargets.filter(target => scenario.targetIds.some(id => id === target.id))
  const next = () => {
    if (!session.targetIds.length || session.targetIds.length > 3) { setError('관찰할 대상을 1~3개 선택해 주세요.'); return }
    try { saveReplaySession(session); navigate(`/replay/${scenario.id}/predict${search}`) }
    catch { setError('이 탭에 선택을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.') }
  }
  return selecting ? <Shell section="/explore"><PageTitle label="REPLAY / TARGETS" title="무엇을 함께 관찰할까요?" description={`${scenario.title} · 최대 3개 대상을 선택할 수 있어요.`} />
    <div className="flex flex-wrap gap-2" aria-label="관찰 대상 선택">{candidates.map(target => <FilterChip key={target.id} className="min-w-[240px]" selected={session.targetIds.some(id => id === target.id)} onClick={() => {
      setError(null)
      setSession(previous => ({ ...previous, targetIds: previous.targetIds.some(id => id === target.id) ? previous.targetIds.filter(id => id !== target.id) : [...previous.targetIds, target.id as typeof previous.targetIds[number]].slice(0, 3) }))
    }}>{target.name}</FilterChip>)}</div>
    <Notice title="발표 이후의 수치는 아직 숨겨요">후보는 당시 뉴스와 관련된 관찰 대상이에요. 선택은 정답이 아니며, 나중에 실제 결과와 함께 돌아봅니다.</Notice>
    {error && <Notice title="선택을 확인해 주세요" error>{error}</Notice>}
    <Button className="w-full" onClick={next}>선택한 대상 예측 작성</Button><Link to={`/replay/${scenario.id}${search}`} className={linkClass}>당시 뉴스로 돌아가기</Link>
  </Shell> : <Shell section="/explore"><PageTitle label="REPLAY / FACT BRIEFING" title={scenario.title} description={`${formatReferenceMonth(scenario.referenceMonth)} · ${replayCategories.find(item => item.key === scenario.category)!.label} · 시안용 학습 자료`} />
    <Link to={`/replay${search}`} className={linkClass}>← 지난 뉴스 목록으로</Link>
    <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,3fr)] items-start gap-12">
      <section className="min-w-0 space-y-6"><h2 className="text-section">발표 당시의 사실부터 읽어보세요</h2><p className="text-ui leading-[1.85] text-text-secondary">가상의 발표로 구성한 시안용 예시예요. 발표 당시 확인할 수 있었던 사실을 읽고, 이후의 시장 변화는 스스로 예측해 보세요.</p>
        <Notice title={scenario.announcement ? '발표 수치 · 가상 학습 예시' : '발표 자료 · 가상 학습 예시'}><p className="text-ui text-text-primary">{scenario.announcement ?? scenario.keywords}</p><p className="mt-3">기준 시점 · 가상 발표 당시 공개 시각<br />출처 · {scenario.sourceNote}</p></Notice>
        {scenario.facts.map((fact, index) => <section key={index} className="space-y-6"><h3 className="text-control font-medium text-brand-primary">{String(index + 1).padStart(2, '0')} / {index === 0 ? '발표 내용' : '함께 확인할 개념'}</h3><p className="text-ui leading-[1.85] text-text-secondary">{fact}</p></section>)}
        <Notice title="자료의 기준 시점">브리핑과 최초 피드백은 당시 학습 기준 시점까지 공개된 자료만 사용해요. 과거 결과는 예측과 피드백을 확인한 뒤 열어볼 수 있어요.</Notice>
        <Button variant="secondary" className="w-full" onClick={() => setSourceOpen(true)}>뉴스 원문 보기 ↗</Button>
      </section>
      <aside className="min-w-0 space-y-6"><Notice title="과거의 결과는 예측 뒤에 공개해요">대상별 1·5·20거래일 방향과 이유를 먼저 기록합니다. AI 피드백 확인 후 직접 결과를 열어볼 수 있어요.</Notice>
        <h2 className="text-section">함께 관찰할 대상</h2><div className="space-y-1 text-ui text-text-secondary">{candidates.map(target => <p key={target.id}>{target.name}</p>)}</div>
        <Link to={`/replay/${scenario.id}/${session.submittedAt ? 'feedback' : session.targetIds.length ? 'predict' : 'targets'}${search}`} className={`${linkClass} w-full bg-brand-primary text-surface-canvas hover:bg-brand-hover`}>{session.submittedAt ? '최초 피드백 이어서 보기' : session.targetIds.length ? '이어서 예측 작성하기' : '대상 선택하고 시작하기'}</Link>
        <p className="text-meta text-text-muted">기간별 실시간 대기는 없어요. 과거에 확정된 결과를 한 번에 살펴봅니다.</p>
      </aside>
    </div>
    {sourceOpen && <Modal title="원문에 과거 결과가 포함될 수 있어요" onClose={() => setSourceOpen(false)}><p className="text-ui">실제 학습에서는 원문을 열면 발표 이후 결과가 드러날 수 있어요. 이번 자료는 가상의 시안용 예시여서 실제 원문 링크는 제공하지 않아요.</p><p className="text-meta text-text-muted">출처 · {scenario.sourceNote}</p><Button onClick={() => setSourceOpen(false)}>당시 뉴스 계속 읽기</Button></Modal>}
  </Shell>
}
